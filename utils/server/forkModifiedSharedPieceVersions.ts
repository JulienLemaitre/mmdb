import { PrismaClient, Prisma } from "@/prisma/client";
import { FeedFormState } from "@/types/feedFormTypes";
import {
  PieceVersionState,
  MovementState,
  SectionState,
} from "@/types/formTypes";
import { computeChangedFieldPaths, norm } from "@/features/review/reviewDiff";
import { prodLog } from "@/utils/debugLogger";
import { getNewUuid } from "@/utils/getNewUuid";

export type PrismaTx = PrismaClient | Prisma.TransactionClient;

export type ForkResult = {
  state: FeedFormState; // état remappé
  createdPieceVersionIds: string[]; // les copies
  protectedEntityIds: Set<string>; // sous-arbre d'origine : PV + Movements + Sections
  forkedPairs: Array<{ from: string; to: string }>; // pour la journalisation
};

/**
 * Checks whether a PieceVersion has been modified compared to its baseline.
 * Uses the L7 diff engine (`computeChangedFieldPaths`) restricted to the pieceVersion subtree.
 */
export function isPieceVersionModified(
  baselinePv: PieceVersionState | undefined,
  statePv: PieceVersionState,
): boolean {
  if (!baselinePv) {
    // If not in baseline, it's a newly created piece version, not a modification of an existing one.
    return false;
  }

  if (norm(baselinePv.pieceId) !== norm(statePv.pieceId)) {
    return true;
  }

  const diffs = computeChangedFieldPaths(
    { pieceVersions: [baselinePv] },
    { pieceVersions: [statePv] },
  );

  return diffs.length > 0;
}

/**
 * Evaluates each PieceVersion linked to the MMSource being reviewed:
 * If a PieceVersion is modified AND shared with at least one other MMSource in the database,
 * it is forked (cloned with new UUIDs for PV, Movements, and Sections) so that the original
 * shared PieceVersion remains intact for other sources.
 *
 * Remaps the submitted state (pieceVersions, mMSourceOnPieceVersions, metronomeMarks)
 * and records all original IDs in protectedEntityIds to prevent deletion during persistence.
 */
