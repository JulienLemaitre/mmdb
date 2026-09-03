import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/options";
import { db } from "@/utils/server/db";
import {
  AUDIT_ENTITY_TYPE,
  OPERATION,
  Prisma,
  REVIEW_STATE,
  REVIEWED_ENTITY_TYPE,
} from "@/prisma/client";
import { FeedFormState } from "@/types/feedFormTypes";
import { assertsIsPersistableFeedFormState } from "@/types/formTypes";
import { getReviewBaseline } from "@/utils/server/getReviewBaseline";
import { extendBaselineByExistence } from "@/utils/server/extendBaselineByExistence";
import { normalizeFeedFormStateForPersistence } from "@/utils/server/normalizeFeedFormStateForPersistence";
import { computeChangedFieldPaths } from "@/features/review/reviewDiff";
import { forkModifiedSharedPieceVersions } from "@/utils/server/forkModifiedSharedPieceVersions";
import { composeAuditEntries } from "@/features/review/utils/auditCompose";
import { computeMMSourceDerivedData } from "@/utils/server/computeMMSourceDerivedData";
import { applyRankUpdatesInTwoPhases } from "@/utils/server/applyRankUpdatesInTwoPhases";
import sendEmail from "@/utils/server/sendEmail";
import { debug, prodLog } from "@/utils/debugLogger";

