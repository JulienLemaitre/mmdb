import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/utils/db";
import { REVIEW_STATE, REVIEWED_ENTITY_TYPE } from "@prisma/client";
import { ChecklistEntityType, getChecklistFields, isDoNotReviewTwice } from "@/utils/ReviewChecklistSchema";

function json(data: unknown, init?: any) {
  return NextResponse.json(data as any, init as any);
}

// Types for incoming payload (MVP)
type ChecklistStateItem = {
  entityType: ChecklistEntityType;
  entityId: string;
  fieldPath: string;
  checked: boolean;
};

export async function POST(req: Request, { params }: any) {
  try {
    const session = await getServerSession();
    if (!session || !session.user) {
      return json({ error: "[gAUTH001] Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;
    if (!role || !["REVIEWER", "ADMIN"].includes(role)) {
      return json({ error: "[gAUTH002] Forbidden: reviewer role required" }, { status: 403 });
    }

    const reviewId = params?.reviewId;
    if (!reviewId) {
      return json({ error: "[gINPUT010] reviewId is required in route params" }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    const checklistState: ChecklistStateItem[] | undefined = body?.checklistState;
    const overallComment: string | undefined = body?.overallComment;

    if (!Array.isArray(checklistState)) {
      return json({ error: "[gINPUT011] checklistState array is required" }, { status: 400 });
    }

    // Load review and authorize: only owner can submit as per specs (admin submit is not allowed here)
    const review = await db.review.findUnique({
      where: { id: reviewId },
      select: { id: true, creatorId: true, state: true, mMSourceId: true },
    });
    if (!review) return json({ error: "[gNF002] Review not found" }, { status: 404 });

    const isOwner = review.creatorId === session.user.id;
    if (!isOwner) {
      return json({ error: "[gAUTH004] Forbidden: only owner can submit this review" }, { status: 403 });
    }

    if (review.state !== REVIEW_STATE.IN_REVIEW) {
      return json({ error: "[gBUS010] Review is not active (IN_REVIEW)" }, { status: 400 });
    }

    // Load the MM Source graph needed to recompute required checklist items (reuse logic from overview)
    const mmSource = await db.mMSource.findUnique({
      where: { id: review.mMSourceId },
      select: {
        id: true,
        references: { select: { id: true } },
        contributions: { select: { id: true, personId: true, organizationId: true } },
        pieceVersions: {
          select: {
            rank: true,
            pieceVersion: {
              select: {
                id: true,
                piece: { select: { id: true, composerId: true, collectionId: true } },
                movements: {
                  select: {
                    id: true,
                    sections: {
                      select: {
                        id: true,
                        tempoIndication: { select: { id: true } },
                      },
                      orderBy: { rank: "asc" },
                    },
                  },
                  orderBy: { rank: "asc" },
                },
              },
            },
          },
          orderBy: { rank: "asc" },
        },
        metronomeMarks: { select: { id: true } },
      },
    });

    if (!mmSource) return json({ error: "[gNF001] MMSource not found" }, { status: 404 });

    // Collect entity IDs for do-not-review-twice resolution
    const personIds = new Set<string>();
    const orgIds = new Set<string>();
    const collectionIds = new Set<string>();
    const pieceIds = new Set<string>();

    for (const pvJoin of mmSource.pieceVersions) {
      const pv = pvJoin.pieceVersion;
      if (pv.piece?.id) pieceIds.add(pv.piece.id);
      if (pv.piece?.composerId) personIds.add(pv.piece.composerId);
      if (pv.piece?.collectionId) collectionIds.add(pv.piece.collectionId);
    }
    for (const c of mmSource.contributions) {
      if (c.personId) personIds.add(c.personId);
      if (c.organizationId) orgIds.add(c.organizationId);
    }

    // Build exclusions from ReviewedEntity
    const reviewed = await db.reviewedEntity.findMany({
      where: {
        OR: [
          { entityType: REVIEWED_ENTITY_TYPE.PERSON, entityId: { in: Array.from(personIds) } },
          { entityType: REVIEWED_ENTITY_TYPE.ORGANIZATION, entityId: { in: Array.from(orgIds) } },
          { entityType: REVIEWED_ENTITY_TYPE.COLLECTION, entityId: { in: Array.from(collectionIds) } },
          { entityType: REVIEWED_ENTITY_TYPE.PIECE, entityId: { in: Array.from(pieceIds) } },
        ],
      },
      select: { entityType: true, entityId: true },
    });

    const exclusions: Record<ChecklistEntityType, Set<string>> = {
      MM_SOURCE: new Set(),
      COLLECTION: new Set(reviewed.filter(r => r.entityType === REVIEWED_ENTITY_TYPE.COLLECTION).map(r => r.entityId)),
      PIECE: new Set(reviewed.filter(r => r.entityType === REVIEWED_ENTITY_TYPE.PIECE).map(r => r.entityId)),
      PIECE_VERSION: new Set(),
      MOVEMENT: new Set(),
      SECTION: new Set(),
      TEMPO_INDICATION: new Set(),
      METRONOME_MARK: new Set(),
      REFERENCE: new Set(),
      CONTRIBUTION: new Set(),
      PERSON: new Set(reviewed.filter(r => r.entityType === REVIEWED_ENTITY_TYPE.PERSON).map(r => r.entityId)),
      ORGANIZATION: new Set(reviewed.filter(r => r.entityType === REVIEWED_ENTITY_TYPE.ORGANIZATION).map(r => r.entityId)),
    };

    type ChecklistItem = { entityType: ChecklistEntityType; entityId: string; fieldPath: string; label: string; required: boolean };

    const requiredItems: ChecklistItem[] = [];

    function pushFields(entityType: ChecklistEntityType, entityId: string) {
      if (isDoNotReviewTwice(entityType) && exclusions[entityType].has(entityId)) return;
      const fields = getChecklistFields(entityType);
      for (const f of fields) {
        if (f.meta?.required === false) continue; // Only required fields for server validation
        requiredItems.push({ entityType, entityId, fieldPath: f.path, label: f.label, required: true });
      }
    }

    // MM_SOURCE
    pushFields("MM_SOURCE", mmSource.id);
    // References
    for (const ref of mmSource.references) pushFields("REFERENCE", ref.id);
    // Contributions and linked person/org
    for (const co of mmSource.contributions) {
      pushFields("CONTRIBUTION", co.id);
      if (co.personId) pushFields("PERSON", co.personId);
      if (co.organizationId) pushFields("ORGANIZATION", co.organizationId);
    }
    // Piece graph
    const tempoIndicationIdsAdded = new Set<string>();
    for (const pvJoin of mmSource.pieceVersions) {
      const pv = pvJoin.pieceVersion;
      pushFields("PIECE_VERSION", pv.id);
      if (pv.piece?.id) pushFields("PIECE", pv.piece.id);
      if (pv.piece?.collectionId) pushFields("COLLECTION", pv.piece.collectionId);
      for (const mv of pv.movements) {
        pushFields("MOVEMENT", mv.id);
        for (const s of mv.sections) {
          pushFields("SECTION", s.id);
          if (s.tempoIndication && !tempoIndicationIdsAdded.has(s.tempoIndication.id)) {
            tempoIndicationIdsAdded.add(s.tempoIndication.id);
            pushFields("TEMPO_INDICATION", s.tempoIndication.id);
          }
        }
      }
    }
    // Metronome marks
    for (const mm of mmSource.metronomeMarks) pushFields("METRONOME_MARK", mm.id);

    // Validate completeness
    const encodeKey = (et: string, id: string, fp: string) => `${et}:${id}:${fp}`;
    const checkedSet = new Set(
      checklistState.filter((c) => c && c.checked === true).map((c) => encodeKey(c.entityType, c.entityId, c.fieldPath)),
    );
    const missing: { entityType: ChecklistEntityType; entityId: string; fieldPath: string }[] = [];
    for (const it of requiredItems) {
      const key = encodeKey(it.entityType, it.entityId, it.fieldPath);
      if (!checkedSet.has(key)) missing.push({ entityType: it.entityType, entityId: it.entityId, fieldPath: it.fieldPath });
    }

    if (missing.length > 0) {
      return json(
        {
          error: "[gVAL001] Checklist incomplete",
          details: { missingCount: missing.length, missing },
        },
        { status: 400 },
      );
    }

    // Prepare ReviewedEntity upserts for PERSON/ORGANIZATION/COLLECTION/PIECE in scope (exclude those already in ReviewedEntity via skipDuplicates)
    const reviewedRows: { entityType: REVIEWED_ENTITY_TYPE; entityId: string; reviewedById: string; reviewId: string }[] = [];

    for (const id of personIds) reviewedRows.push({ entityType: REVIEWED_ENTITY_TYPE.PERSON, entityId: id, reviewedById: session.user.id, reviewId });
    for (const id of orgIds) reviewedRows.push({ entityType: REVIEWED_ENTITY_TYPE.ORGANIZATION, entityId: id, reviewedById: session.user.id, reviewId });
    for (const id of collectionIds) reviewedRows.push({ entityType: REVIEWED_ENTITY_TYPE.COLLECTION, entityId: id, reviewedById: session.user.id, reviewId });
    for (const id of pieceIds) reviewedRows.push({ entityType: REVIEWED_ENTITY_TYPE.PIECE, entityId: id, reviewedById: session.user.id, reviewId });

    const approvedAt = new Date();

    const result = await db.$transaction(async (tx) => {
      // Flip review + source states
      await tx.review.update({
        where: { id: reviewId },
        data: { state: REVIEW_STATE.APPROVED, endedAt: approvedAt, overallComment: overallComment ?? null },
      });
      await tx.mMSource.update({
        where: { id: review.mMSourceId },
        data: { reviewState: REVIEW_STATE.APPROVED },
      });

      let reviewedEntitiesUpserted = 0;
      if (reviewedRows.length > 0) {
        const res = await tx.reviewedEntity.createMany({ data: reviewedRows, skipDuplicates: true });
        reviewedEntitiesUpserted = res.count ?? 0;
      }

      return { reviewedEntitiesUpserted };
    });

    return json({ ok: true, reviewId, approvedAt, counts: { requiredItems: requiredItems.length, checkedItems: checkedSet.size, reviewedEntitiesUpserted: result.reviewedEntitiesUpserted } });
  } catch (err) {
    console.error("/api/reviews/[reviewId]/submit error:", err);
    return json({ error: "[gUNX005] Unexpected error" }, { status: 500 });
  }
}