export async function forkModifiedSharedPieceVersions(
  tx: PrismaTx,
  args: { mMSourceId: string; baseline: FeedFormState; state: FeedFormState },
): Promise<ForkResult> {
  const { mMSourceId, baseline, state } = args;

  const createdPieceVersionIds: string[] = [];
  const protectedEntityIds = new Set<string>();
  const forkedPairs: Array<{ from: string; to: string }> = [];

  const linkedPvIds = new Set(
    (state.mMSourceOnPieceVersions ?? [])
      .map((j) => j.pieceVersionId)
      .filter((id): id is string => Boolean(id)),
  );

  const baselinePvMap = new Map(
    (baseline.pieceVersions ?? []).map((pv) => [pv.id, pv]),
  );

  const pvIdRemap = new Map<string, string>();
  const sectionIdRemap = new Map<string, string>();
  const clonedPvsByOldId = new Map<string, PieceVersionState>();

  for (const pv of state.pieceVersions ?? []) {
    if (!linkedPvIds.has(pv.id)) {
      continue;
    }

    const baselinePv = baselinePvMap.get(pv.id);
    if (!baselinePv) {
      // Absent from baseline / DB -> normal creation, no fork
      continue;
    }

    const modified = isPieceVersionModified(baselinePv, pv);
    if (!modified) {
      // Unmodified -> no fork
      continue;
    }

    // Check if referenced by another MMSource in DB
    const otherSourcesCount = await tx.mMSourcesOnPieceVersions.count({
      where: {
        pieceVersionId: pv.id,
        mMSourceId: { not: mMSourceId },
      },
    });

    if (otherSourcesCount === 0) {
      // Modified but not shared -> update in place, no fork
      continue;
    }

    // Fork required!
    const oldPvId = pv.id;
    const newPvId = getNewUuid();

    createdPieceVersionIds.push(newPvId);
    forkedPairs.push({ from: oldPvId, to: newPvId });
    pvIdRemap.set(oldPvId, newPvId);

    // Register all original IDs in protectedEntityIds (from baseline and state)
    protectedEntityIds.add(oldPvId);
    for (const mov of baselinePv.movements ?? []) {
      if (mov.id) protectedEntityIds.add(mov.id);
      for (const sec of mov.sections ?? []) {
        if (sec.id) protectedEntityIds.add(sec.id);
      }
    }
    for (const mov of pv.movements ?? []) {
      if (mov.id) protectedEntityIds.add(mov.id);
      for (const sec of mov.sections ?? []) {
        if (sec.id) protectedEntityIds.add(sec.id);
      }
    }

    // Clone movements and sections using values from submitted state
    const clonedMovements: MovementState[] = (pv.movements ?? []).map((mov) => {
      const newMovId = getNewUuid();
      const clonedSections: SectionState[] = (mov.sections ?? []).map((sec) => {
        const newSecId = getNewUuid();
        if (sec.id) {
          sectionIdRemap.set(sec.id, newSecId);
        }
        return {
          id: newSecId,
          rank: sec.rank,
          tempoIndicationId: sec.tempoIndicationId, // Preserved as-is
          metreNumerator: sec.metreNumerator,
          metreDenominator: sec.metreDenominator,
          isCommonTime: sec.isCommonTime,
          isCutTime: sec.isCutTime,
          fastestStructuralNotesPerBar: sec.fastestStructuralNotesPerBar,
          fastestBelCantoNotesPerBar: sec.fastestBelCantoNotesPerBar,
          fastestStaccatoNotesPerBar: sec.fastestStaccatoNotesPerBar,
          fastestRepeatedNotesPerBar: sec.fastestRepeatedNotesPerBar,
          fastestOrnamentalNotesPerBar: sec.fastestOrnamentalNotesPerBar,
          comment: sec.comment,
          commentForReview: sec.commentForReview,
        };
      });

      return {
        id: newMovId,
        rank: mov.rank,
        key: mov.key,
        isVariation: mov.isVariation,
        sections: clonedSections,
      };
    });

    const clonedPv: PieceVersionState = {
      id: newPvId,
      pieceId: pv.pieceId, // Unchanged
      category: pv.category, // From submitted state
      movements: clonedMovements,
    };

    clonedPvsByOldId.set(oldPvId, clonedPv);

    prodLog.info(
      `[forkPieceVersion] ${oldPvId} → ${newPvId} (source ${mMSourceId})`,
    );
  }

  if (forkedPairs.length === 0) {
    return {
      state,
      createdPieceVersionIds: [],
      protectedEntityIds: new Set<string>(),
      forkedPairs: [],
    };
  }

  // Remap state with cloned piece versions, updated joins, and updated metronome marks
  const updatedPieceVersions = (state.pieceVersions ?? []).map((pv) => {
    return clonedPvsByOldId.get(pv.id) ?? pv;
  });

  const updatedMMSourceOnPieceVersions = (
    state.mMSourceOnPieceVersions ?? []
  ).map((j) => {
    const remappedPvId = pvIdRemap.get(j.pieceVersionId);
    if (remappedPvId) {
      return {
        ...j,
        pieceVersionId: remappedPvId,
      };
    }
    return j;
  });

  const updatedMetronomeMarks = (state.metronomeMarks ?? []).map((mm) => {
    const remappedPvId = pvIdRemap.get(mm.pieceVersionId);
    const remappedSecId = sectionIdRemap.get(mm.sectionId);

    if (remappedPvId || remappedSecId) {
      return {
        ...mm,
        pieceVersionId: remappedPvId ?? mm.pieceVersionId,
        sectionId: remappedSecId ?? mm.sectionId,
      };
    }
    return mm;
  });

  const updatedMMSourceDescription = state.mMSourceDescription
    ? {
        ...state.mMSourceDescription,
        ...(state.mMSourceDescription.pieceVersions
          ? {
              pieceVersions: state.mMSourceDescription.pieceVersions.map(
                (pv) => {
                  const remappedPvId = pvIdRemap.get(pv.id);
                  return remappedPvId ? { id: remappedPvId } : pv;
                },
              ),
            }
          : {}),
      }
    : undefined;

  const remappedState: FeedFormState = {
    ...state,
    ...(updatedMMSourceDescription
      ? { mMSourceDescription: updatedMMSourceDescription }
      : {}),
    pieceVersions: updatedPieceVersions,
    mMSourceOnPieceVersions: updatedMMSourceOnPieceVersions,
    metronomeMarks: updatedMetronomeMarks,
  };

  return {
    state: remappedState,
    createdPieceVersionIds,
    protectedEntityIds,
    forkedPairs,
  };
}

export default forkModifiedSharedPieceVersions;