// POST /api/review/[reviewId]/submit
// Body: { feedFormState: FeedFormState, overallComment?: string | null }
export async function POST(
  req: Request,
  { params }: { params: Promise<{ reviewId: string }> },
) {
  // 1. Session & role checks
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

  const { reviewId } = await params;

  // 2. Parse JSON body & extract payload
  let body: any;
  try {
    body = await req.json();
  } catch {
    debug.error("[review submit] Invalid JSON body");
    return NextResponse.json(
      { error: "[review submit] Invalid JSON body" },
      { status: 400 },
    );
  }

  const submittedState = (body?.feedFormState || body?.state) as FeedFormState;
  const overallComment =
    body?.overallComment !== undefined ? body.overallComment : null;

  if (!submittedState) {
    return NextResponse.json(
      { error: "[review submit] Missing feedFormState in request body" },
      { status: 400 },
    );
  }

  // 3. Verify review ownership & IN_REVIEW state
  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: { id: true, state: true, creatorId: true, mMSourceId: true },
  });

  if (!review) {
    return NextResponse.json(
      { error: "[review submit] Review not found" },
      { status: 404 },
    );
  }

  if (review.creatorId !== userId) {
    return NextResponse.json(
      {
        error:
          "[review submit] Forbidden: You are not the owner of this review",
      },
      { status: 403 },
    );
  }

  if (review.state !== REVIEW_STATE.IN_REVIEW) {
    return NextResponse.json(
      {
        error: `[review submit] Review is not IN_REVIEW (current: ${review.state})`,
      },
      { status: 400 },
    );
  }

  // 4. Mandatory fields check (similar to app/api/feedForm/route.ts)
  const mandatoryFields = [
    "mMSourceDescription",
    "mMSourceContributions",
    "mMSourceOnPieceVersions",
    "metronomeMarks",
  ] as const;

  const missingMandatoryFields = mandatoryFields.filter(
    (field) =>
      !submittedState[field] ||
      (Array.isArray(submittedState[field]) &&
        (submittedState[field] as any).length === 0),
  );

  if (missingMandatoryFields.length > 0) {
    return NextResponse.json(
      {
        error: `[review submit] Missing mandatory fields: ${missingMandatoryFields.join(", ")}`,
      },
      { status: 400 },
    );
  }

  // 5. Structure validation (assertsIsPersistableFeedFormState)
  try {
    assertsIsPersistableFeedFormState(submittedState);
  } catch (err: any) {
    return NextResponse.json(
      { error: `[review submit] Invalid feedFormState: ${err.message}` },
      { status: 400 },
    );
  }

  // 6. Baseline loading & extension by existence
  let baseline: FeedFormState;
  let globallyReviewed: any;
  try {
    const reviewBaseline = await getReviewBaseline(reviewId, {
      requireOwner: true,
    });
    baseline = reviewBaseline.baseline;
    globallyReviewed = reviewBaseline.globallyReviewed;
    baseline = await extendBaselineByExistence(baseline, submittedState);
  } catch (err: any) {
    debug.error(`[review submit] Failed to load review baseline: ${err.message}`);
    return NextResponse.json(
      { error: err.message || "[review submit] Failed to load review baseline" },
      { status: 500 },
    );
  }

  // 7. Normalization of submitted state for persistence
  let normalizedState: FeedFormState;
  try {
    normalizedState = normalizeFeedFormStateForPersistence(submittedState);
  } catch (err: any) {
    debug.error(`[review submit] Normalization error: ${err.message}`);
    return NextResponse.json(
      { error: `[review submit] Normalization error: ${err.message}` },
      { status: 400 },
    );
  }

  // 8. Pre-transaction diff, audit and log email
  const preDiff = computeChangedFieldPaths(baseline, normalizedState);
  const preAudit = composeAuditEntries(reviewId, baseline, normalizedState);

  const preLogSummary = {
    reviewId,
    state: normalizedState,
    baseline,
    globallyReviewed,
    overallComment,
    changedFieldPaths: preDiff,
    auditEntries: preAudit,
    changedCount: preDiff.length,
    entitiesTouched: Object.fromEntries(
      Array.from(new Set(preDiff.map((d) => d.entityType))).map((et) => [
        et,
        new Set(
          preDiff
            .filter((d) => d.entityType === et)
            .map((d) => d.entityId ?? "__source__"),
        ).size,
      ]),
    ),
  };

  await sendEmail({
    type: "Review SUBMIT data",
    content: preLogSummary,
  }).catch((err) =>
    console.error(
      `[api/review/${reviewId}/submit] data sendEmail ERROR :`,
      err?.status,
      err?.message,
    ),
  );

  // 9. Execute transaction
  const txDebug: any = {};
  try {
    let finalAuditEntries: any[] = [];
    let finalChangedFieldPaths: any[] = [];
    let finalForkResult: any = null;

    await db.$transaction(
      async (tx) => {
        // --- Step A: Fork modified shared PieceVersions ---
        finalForkResult = await forkModifiedSharedPieceVersions(tx, {
          mMSourceId: review.mMSourceId,
          baseline,
          state: normalizedState,
        });

        const finalState = finalForkResult.state;
        const protectedEntityIds = finalForkResult.protectedEntityIds;

        // --- Step B: Recalculate diff, audit & derived data on remapped state ---
        finalChangedFieldPaths = computeChangedFieldPaths(baseline, finalState);
        finalAuditEntries = composeAuditEntries(
          reviewId,
          baseline,
          finalState,
          protectedEntityIds,
        );
        const derived = computeMMSourceDerivedData(finalState);

        // Map changed entity IDs by ReviewEntityType
        const changedEntitiesByType = new Map<string, Set<string>>();
        for (const change of finalChangedFieldPaths) {
          const set =
            changedEntitiesByType.get(change.entityType) ?? new Set<string>();
          if (change.entityId) {
            set.add(change.entityId);
          } else {
            set.add("__source__");
          }
          changedEntitiesByType.set(change.entityType, set);
        }

        // Precompute baseline IDs for fast existence checks (3-way decision: create / update / none)
        const baselinePersonIds = new Set(
          (baseline.persons ?? []).map((p) => p.id),
        );
        const baselineOrgIds = new Set(
          (baseline.organizations ?? []).map((o) => o.id),
        );
        const baselineCollectionIds = new Set(
          (baseline.collections ?? []).map((c) => c.id),
        );
        const baselinePieceIds = new Set(
          (baseline.pieces ?? []).map((p) => p.id),
        );
        const baselinePieceVersionIds = new Set(
          (baseline.pieceVersions ?? []).map((pv) => pv.id),
        );
        const baselineMovementIds = new Set<string>();
        const baselineSectionIds = new Set<string>();
        for (const pv of baseline.pieceVersions ?? []) {
          for (const m of pv.movements ?? []) {
            if (m.id) baselineMovementIds.add(m.id);
            for (const s of m.sections ?? []) {
              if (s.id) baselineSectionIds.add(s.id);
            }
          }
        }
        const baselineTempoIndicationIds = new Set(
          (baseline.tempoIndications ?? [])
            .map((ti) => ti.id)
            .filter((id): id is string => Boolean(id)),
        );
        const baselineReferenceIds = new Set(
          (baseline.mMSourceDescription?.references ?? [])
            .map((r) => r.id)
            .filter((id): id is string => Boolean(id)),
        );
        const baselineContributionIds = new Set(
          (baseline.mMSourceContributions ?? [])
            .map((c) => c.id)
            .filter((id): id is string => Boolean(id)),
        );
        const baselineMMIds = new Set(
          (baseline.metronomeMarks ?? [])
            .map((mm) => mm.id)
            .filter((id): id is string => Boolean(id)),
        );

        // ==========================================
        // Phase 1 — Deletions (Cascading & Cleanup)
        // ==========================================

        // 1. MetronomeMarks (noMM marks already removed by normalization)
        const stateMMIds = new Set(
          (finalState.metronomeMarks ?? [])
            .map((mm) => mm.id)
            .filter(Boolean),
        );
        const deletedMMIds = Array.from(baselineMMIds).filter(
          (id) => !stateMMIds.has(id),
        );
        if (deletedMMIds.length > 0) {
          txDebug.deletedMetronomeMarks = await tx.metronomeMark.deleteMany({
            where: { id: { in: deletedMMIds } },
          });
        }

        // 2. Sections (excluding protectedEntityIds)
        const stateSectionIds = new Set<string>();
        for (const pv of finalState.pieceVersions ?? []) {
          for (const m of pv.movements ?? []) {
            for (const s of m.sections ?? []) {
              if (s.id) stateSectionIds.add(s.id);
            }
          }
        }
        const deletedSectionIds = Array.from(baselineSectionIds).filter(
          (id) => !stateSectionIds.has(id) && !protectedEntityIds.has(id),
        );
        if (deletedSectionIds.length > 0) {
          txDebug.deletedSections = await tx.section.deleteMany({
            where: { id: { in: deletedSectionIds } },
          });
        }

        // 3. Movements (excluding protectedEntityIds)
        const stateMovementIds = new Set<string>();
        for (const pv of finalState.pieceVersions ?? []) {
          for (const m of pv.movements ?? []) {
            if (m.id) stateMovementIds.add(m.id);
          }
        }
        const deletedMovementIds = Array.from(baselineMovementIds).filter(
          (id) => !stateMovementIds.has(id) && !protectedEntityIds.has(id),
        );
        if (deletedMovementIds.length > 0) {
          txDebug.deletedMovements = await tx.movement.deleteMany({
            where: { id: { in: deletedMovementIds } },
          });
        }

        // 4. References
        const stateRefIds = new Set(
          (finalState.mMSourceDescription?.references ?? [])
            .map((r) => r.id)
            .filter(Boolean),
        );
        const deletedRefIds = Array.from(baselineReferenceIds).filter(
          (id) => !stateRefIds.has(id),
        );
        if (deletedRefIds.length > 0) {
          txDebug.deletedReferences = await tx.reference.deleteMany({
            where: { id: { in: deletedRefIds } },
          });
        }

        // 5. Contributions
        const stateContribIds = new Set(
          (finalState.mMSourceContributions ?? [])
            .map((c) => c.id)
            .filter(Boolean),
        );
        const deletedContribIds = Array.from(baselineContributionIds).filter(
          (id) => !stateContribIds.has(id),
        );
        if (deletedContribIds.length > 0) {
          txDebug.deletedContributions = await tx.contribution.deleteMany({
            where: { id: { in: deletedContribIds } },
          });
        }

        // 6. MMSourcesOnPieceVersions (joins of the source absent from state)
        const statePvIdsOnJoin = new Set<string>(
          (finalState.mMSourceOnPieceVersions ?? [])
            .map((j) => j.pieceVersionId)
            .filter((id): id is string => Boolean(id)),
        );
        txDebug.deletedMMSourcesOnPieceVersions =
          await tx.mMSourcesOnPieceVersions.deleteMany({
            where: {
              mMSourceId: review.mMSourceId,
              pieceVersionId: {
                notIn: Array.from(statePvIdsOnJoin),
              },
            },
          });

        // ==========================================
        // Phase 2 — Referentials and Musical Tree
        // ==========================================

        // Persons
        for (const p of finalState.persons ?? []) {
          if (!p.id) continue;
          if (!baselinePersonIds.has(p.id)) {
            await tx.person.create({
              data: {
                id: p.id,
                firstName: p.firstName,
                lastName: p.lastName,
                birthYear: p.birthYear,
                deathYear: p.deathYear ?? null,
                creatorId: userId,
              },
            });
          } else if (changedEntitiesByType.get("PERSON")?.has(p.id)) {
            await tx.person.update({
              where: { id: p.id },
              data: {
                firstName: p.firstName,
                lastName: p.lastName,
                birthYear: p.birthYear,
                deathYear: p.deathYear ?? null,
              },
            });
          }
        }

        // Organizations
        for (const o of finalState.organizations ?? []) {
          if (!o.id) continue;
          if (!baselineOrgIds.has(o.id)) {
            await tx.organization.create({
              data: {
                id: o.id,
                name: o.name,
                creatorId: userId,
              },
            });
          } else if (changedEntitiesByType.get("ORGANIZATION")?.has(o.id)) {
            await tx.organization.update({
              where: { id: o.id },
              data: {
                name: o.name,
              },
            });
          }
        }

        // Collections
        for (const c of finalState.collections ?? []) {
          if (!c.id) continue;
          if (!baselineCollectionIds.has(c.id)) {
            await tx.collection.create({
              data: {
                id: c.id,
                title: c.title,
                composerId: c.composerId,
                creatorId: userId,
              },
            });
          } else if (changedEntitiesByType.get("COLLECTION")?.has(c.id)) {
            await tx.collection.update({
              where: { id: c.id },
              data: {
                title: c.title,
                composerId: c.composerId,
              },
            });
          }
        }

        // TempoIndications
        for (const ti of finalState.tempoIndications ?? []) {
          if (!ti.id) continue;
          if (!baselineTempoIndicationIds.has(ti.id)) {
            await tx.tempoIndication.create({
              data: {
                id: ti.id,
                text: ti.text,
                creatorId: userId,
              },
            });
          } else if (changedEntitiesByType.get("TEMPO_INDICATION")?.has(ti.id)) {
            await tx.tempoIndication.update({
              where: { id: ti.id },
              data: {
                text: ti.text,
              },
            });
          }
        }

        // Pieces (creation / attribute updates)
        for (const p of finalState.pieces ?? []) {
          if (!p.id) continue;
          if (!baselinePieceIds.has(p.id)) {
            await tx.piece.create({
              data: {
                id: p.id,
                title: p.title,
                nickname: p.nickname ?? null,
                yearOfComposition: p.yearOfComposition ?? null,
                composerId: p.composerId,
                collectionId: p.collectionId ?? null,
                collectionRank: p.collectionRank ?? null,
                creatorId: userId,
              },
            });
          } else if (changedEntitiesByType.get("PIECE")?.has(p.id)) {
            await tx.piece.update({
              where: { id: p.id },
              data: {
                title: p.title,
                nickname: p.nickname ?? null,
                yearOfComposition: p.yearOfComposition ?? null,
                composerId: p.composerId,
                collectionId: p.collectionId ?? null,
              },
            });
          }
        }

        // Piece collection rank updates via applyRankUpdatesInTwoPhases
        const piecesByCollection = new Map<
          string,
          Array<{ id: string; rank: number }>
        >();
        for (const p of finalState.pieces ?? []) {
          if (p.collectionId && typeof p.collectionRank === "number") {
            const list = piecesByCollection.get(p.collectionId) ?? [];
            list.push({ id: p.id, rank: p.collectionRank });
            piecesByCollection.set(p.collectionId, list);
          }
        }
        for (const [collectionId, updates] of piecesByCollection.entries()) {
          await applyRankUpdatesInTwoPhases(tx, {
            model: "Piece",
            scope: { collectionId },
            updates,
          });
        }

        // PieceVersions (including newly created / forked ones)
        for (const pv of finalState.pieceVersions ?? []) {
          if (!pv.id) continue;
          if (!baselinePieceVersionIds.has(pv.id)) {
            await tx.pieceVersion.create({
              data: {
                id: pv.id,
                category: pv.category,
                pieceId: pv.pieceId,
                creatorId: userId,
              },
            });
          } else if (changedEntitiesByType.get("PIECE_VERSION")?.has(pv.id)) {
            await tx.pieceVersion.update({
              where: { id: pv.id },
              data: {
                category: pv.category,
                pieceId: pv.pieceId,
              },
            });
          }
        }

        // Movements (creation & non-rank field updates)
        for (const pv of finalState.pieceVersions ?? []) {
          for (const m of pv.movements ?? []) {
            if (!m.id) continue;
            if (!baselineMovementIds.has(m.id)) {
              await tx.movement.create({
                data: {
                  id: m.id,
                  pieceVersionId: pv.id,
                  rank: m.rank,
                  key: m.key ?? null,
                  isVariation: m.isVariation ?? false,
                },
              });
            } else if (changedEntitiesByType.get("MOVEMENT")?.has(m.id)) {
              await tx.movement.update({
                where: { id: m.id },
                data: {
                  key: m.key ?? null,
                  isVariation: m.isVariation ?? false,
                },
              });
            }
          }

          // Movement 2-phase rank updates
          const movementUpdates = (pv.movements ?? [])
            .filter((m) => typeof m.rank === "number")
            .map((m) => ({ id: m.id, rank: m.rank }));
          if (movementUpdates.length > 0) {
            await applyRankUpdatesInTwoPhases(tx, {
              model: "Movement",
              scope: { pieceVersionId: pv.id },
              updates: movementUpdates,
            });
          }
        }

        // Sections (creation & non-rank field updates)
        for (const pv of finalState.pieceVersions ?? []) {
          for (const m of pv.movements ?? []) {
            for (const s of m.sections ?? []) {
              if (!s.id) continue;
              if (!baselineSectionIds.has(s.id)) {
                await tx.section.create({
                  data: {
                    id: s.id,
                    movementId: m.id,
                    rank: s.rank,
                    metreNumerator: s.metreNumerator ?? null,
                    metreDenominator: s.metreDenominator ?? null,
                    isCommonTime: s.isCommonTime ?? false,
                    isCutTime: s.isCutTime ?? false,
                    fastestStructuralNotesPerBar:
                      s.fastestStructuralNotesPerBar ?? null,
                    fastestBelCantoNotesPerBar:
                      s.fastestBelCantoNotesPerBar ?? null,
                    fastestStaccatoNotesPerBar:
                      s.fastestStaccatoNotesPerBar ?? null,
                    fastestRepeatedNotesPerBar:
                      s.fastestRepeatedNotesPerBar ?? null,
                    fastestOrnamentalNotesPerBar:
                      s.fastestOrnamentalNotesPerBar ?? null,
                    tempoIndicationId: s.tempoIndicationId,
                    comment: s.comment ?? null,
                    commentForReview: s.commentForReview ?? null,
                  },
                });
              } else if (changedEntitiesByType.get("SECTION")?.has(s.id)) {
                await tx.section.update({
                  where: { id: s.id },
                  data: {
                    metreNumerator: s.metreNumerator ?? null,
                    metreDenominator: s.metreDenominator ?? null,
                    isCommonTime: s.isCommonTime ?? false,
                    isCutTime: s.isCutTime ?? false,
                    fastestStructuralNotesPerBar:
                      s.fastestStructuralNotesPerBar ?? null,
                    fastestBelCantoNotesPerBar:
                      s.fastestBelCantoNotesPerBar ?? null,
                    fastestStaccatoNotesPerBar:
                      s.fastestStaccatoNotesPerBar ?? null,
                    fastestRepeatedNotesPerBar:
                      s.fastestRepeatedNotesPerBar ?? null,
                    fastestOrnamentalNotesPerBar:
                      s.fastestOrnamentalNotesPerBar ?? null,
                    tempoIndicationId: s.tempoIndicationId,
                    comment: s.comment ?? null,
                    commentForReview: s.commentForReview ?? null,
                  },
                });
              }
            }

            // Section 2-phase rank updates
            const sectionUpdates = (m.sections ?? [])
              .filter((s) => typeof s.rank === "number")
              .map((s) => ({ id: s.id, rank: s.rank }));
            if (sectionUpdates.length > 0) {
              await applyRankUpdatesInTwoPhases(tx, {
                model: "Section",
                scope: { movementId: m.id },
                updates: sectionUpdates,
              });
            }
          }
        }

        // ==========================================
        // Phase 3 — Source and Direct Children
        // ==========================================

        // MMSource update (fields + sectionCount + permalink)
        const srcDesc = finalState.mMSourceDescription;
        txDebug.mMSource = await tx.mMSource.update({
          where: { id: review.mMSourceId },
          data: {
            title: srcDesc?.title ?? null,
            type: srcDesc?.type ?? null,
            link: srcDesc?.link ?? "",
            permalink: derived.permalink || "",
            year: srcDesc?.year ?? null,
            isYearEstimated: srcDesc?.isYearEstimated ?? false,
            comment: srcDesc?.comment ?? null,
            sectionCount: derived.sectionCount,
          },
        });

        // References
        for (const r of finalState.mMSourceDescription?.references ?? []) {
          if (!r.id) continue;
          if (!baselineReferenceIds.has(r.id)) {
            await tx.reference.create({
              data: {
                id: r.id,
                mMSourceId: review.mMSourceId,
                type: r.type,
                reference: r.reference,
              },
            });
          } else if (changedEntitiesByType.get("REFERENCE")?.has(r.id)) {
            await tx.reference.update({
              where: { id: r.id },
              data: {
                type: r.type,
                reference: r.reference,
              },
            });
          }
        }

        // Contributions
        for (const c of finalState.mMSourceContributions ?? []) {
          if (!c.id) continue;
          if (!baselineContributionIds.has(c.id)) {
            await tx.contribution.create({
              data: {
                id: c.id,
                mMSourceId: review.mMSourceId,
                role: c.role,
                personId: c.personId ?? null,
                organizationId: c.organizationId ?? null,
              },
            });
          } else if (changedEntitiesByType.get("CONTRIBUTION")?.has(c.id)) {
            await tx.contribution.update({
              where: { id: c.id },
              data: {
                role: c.role,
                personId: c.personId ?? null,
                organizationId: c.organizationId ?? null,
              },
            });
          }
        }

        // MMSourcesOnPieceVersions (ensure new rows exist with temporary ranks, then apply 2-phase ranks)
        const existingJoins = await tx.mMSourcesOnPieceVersions.findMany({
          where: { mMSourceId: review.mMSourceId },
          select: { id: true, pieceVersionId: true, rank: true },
        });
        const existingJoinPvIds = new Set(
          existingJoins.map((j) => j.pieceVersionId),
        );
        const newJoinRows = (finalState.mMSourceOnPieceVersions ?? []).filter(
          (j) => !existingJoinPvIds.has(j.pieceVersionId),
        );

        if (newJoinRows.length > 0) {
          const maxExistingRank =
            existingJoins.length > 0
              ? Math.max(...existingJoins.map((j) => j.rank))
              : 0;
          for (let i = 0; i < newJoinRows.length; i++) {
            const row = newJoinRows[i];
            await tx.mMSourcesOnPieceVersions.create({
              data: {
                mMSourceId: review.mMSourceId,
                pieceVersionId: row.pieceVersionId,
                rank: maxExistingRank + 5000 + i + 1,
              },
            });
          }
        }

        const allJoinsNow = await tx.mMSourcesOnPieceVersions.findMany({
          where: { mMSourceId: review.mMSourceId },
          select: { id: true, pieceVersionId: true },
        });
        const joinIdByPvId = new Map(
          allJoinsNow.map((j) => [j.pieceVersionId, j.id]),
        );
        const joinRankUpdates = (finalState.mMSourceOnPieceVersions ?? [])
          .filter(
            (j) =>
              joinIdByPvId.has(j.pieceVersionId) &&
              typeof j.rank === "number",
          )
          .map((j) => ({
            id: joinIdByPvId.get(j.pieceVersionId)!,
            rank: j.rank,
          }));

        if (joinRankUpdates.length > 0) {
          await applyRankUpdatesInTwoPhases(tx, {
            model: "MMSourcesOnPieceVersions",
            scope: { mMSourceId: review.mMSourceId },
            updates: joinRankUpdates,
          });
        }

        // MetronomeMarks
        for (const mm of finalState.metronomeMarks ?? []) {
          if (!mm.id) continue;
          if (!baselineMMIds.has(mm.id)) {
            await tx.metronomeMark.create({
              data: {
                id: mm.id,
                mMSourceId: review.mMSourceId,
                sectionId: mm.sectionId,
                beatUnit: mm.beatUnit,
                bpm: mm.bpm,
                comment: mm.comment ?? null,
              },
            });
          } else if (changedEntitiesByType.get("METRONOME_MARK")?.has(mm.id)) {
            await tx.metronomeMark.update({
              where: { id: mm.id },
              data: {
                sectionId: mm.sectionId,
                beatUnit: mm.beatUnit,
                bpm: mm.bpm,
                comment: mm.comment ?? null,
              },
            });
          }
        }

        // ==========================================
        // Phase 4 — Traceability and Closure
        // ==========================================

        // AuditLog entries
        if (finalAuditEntries.length > 0) {
          txDebug.auditLogs = await tx.auditLog.createMany({
            data: finalAuditEntries.map((entry) => ({
              reviewId: entry.reviewId,
              entityType: entry.entityType as AUDIT_ENTITY_TYPE,
              entityId: entry.entityId,
              operation: entry.operation as OPERATION,
              before: (entry.before as any) ?? Prisma.DbNull,
              after: (entry.after as any) ?? Prisma.DbNull,
              authorId: userId,
            })),
          });
        }

        // ReviewedEntity entries
        const reviewedEntityPayloads = new Map<
          string,
          { type: REVIEWED_ENTITY_TYPE; id: string }
        >();

        const addReviewedEntity = (
          type: REVIEWED_ENTITY_TYPE,
          id: string | undefined | null,
          alreadyReviewedIds: string[] | undefined | null,
        ) => {
          if (!id) return;
          const key = `${type}:${id}`;
          if (reviewedEntityPayloads.has(key)) return;
          if (alreadyReviewedIds?.includes(id)) return;
          reviewedEntityPayloads.set(key, { type, id });
        };

        finalState.persons?.forEach((p) =>
          addReviewedEntity(
            REVIEWED_ENTITY_TYPE.PERSON,
            p.id,
            globallyReviewed?.personIds,
          ),
        );
        finalState.organizations?.forEach((o) =>
          addReviewedEntity(
            REVIEWED_ENTITY_TYPE.ORGANIZATION,
            o.id,
            globallyReviewed?.organizationIds,
          ),
        );
        finalState.collections?.forEach((c) =>
          addReviewedEntity(
            REVIEWED_ENTITY_TYPE.COLLECTION,
            c.id,
            globallyReviewed?.collectionIds,
          ),
        );
        finalState.pieces?.forEach((p) =>
          addReviewedEntity(
            REVIEWED_ENTITY_TYPE.PIECE,
            p.id,
            globallyReviewed?.pieceIds,
          ),
        );
        finalState.pieceVersions?.forEach((pv) =>
          addReviewedEntity(
            REVIEWED_ENTITY_TYPE.PIECE_VERSION,
            pv.id,
            globallyReviewed?.pieceVersionIds,
          ),
        );

        for (const item of reviewedEntityPayloads.values()) {
          if (!txDebug.upsertedReviewedEntities)
            txDebug.upsertedReviewedEntities = [];
          txDebug.upsertedReviewedEntities.push(
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
            }),
          );
        }

        // Finalize Review & MMSource states
        const now = new Date();
        txDebug.finalReviewUpdate = await tx.review.update({
          where: { id: reviewId },
          data: {
            state: REVIEW_STATE.APPROVED,
            endedAt: now,
            overallComment: overallComment || null,
          },
        });

        txDebug.finalMMSourceUpdate = await tx.mMSource.update({
          where: { id: review.mMSourceId },
          data: {
            reviewState: REVIEW_STATE.APPROVED,
          },
        });
      },
      { timeout: 30000 },
    );

    // Fetch updated MM Source from DB for post-transaction log email
    const mMSourceFromDb = await db.mMSource
      .findUnique({
        where: { id: review.mMSourceId },
        include: {
          references: true,
          contributions: true,
          mMSourcesOnPieceVersions: true,
          metronomeMarks: true,
          auditLogs: { where: { reviewId } },
        },
      })
      .catch(() => null);

    await sendEmail({
      type: "Review submit transaction debug",
      content: {
        reviewId,
        txDebug,
        mMSourceFromDb,
      },
    }).catch((err) =>
      console.error(
        `[api/review/${reviewId}/submit] tx sendEmail ERROR :`,
        err?.status,
        err?.message,
      ),
    );

    const summary = {
      reviewId,
      overallComment: overallComment || null,
      changedCount: finalChangedFieldPaths.length,
      auditEntriesCount: finalAuditEntries.length,
      forkedCount: finalForkResult?.createdPieceVersionIds?.length ?? 0,
      entitiesTouched: Object.fromEntries(
        Array.from(
          new Set(finalChangedFieldPaths.map((d) => d.entityType)),
        ).map((et) => [
          et,
          new Set(
            finalChangedFieldPaths
              .filter((d) => d.entityType === et)
              .map((d) => d.entityId ?? "__source__"),
          ).size,
        ]),
      ),
    };

    prodLog.info(
      `[review submit] Review ${reviewId} successfully approved and submitted`,
    );

    return NextResponse.json({
      ok: true,
      summary,
      txDebug,
    });
  } catch (err: any) {
    debug.error("[review submit] Transaction error:", err);

    await sendEmail({
      type: "Review SUBMIT transaction ERROR",
      content: {
        reviewId,
        error: {
          status: err?.status,
          message: err?.message,
          stack: err?.stack,
        },
        txDebug,
      },
    }).catch((emailErr) =>
      console.error(
        `[api/review/${reviewId}/submit] error sendEmail ERROR :`,
        emailErr?.status,
        emailErr?.message,
      ),
    );

    if (
      err?.code === "P2002" ||
      /unique|constraint|duplicate/i.test(err?.message ?? "")
    ) {
      return NextResponse.json(
        {
          error: `[review submit] Conflict: A unique constraint violation occurred (${err.message})`,
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        error: `[review submit] Transaction failed: ${err.message}`,
        txDebug,
      },
      { status: 500 },
    );
  }
}
