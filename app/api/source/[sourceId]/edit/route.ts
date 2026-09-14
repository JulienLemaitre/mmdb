import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/options";
import { db } from "@/utils/server/db";
import { REVIEW_STATE } from "@/prisma/client";
import { FeedFormState } from "@/types/feedFormTypes";
import { assertsIsPersistableFeedFormState } from "@/types/formTypes";
import { getSourceFeedFormBaseline } from "@/utils/server/getSourceFeedFormBaseline";
import { extendBaselineByExistence } from "@/utils/server/extendBaselineByExistence";
import { normalizeFeedFormStateForPersistence } from "@/utils/server/normalizeFeedFormStateForPersistence";
import { computeChangedFieldPaths } from "@/features/review/reviewDiff";
import { forkModifiedSharedPieceVersions } from "@/utils/server/forkModifiedSharedPieceVersions";
import { computeMMSourceDerivedData } from "@/utils/server/computeMMSourceDerivedData";
import { applyRankUpdatesInTwoPhases } from "@/utils/server/applyRankUpdatesInTwoPhases";
import { debug } from "@/utils/debugLogger";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ sourceId: string }> },
) {
  // 1. Session verification
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json(
      { error: "[selfEdit submit] Unauthorized" },
      { status: 401 },
    );
  }

  const userId = session.user.id;
  const { sourceId } = await params;

  if (!sourceId) {
    return NextResponse.json(
      { error: "[selfEdit submit] Missing sourceId in route parameters" },
      { status: 400 },
    );
  }

  // 2. Parse JSON body
  let body: any;
  try {
    body = await req.json();
  } catch {
    debug.error("[selfEdit submit] Invalid JSON body");
    return NextResponse.json(
      { error: "[selfEdit submit] Invalid JSON body" },
      { status: 400 },
    );
  }

  const submittedState = (body?.feedFormState || body?.state) as FeedFormState;
  if (!submittedState) {
    return NextResponse.json(
      { error: "[selfEdit submit] Missing feedFormState in request body" },
      { status: 400 },
    );
  }

  // 3. Mandatory fields check
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
        error: `[selfEdit submit] Missing mandatory fields: ${missingMandatoryFields.join(", ")}`,
      },
      { status: 400 },
    );
  }

  // 4. Structure validation
  try {
    assertsIsPersistableFeedFormState(submittedState);
  } catch (err: any) {
    return NextResponse.json(
      { error: `[selfEdit submit] Invalid feedFormState: ${err.message}` },
      { status: 400 },
    );
  }

  // 5. Pre-check source existence, ownership and status
  const existingSource = await db.mMSource.findUnique({
    where: { id: sourceId },
    select: { id: true, creatorId: true, reviewState: true },
  });

  if (!existingSource) {
    return NextResponse.json(
      { error: "[selfEdit submit] MM Source not found" },
      { status: 404 },
    );
  }

  if (existingSource.creatorId !== userId) {
    return NextResponse.json(
      {
        error:
          "[selfEdit submit] Forbidden: You are not the creator of this MM Source",
      },
      { status: 403 },
    );
  }

  if (existingSource.reviewState !== REVIEW_STATE.PENDING) {
    return NextResponse.json(
      {
        error:
          "A review has started on this MM Source. Modifications are blocked.",
      },
      { status: 409 },
    );
  }

  const initialActiveReview = await db.review.findFirst({
    where: { mMSourceId: sourceId, state: REVIEW_STATE.IN_REVIEW },
    select: { id: true },
  });

  if (initialActiveReview) {
    return NextResponse.json(
      {
        error:
          "A review has started on this MM Source. Modifications are blocked.",
      },
      { status: 409 },
    );
  }

  // 6. Baseline loading and state normalization
  let baseline: FeedFormState;
  try {
    const baselineData = await getSourceFeedFormBaseline(sourceId);
    if (!baselineData) {
      return NextResponse.json(
        { error: "[selfEdit submit] Failed to load source baseline" },
        { status: 404 },
      );
    }
    baseline = await extendBaselineByExistence(
      baselineData.baseline,
      submittedState,
    );
  } catch (err: any) {
    debug.error(`[selfEdit submit] Failed to load baseline: ${err.message}`);
    return NextResponse.json(
      { error: err.message || "[selfEdit submit] Failed to load baseline" },
      { status: 500 },
    );
  }

  let normalizedState: FeedFormState;
  try {
    normalizedState = normalizeFeedFormStateForPersistence(submittedState);
  } catch (err: any) {
    debug.error(`[selfEdit submit] Normalization error: ${err.message}`);
    return NextResponse.json(
      { error: `[selfEdit submit] Normalization error: ${err.message}` },
      { status: 400 },
    );
  }

  // 7. Execute atomic database transaction with concurrency guard
  try {
    await db.$transaction(async (tx) => {
      // --- Concurrency guard: verify atomically that source is still PENDING and no active review exists ---
      const sourceInTx = await tx.mMSource.findUnique({
        where: { id: sourceId },
        select: { creatorId: true, reviewState: true },
      });

      if (!sourceInTx || sourceInTx.creatorId !== userId) {
        throw new Error("FORBIDDEN");
      }

      if (sourceInTx.reviewState !== REVIEW_STATE.PENDING) {
        throw new Error("CONFLICT_REVIEW_STARTED");
      }

      const activeReviewInTx = await tx.review.findFirst({
        where: { mMSourceId: sourceId, state: REVIEW_STATE.IN_REVIEW },
        select: { id: true },
      });

      if (activeReviewInTx) {
        throw new Error("CONFLICT_REVIEW_STARTED");
      }

      // --- Step A: Fork modified shared PieceVersions ---
      const forkResult = await forkModifiedSharedPieceVersions(tx, {
        mMSourceId: sourceId,
        baseline,
        state: normalizedState,
      });

      const finalState = forkResult.state;
      const protectedEntityIds = forkResult.protectedEntityIds;

      // --- Step B: Calculate diff & derived data on final state ---
      const finalChangedFieldPaths = computeChangedFieldPaths(
        baseline,
        finalState,
      );
      const derived = computeMMSourceDerivedData(finalState);

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

      // Precompute baseline IDs for fast existence checks
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

      // 1. MetronomeMarks
      const stateMMIds = new Set(
        (finalState.metronomeMarks ?? [])
          .map((mm) => mm.id)
          .filter(Boolean),
      );
      const deletedMMIds = Array.from(baselineMMIds).filter(
        (id) => !stateMMIds.has(id),
      );
      if (deletedMMIds.length > 0) {
        await tx.metronomeMark.deleteMany({
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
        await tx.section.deleteMany({
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
        await tx.movement.deleteMany({
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
        await tx.reference.deleteMany({
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
        await tx.contribution.deleteMany({
          where: { id: { in: deletedContribIds } },
        });
      }

      // 6. MMSourcesOnPieceVersions joins absent from state
      const statePvIdsOnJoin = new Set<string>(
        (finalState.mMSourceOnPieceVersions ?? [])
          .map((j) => j.pieceVersionId)
          .filter((id): id is string => Boolean(id)),
      );
      await tx.mMSourcesOnPieceVersions.deleteMany({
        where: {
          mMSourceId: sourceId,
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

      // Pieces
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

      // Piece collection rank updates
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

      // PieceVersions
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

      // Movements
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

      // Sections
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

      // MMSource update
      const srcDesc = finalState.mMSourceDescription;
      await tx.mMSource.update({
        where: { id: sourceId },
        data: {
          title: srcDesc?.title ?? null,
          ...(srcDesc?.type ? { type: srcDesc.type } : {}),
          link: srcDesc?.link ?? "",
          permalink: derived.permalink || "",
          year: srcDesc?.year ?? null,
          isYearEstimated: srcDesc?.isYearEstimated ?? false,
          comment: srcDesc?.comment ?? null,
          sectionCount: derived.sectionCount,
          reviewState: REVIEW_STATE.PENDING,
        },
      });

      // References
      for (const r of finalState.mMSourceDescription?.references ?? []) {
        if (!r.id) continue;
        if (!baselineReferenceIds.has(r.id)) {
          await tx.reference.create({
            data: {
              id: r.id,
              mMSourceId: sourceId,
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
        const personId = "personId" in c ? c.personId : null;
        const organizationId = "organizationId" in c ? c.organizationId : null;
        if (!baselineContributionIds.has(c.id)) {
          await tx.contribution.create({
            data: {
              id: c.id,
              mMSourceId: sourceId,
              role: c.role,
              personId: personId ?? null,
              organizationId: organizationId ?? null,
            },
          });
        } else if (changedEntitiesByType.get("CONTRIBUTION")?.has(c.id)) {
          await tx.contribution.update({
            where: { id: c.id },
            data: {
              role: c.role,
              personId: personId ?? null,
              organizationId: organizationId ?? null,
            },
          });
        }
      }

      // MMSourcesOnPieceVersions joins
      const existingJoins = await tx.mMSourcesOnPieceVersions.findMany({
        where: { mMSourceId: sourceId },
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
              mMSourceId: sourceId,
              pieceVersionId: row.pieceVersionId,
              rank: maxExistingRank + 5000 + i + 1,
            },
          });
        }
      }

      const allJoinsNow = await tx.mMSourcesOnPieceVersions.findMany({
        where: { mMSourceId: sourceId },
        select: { id: true, pieceVersionId: true },
      });
      const joinIdByPvId = new Map(
        allJoinsNow.map((j) => [j.pieceVersionId, j.id]),
      );
      const joinUpdates = (finalState.mMSourceOnPieceVersions ?? [])
        .filter(
          (j) =>
            joinIdByPvId.has(j.pieceVersionId) &&
            typeof j.rank === "number",
        )
        .map((j) => ({
          id: joinIdByPvId.get(j.pieceVersionId)!,
          rank: j.rank,
        }));

      if (joinUpdates.length > 0) {
        await applyRankUpdatesInTwoPhases(tx, {
          model: "MMSourcesOnPieceVersions",
          scope: { mMSourceId: sourceId },
          updates: joinUpdates,
        });
      }

      // MetronomeMarks
      for (const mm of finalState.metronomeMarks ?? []) {
        if (!mm.id || mm.noMM) continue;
        if (!baselineMMIds.has(mm.id)) {
          await tx.metronomeMark.create({
            data: {
              id: mm.id,
              mMSourceId: sourceId,
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
    });

    return NextResponse.json({ success: true, mMSourceId: sourceId });
  } catch (err: any) {
    debug.error(`[selfEdit submit] Transaction failed:`, err);
    if (err?.message === "CONFLICT_REVIEW_STARTED") {
      return NextResponse.json(
        {
          error:
            "A review has started on this MM Source. Modifications are blocked.",
        },
        { status: 409 },
      );
    }
    if (err?.message === "FORBIDDEN") {
      return NextResponse.json(
        {
          error:
            "[selfEdit submit] Forbidden: You are not the creator of this MM Source",
        },
        { status: 403 },
      );
    }
    return NextResponse.json(
      { error: err?.message || "[selfEdit submit] Transaction failed" },
      { status: 500 },
    );
  }
}
