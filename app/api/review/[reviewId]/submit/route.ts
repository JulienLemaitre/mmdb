import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getReviewOverview } from "@/utils/server/getReviewOverview";
import { computeChangedChecklistFieldPaths } from "@/features/review/reviewDiff";
import { composeAuditEntries } from "@/features/review/utils/auditCompose";
import { expandRequiredChecklistItems } from "@/features/review/utils/expandRequiredChecklistItems";
import { debug } from "@/utils/debugLogger";
import { authOptions } from "@/auth/options";
import { db } from "@/utils/server/db";
import {
  AUDIT_ENTITY_TYPE,
  OPERATION,
  Prisma,
  REVIEW_STATE,
  REVIEWED_ENTITY_TYPE,
} from "@/prisma/client";
import { ChecklistGraph } from "@/types/reviewTypes";

// POST /api/review/[reviewId]/submit
// Body: { workingCopy, checklistState: Array<{entityType, entityId, fieldPath, checked}>, overallComment? }
export async function POST(
  req: Request,
  { params }: { params: Promise<{ reviewId: string }> },
) {
  // Check for a REVIEWER or ADMIN session
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json(
      { error: "[review submit] Unauthorized" },
      { status: 401 },
    );
  }

  const userId = session.user.id;
  const role = session.user.role;
  if (!role || !["REVIEWER", "ADMIN"].includes(role)) {
    return NextResponse.json(
      { error: "[review submit] Forbidden: reviewer or admin role required" },
      { status: 403 },
    );
  }

  // Check received params and body
  const { reviewId } = await params;

  let body: any;
  try {
    body = await req.json();
  } catch {
    debug.error("Invalid JSON body");
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const workingCopy = body?.workingCopy as ChecklistGraph;
  const checklistState = Array.isArray(body?.checklistState)
    ? body.checklistState
    : [];
  const overallComment = body?.overallComment ?? null;

  if (!workingCopy || !Array.isArray(checklistState)) {
    debug.error(
      `Missing : ${!workingCopy ? "workingCopy" : ""} ${!Array.isArray(checklistState) ? "checklistState" : ""}`,
    );
    debug.error(`[error] workingCopy`, JSON.stringify(workingCopy, null, 2));
    debug.error(
      `[error] checklistState`,
      JSON.stringify(checklistState, null, 2),
    );
    return NextResponse.json(
      { error: "Missing workingCopy or checklistState" },
      { status: 400 },
    );
  }

  // 1. Verify Review state and ownership
  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: { id: true, state: true, creatorId: true, mMSourceId: true },
  });

  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }
  if (review.creatorId !== userId) {
    return NextResponse.json(
      { error: "Forbidden: You are not the owner of this review" },
      { status: 403 },
    );
  }
  if (review.state !== REVIEW_STATE.IN_REVIEW) {
    return NextResponse.json(
      { error: `Review is not IN_REVIEW (current: ${review.state})` },
      { status: 400 },
    );
  }

  // 2. Load the baseline graph
  let baselineGraph: ChecklistGraph;
  let globallyReviewed: any;
  try {
    const reviewOverview = await getReviewOverview(reviewId);
    baselineGraph = reviewOverview.graph;
    globallyReviewed = reviewOverview.globallyReviewed;
  } catch (err: any) {
    debug.error(`getReviewOverview error: ${err.message}`);
    return NextResponse.json(
      { error: err.message || "Failed to load review overview" },
      { status: 500 },
    );
  }

  // 3. Validate Completeness (Server Authoritative)
  // We validate against the workingCopy because the reviewer might have deleted items (which removes the requirement to check them)
  // or added new items (which creates new requirements). The baseline is only used for diffing/persistence.
  const requiredItems = expandRequiredChecklistItems(workingCopy, {
    globallyReviewed: {
      personIds: new Set(globallyReviewed.personIds ?? []),
      organizationIds: new Set(globallyReviewed.organizationIds ?? []),
      collectionIds: new Set(globallyReviewed.collectionIds ?? []),
      pieceIds: new Set(globallyReviewed.pieceIds ?? []),
      pieceVersionIds: new Set(globallyReviewed.pieceVersionIds ?? []),
    },
  });

  // Build a map of submitted checks for quick lookup
  const submitted = new Set(checklistState.map((it: any) => it.fieldPath));

  const missing = requiredItems.filter((it) => !submitted.has(it.fieldPath));

  if (missing.length > 0) {
    debug.error(
      "requiredItems keys",
      requiredItems.map((it) => it.fieldPath),
    );
    debug.error(
      `[review submit] submitted`,
      JSON.stringify(submitted, null, 2),
    );
    debug.error(`[review submit] missing`, JSON.stringify(missing, null, 2));
    return NextResponse.json(
      {
        error: "Incomplete checklist: some required items are not checked",
        missing: missing.slice(0, 100),
        missingCount: missing.length,
      },
      { status: 400 },
    );
  }

  // 4. Compute Audit Entries & Change Detection
  // (Note: We recalculate diffs for audit, but for DB updates we traverse the working copy)
  const auditEntries = composeAuditEntries(
    reviewId,
    baselineGraph,
    workingCopy,
  );
  const changedFieldPaths = computeChangedChecklistFieldPaths(
    baselineGraph,
    workingCopy,
  );
  const changedUniqueByEntityType = changedFieldPaths.reduce<
    Record<string, Set<string>>
  >((acc, c) => {
    acc[c.entityType] = acc[c.entityType] || new Set<string>();
    if (c.entityId) acc[c.entityType].add(c.entityId);
    else acc[c.entityType].add("__source__");
    return acc;
  }, {});

  // 5. Persist to Database (Transactional)
  try {
    await db.$transaction(
      async (tx) => {
        // --- A. Deletions (Cascading & Cleanup) ---
        // Compare baseline vs working copy to find removed entities.
        // We focus on strict dependencies: References, Contributions, MetronomeMarks, Sections, Movements.

        // 1. References (on Source)
        const workingRefIds = new Set(
          (workingCopy.source.references || [])
            .map((r) => r.id)
            .filter(Boolean),
        );
        const removedRefIds = (baselineGraph.source.references || [])
          .map((r) => r.id)
          .filter((id) => id && !workingRefIds.has(id));
        if (removedRefIds.length > 0) {
          debug.log(`[review submit] DELETING removedRefIds`, removedRefIds);
          await tx.reference.deleteMany({
            where: { id: { in: removedRefIds as string[] } },
          });
        }

        // 2. Contributions (on Source)
        const workingContribIds = new Set(
          (workingCopy.contributions || []).map((c) => c.id).filter(Boolean),
        );
        const removedContribIds = (baselineGraph.contributions || [])
          .map((c) => c.id)
          .filter((id) => id && !workingContribIds.has(id));
        if (removedContribIds.length > 0) {
          debug.log(
            `[review submit] DELETING removedContribIds`,
            removedContribIds,
          );
          await tx.contribution.deleteMany({
            where: { id: { in: removedContribIds as string[] } },
          });
        }

        // 3. MetronomeMarks (on Source)
        const workingMMIds = new Set(
          (workingCopy.metronomeMarks || []).map((m) => m.id).filter(Boolean),
        );
        const removedMMIds = (baselineGraph.metronomeMarks || [])
          .map((m) => m.id)
          .filter((id) => id && !workingMMIds.has(id));
        if (removedMMIds.length > 0) {
          debug.log(`[review submit] DELETING removedMMIds`, removedMMIds);
          await tx.metronomeMark.deleteMany({
            where: { id: { in: removedMMIds as string[] } },
          });
        }

        // 4. Sections & Movements (Hierarchical check)
        // We need to check if a Movement or Section present in baseline is missing in working copy
        // for the SAME PieceVersion / Movement.
        for (const basePV of baselineGraph.pieceVersions || []) {
          const wcPV = (workingCopy.pieceVersions || []).find(
            (pv) => pv.id === basePV.id,
          );
          if (!wcPV) {
            // pieceVersion removed from working copy? In review context, we don't strictly delete the pieceVersion
            // as it might be shared, but we unlink it later.
            // However, if we want to clean up created-for-source pieceVersions, it's complex.
            // We stick to "Delete safe dependencies" rule.
            continue;
          }

          // Check Movements
          const baseMovs = (basePV as any).movements || [];
          const wcMovs = (wcPV as any).movements || [];
          const wcMovIds = new Set(wcMovs.map((m: any) => m.id));
          const removedMovIds = baseMovs
            .filter((m: any) => m.id && !wcMovIds.has(m.id))
            .map((m: any) => m.id);

          // Check Sections (for retained movements)
          const removedSecIds: string[] = [];
          for (const baseMov of baseMovs) {
            if (removedMovIds.includes(baseMov.id)) continue; // Already deleting movement

            const wcMov = wcMovs.find((m: any) => m.id === baseMov.id);
            if (wcMov) {
              const baseSecs = (baseMov as any).sections || [];
              const wcSecs = (wcMov as any).sections || [];
              const wcSecIds = new Set(wcSecs.map((s: any) => s.id));
              baseSecs.forEach((s: any) => {
                if (s.id && !wcSecIds.has(s.id)) {
                  removedSecIds.push(s.id);
                }
              });
            }
          }

          if (removedSecIds.length > 0) {
            debug.log(`[review submit] DELETING removedSecIds`, removedSecIds);
            await tx.section.deleteMany({
              where: { id: { in: removedSecIds } },
            });
          }
          if (removedMovIds.length > 0) {
            debug.log(`[review submit] DELETING removedMovIds`, removedMovIds);
            await tx.movement.deleteMany({
              where: { id: { in: removedMovIds } },
            });
          }
        }

        // --- B. Independent Entity Upserts ---

        // Persons
        for (const p of workingCopy.persons || []) {
          await tx.person.upsert({
            where: { id: p.id },
            update: {
              firstName: p.firstName,
              lastName: p.lastName,
              birthYear: p.birthYear,
              deathYear: p.deathYear,
            },
            create: {
              id: p.id,
              firstName: p.firstName,
              lastName: p.lastName,
              birthYear: p.birthYear,
              deathYear: p.deathYear,
              creatorId: review.creatorId,
            },
          });
        }

        // Organizations
        for (const o of workingCopy.organizations || []) {
          await tx.organization.upsert({
            where: { id: o.id },
            update: { name: o.name },
            create: { id: o.id, name: o.name, creatorId: review.creatorId },
          });
        }

        // TempoIndications
        for (const ti of workingCopy.tempoIndications || []) {
          await tx.tempoIndication.upsert({
            where: { id: ti.id },
            update: { text: ti.text },
            create: { id: ti.id, text: ti.text, creatorId: review.creatorId },
          });
        }

        // --- C. Hierarchical Upserts ---

        // Collections
        for (const c of workingCopy.collections || []) {
          await tx.collection.upsert({
            where: { id: c.id },
            update: {
              title: c.title,
              composerId: c.composerId,
            },
            create: {
              id: c.id,
              title: c.title,
              composerId: c.composerId,
              creatorId: review.creatorId,
            },
          });
        }

        // Pieces
        for (const p of workingCopy.pieces || []) {
          await tx.piece.upsert({
            where: { id: p.id },
            update: {
              title: p.title,
              nickname: p.nickname,
              yearOfComposition: p.yearOfComposition,
              composerId: p.composerId,
              collectionId: p.collectionId,
              collectionRank: p.collectionRank,
            },
            create: {
              id: p.id,
              title: p.title,
              nickname: p.nickname,
              yearOfComposition: p.yearOfComposition,
              composerId: p.composerId,
              collectionId: p.collectionId,
              collectionRank: p.collectionRank,
              creatorId: review.creatorId,
            },
          });
        }

        // PieceVersions & Structure
        for (const pv of workingCopy.pieceVersions || []) {
          await tx.pieceVersion.upsert({
            where: { id: pv.id },
            update: {
              category: pv.category,
              pieceId: pv.pieceId,
            },
            create: {
              id: pv.id,
              category: pv.category,
              pieceId: pv.pieceId,
              creatorId: review.creatorId,
            },
          });

          const movements = (pv as any).movements || [];
          for (const m of movements) {
            await tx.movement.upsert({
              where: { id: m.id },
              update: {
                rank: m.rank,
                key: m.key,
              },
              create: {
                id: m.id,
                pieceVersionId: pv.id,
                rank: m.rank,
                key: m.key,
              },
            });

            const sections = (m as any).sections || [];
            for (const s of sections) {
              await tx.section.upsert({
                where: { id: s.id },
                update: {
                  rank: s.rank,
                  metreNumerator: s.metreNumerator,
                  metreDenominator: s.metreDenominator,
                  isCommonTime: s.isCommonTime,
                  isCutTime: s.isCutTime,
                  fastestStructuralNotesPerBar: s.fastestStructuralNotesPerBar,
                  fastestStaccatoNotesPerBar: s.fastestStaccatoNotesPerBar,
                  fastestRepeatedNotesPerBar: s.fastestRepeatedNotesPerBar,
                  fastestOrnamentalNotesPerBar: s.fastestOrnamentalNotesPerBar,
                  isFastestStructuralNoteBelCanto:
                    s.isFastestStructuralNoteBelCanto,
                  tempoIndicationId: s.tempoIndication.id, // Validated by previous TI upsert
                  comment: s.comment,
                  commentForReview: s.commentForReview,
                },
                create: {
                  id: s.id,
                  movementId: m.id,
                  rank: s.rank,
                  metreNumerator: s.metreNumerator,
                  metreDenominator: s.metreDenominator,
                  isCommonTime: s.isCommonTime,
                  isCutTime: s.isCutTime,
                  fastestStructuralNotesPerBar: s.fastestStructuralNotesPerBar,
                  fastestStaccatoNotesPerBar: s.fastestStaccatoNotesPerBar,
                  fastestRepeatedNotesPerBar: s.fastestRepeatedNotesPerBar,
                  fastestOrnamentalNotesPerBar: s.fastestOrnamentalNotesPerBar,
                  isFastestStructuralNoteBelCanto:
                    s.isFastestStructuralNoteBelCanto,
                  tempoIndicationId: s.tempoIndication.id,
                  comment: s.comment,
                  commentForReview: s.commentForReview,
                },
              });
            }
          }
        }

        // --- D. Source & Direct Children ---

        // Update MM Source
        await tx.mMSource.update({
          where: { id: review.mMSourceId },
          data: {
            title: workingCopy.source.title,
            type: workingCopy.source.type,
            link: workingCopy.source.link,
            permalink: workingCopy.source.permalink,
            year: workingCopy.source.year,
            isYearEstimated: workingCopy.source.isYearEstimated,
            comment: workingCopy.source.comment,
          },
        });

        // Upsert References
        for (const r of workingCopy.source.references || []) {
          if (!r.id) continue; // Should have ID
          await tx.reference.upsert({
            where: { id: r.id },
            update: { type: r.type, reference: r.reference },
            create: {
              id: r.id,
              mMSourceId: review.mMSourceId,
              type: r.type,
              reference: r.reference,
            },
          });
        }

        // Upsert Contributions
        for (const c of workingCopy.contributions || []) {
          await tx.contribution.upsert({
            where: { id: c.id },
            update: {
              role: c.role,
              ...("person" in c
                ? {
                    personId: c.person.id,
                  }
                : {
                    organizationId: c.organization.id,
                  }),
            },
            create: {
              id: c.id,
              mMSourceId: review.mMSourceId,
              role: c.role,
              ...("person" in c
                ? {
                    personId: c.person.id,
                  }
                : {
                    organizationId: c.organization.id,
                  }),
            },
          });
        }

        // Upsert Metronome Marks
        for (const mm of workingCopy.metronomeMarks || []) {
          if (!mm.noMM) {
            await tx.metronomeMark.upsert({
              where: { id: mm.id },
              update: {
                sectionId: mm.sectionId,
                beatUnit: mm.beatUnit,
                bpm: mm.bpm,
                comment: mm.comment,
              },
              create: {
                id: mm.id,
                mMSourceId: review.mMSourceId,
                sectionId: mm.sectionId,
                beatUnit: mm.beatUnit,
                bpm: mm.bpm,
                comment: mm.comment,
              },
            });
          }
        }

        // --- E. Associations (MMSourcesOnPieceVersions) ---
        // Full replacement strategy to ensure ranks are correct
        await tx.mMSourcesOnPieceVersions.deleteMany({
          where: { mMSourceId: review.mMSourceId },
        });

        if (
          workingCopy.sourceOnPieceVersions &&
          workingCopy.sourceOnPieceVersions.length > 0
        ) {
          await tx.mMSourcesOnPieceVersions.createMany({
            data: workingCopy.sourceOnPieceVersions.map((sopv) => ({
              mMSourceId: review.mMSourceId,
              pieceVersionId: sopv.pieceVersionId,
              rank: sopv.rank,
            })),
          });
        }

        // --- F. Audit Logging ---
        if (auditEntries.length > 0) {
          await tx.auditLog.createMany({
            data: auditEntries.map((entry) => ({
              reviewId: entry.reviewId,
              entityType: entry.entityType as AUDIT_ENTITY_TYPE,
              entityId: entry.entityId,
              operation: entry.operation as OPERATION,
              before: (entry.before as any) ?? Prisma.DbNull,
              after: (entry.after as any) ?? Prisma.DbNull,
              authorId: userId,
              // comment: // Future per-field comment
            })),
          });
        }

        // --- G. Global Reviewed Flags ---
        // Upsert ReviewedEntity for Person, Organization, Collection, Piece and PieceVersion
        // FIX: Deduplicate entries and SKIP entities that were already globally reviewed
        // to prevent overwriting the original reviewer's record with the current user's ID.

        const reviewedEntityPayloads = new Map<
          string,
          { type: REVIEWED_ENTITY_TYPE; id: string }
        >();

        const addToPayload = (
          type: REVIEWED_ENTITY_TYPE,
          id: string | undefined,
          alreadyReviewedIds: string[] | undefined | null,
        ) => {
          if (!id) return;
          // 1. Deduplication check
          const key = `${type}:${id}`;
          if (reviewedEntityPayloads.has(key)) return;

          // 2. Global Review check: If it was already reviewed, the UI hid it,
          // so the current user did NOT review it. Do not touch the DB record.
          if (alreadyReviewedIds?.includes(id)) return;

          reviewedEntityPayloads.set(key, { type, id });
        };

        workingCopy.persons?.forEach((p) =>
          addToPayload("PERSON", p.id, globallyReviewed.personIds),
        );
        workingCopy.organizations?.forEach((o) =>
          addToPayload("ORGANIZATION", o.id, globallyReviewed.organizationIds),
        );
        workingCopy.collections?.forEach((c) =>
          addToPayload("COLLECTION", c.id, globallyReviewed.collectionIds),
        );
        workingCopy.pieces?.forEach((p) =>
          addToPayload("PIECE", p.id, globallyReviewed.pieceIds),
        );
        workingCopy.pieceVersions?.forEach((pv) =>
          addToPayload(
            "PIECE_VERSION",
            pv.id,
            globallyReviewed.pieceVersionIds,
          ),
        );

        for (const item of reviewedEntityPayloads.values()) {
          await tx.reviewedEntity.upsert({
            where: {
              entityType_entityId: {
                entityType: item.type,
                entityId: item.id,
              },
            },
            update: {
              reviewedAt: new Date(),
              reviewedById: userId,
              reviewId: reviewId,
            },
            create: {
              entityType: item.type,
              entityId: item.id,
              reviewedById: userId,
              reviewId: reviewId,
            },
          });
        }

        // --- H. Finalize State ---
        const now = new Date();
        await tx.review.update({
          where: { id: reviewId },
          data: {
            state: REVIEW_STATE.APPROVED,
            endedAt: now,
            overallComment: overallComment,
          },
        });

        await tx.mMSource.update({
          where: { id: review.mMSourceId },
          data: {
            reviewState: REVIEW_STATE.APPROVED,
          },
        });
      },
      { timeout: 20000 }, // Extended timeout for large transactions
    );

    const summary = {
      reviewId,
      overallComment: overallComment || null,
      requiredCount: requiredItems.length,
      submittedCheckedCount: submitted.size,
      changedCount: changedFieldPaths.length,
      entitiesTouched: Object.fromEntries(
        Object.entries(changedUniqueByEntityType).map(([k, v]) => [k, v.size]),
      ),
      changedFieldPathsSample: changedFieldPaths
        .slice(0, 100)
        .map((c) => c.fieldPath),
    };

    return NextResponse.json({
      ok: true,
      summary,
      auditPreview: {
        count: auditEntries.length,
        entries: auditEntries.slice(0, 100),
      },
    });
  } catch (err: any) {
    debug.error("Review submit transaction error:", err);
    return NextResponse.json(
      { error: `Transaction failed: ${err.message}` },
      { status: 500 },
    );
  }
}
