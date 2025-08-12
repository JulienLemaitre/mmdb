import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/utils/db";
import { REVIEW_STATE, REVIEWED_ENTITY_TYPE } from "@prisma/client";
import {
  ChecklistEntityType,
  getChecklistFields,
  isDoNotReviewTwice,
} from "@/utils/ReviewChecklistSchema";

function json(data: unknown, init?: any) {
  return NextResponse.json(data as any, init as any);
}

// Normalize Prisma enums to our ChecklistEntityType values where they overlap
const ENTITY_MAP: Record<string, ChecklistEntityType> = {
  MM_SOURCE: "MM_SOURCE",
  COLLECTION: "COLLECTION",
  PIECE: "PIECE",
  PIECE_VERSION: "PIECE_VERSION",
  MOVEMENT: "MOVEMENT",
  SECTION: "SECTION",
  TEMPO_INDICATION: "TEMPO_INDICATION",
  METRONOME_MARK: "METRONOME_MARK",
  REFERENCE: "REFERENCE",
  CONTRIBUTION: "CONTRIBUTION",
  PERSON: "PERSON",
  ORGANIZATION: "ORGANIZATION",
};

export async function GET(req: Request, { params }: any) {
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
      return json({ error: "[gINPUT003] reviewId is required" }, { status: 400 });
    }

    const review = await db.review.findUnique({
      where: { id: reviewId },
      select: { id: true, creatorId: true, state: true, mMSourceId: true },
    });
    if (!review) return json({ error: "[gNF002] Review not found" }, { status: 404 });

    const isOwner = review.creatorId === session.user.id;
    const isAdmin = role === "ADMIN";
    if (!isOwner && !isAdmin) {
      return json({ error: "[gAUTH003] Forbidden: only owner or admin" }, { status: 403 });
    }

    if (review.state !== REVIEW_STATE.IN_REVIEW) {
      return json({ error: "[gBUS004] Review is not active (IN_REVIEW)" }, { status: 400 });
    }

    // Load MM Source graph needed to derive the checklist
    const mmSource = await db.mMSource.findUnique({
      where: { id: review.mMSourceId },
      select: {
        id: true,
        title: true,
        type: true,
        link: true,
        permalink: true,
        year: true,
        comment: true,
        references: {
          select: { id: true, type: true, reference: true },
          orderBy: { createdAt: "asc" },
        },
        contributions: {
          select: { id: true, personId: true, organizationId: true, role: true },
          orderBy: { createdAt: "asc" },
        },
        pieceVersions: {
          select: {
            pieceVersion: {
              select: {
                id: true,
                category: true,
                piece: {
                  select: {
                    id: true,
                    composerId: true,
                    collectionId: true,
                  },
                },
                movements: {
                  select: {
                    id: true,
                    rank: true,
                    key: true,
                    sections: {
                      select: {
                        id: true,
                        rank: true,
                        metreNumerator: true,
                        metreDenominator: true,
                        isCommonTime: true,
                        isCutTime: true,
                        fastestStructuralNotesPerBar: true,
                        fastestStaccatoNotesPerBar: true,
                        fastestRepeatedNotesPerBar: true,
                        fastestOrnamentalNotesPerBar: true,
                        isFastestStructuralNoteBelCanto: true,
                        tempoIndicationId: true,
                        tempoIndication: { select: { id: true, text: true } },
                        comment: true,
                        commentForReview: true,
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
        metronomeMarks: {
          select: { id: true, beatUnit: true, bpm: true, comment: true, sectionId: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!mmSource) return json({ error: "[gNF001] MMSource not found" }, { status: 404 });

    // Collect entity IDs for do-not-review-twice checks
    const personIds = new Set<string>();
    const orgIds = new Set<string>();
    const collectionIds = new Set<string>();
    const pieceIds = new Set<string>();

    // From pieces in pieceVersions
    for (const pvJoin of mmSource.pieceVersions) {
      const pv = pvJoin.pieceVersion;
      if (pv.piece?.id) pieceIds.add(pv.piece.id);
      if (pv.piece?.composerId) personIds.add(pv.piece.composerId);
      if (pv.piece?.collectionId) collectionIds.add(pv.piece.collectionId);
    }
    // From contributions
    for (const c of mmSource.contributions) {
      if (c.personId) personIds.add(c.personId);
      if (c.organizationId) orgIds.add(c.organizationId);
    }

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

    type ChecklistItem = {
      entityType: ChecklistEntityType;
      entityId: string;
      fieldPath: string;
      label: string;
      required: boolean;
    };

    const items: ChecklistItem[] = [];

    // Helper to push fields for an entity instance
    function pushFields(entityType: ChecklistEntityType, entityId: string) {
      if (isDoNotReviewTwice(entityType) && exclusions[entityType].has(entityId)) return;
      const fields = getChecklistFields(entityType);
      for (const f of fields) {
        items.push({
          entityType,
          entityId,
          fieldPath: f.path,
          label: f.label,
          required: f.meta?.required !== false,
        });
      }
    }

    // MM_SOURCE itself
    pushFields("MM_SOURCE", mmSource.id);

    // References
    for (const ref of mmSource.references) {
      pushFields("REFERENCE", ref.id);
    }
    // Contributions
    for (const co of mmSource.contributions) {
      pushFields("CONTRIBUTION", co.id);
      if (co.personId) pushFields("PERSON", co.personId);
      if (co.organizationId) pushFields("ORGANIZATION", co.organizationId);
    }

    // Piece Versions tree and associated entities
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
          if (s.tempoIndication) {
            // dedupe tempoIndication across sections
            if (!tempoIndicationIdsAdded.has(s.tempoIndication.id)) {
              tempoIndicationIdsAdded.add(s.tempoIndication.id);
              pushFields("TEMPO_INDICATION", s.tempoIndication.id);
            }
          }
        }
      }
    }

    // Metronome marks belong to the source
    for (const mm of mmSource.metronomeMarks) {
      pushFields("METRONOME_MARK", mm.id);
    }

    // Build a concise overview payload
    const payload = {
      reviewId: review.id,
      mmSourceId: mmSource.id,
      graph: mmSource, // already filtered selection
      exclusions: {
        PERSON: Array.from(exclusions.PERSON),
        ORGANIZATION: Array.from(exclusions.ORGANIZATION),
        COLLECTION: Array.from(exclusions.COLLECTION),
        PIECE: Array.from(exclusions.PIECE),
      },
      checklist: items,
      counts: { totalItems: items.length },
    };

    return json(payload);
  } catch (err) {
    console.error("/api/reviews/[reviewId]/overview error:", err);
    return json({ error: "[gUNX004] Unexpected error" }, { status: 500 });
  }
}
