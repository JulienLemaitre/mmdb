// Bridge between Review working copy and Feed Form state

import { FeedFormState, ReviewContext } from "@/types/feedFormTypes";
import { FEED_FORM_BOOT_KEY } from "@/utils/constants";
import {
  ChecklistGraph,
  RequiredChecklistItem,
} from "@/features/review/ReviewChecklistSchema";

// Minimal structure for the review working copy we operate on
export type ReviewWorkingCopy = {
  graph: ChecklistGraph; // ChecklistGraph (client shape)
  updatedAt: string; // ISO timestamp
};

// Anchors used to focus a specific sub-entity inside the multistep editor
export type BridgeAnchors = {
  pvId?: string; // pieceVersionId
  movId?: string; // movementId
  secId?: string; // sectionId
  mmId?: string; // metronomeMarkId
};

// Draft mapping from entity types in checklist field paths to feed form step ranks
// TODO: align to MMSource, SinglePiece and Collection stepsUtils.ts files
export const STEP_FOR_ENTITY: Record<string, number> = {
  source: 1,
  collection: 1,
  piece: 1,
  pieceVersion: 2,
  movement: 2,
  section: 2,
  tempoIndication: 2,
  metronomeMark: 3,
  reference: 1,
  contribution: 1,
  person: 1,
  organization: 1,
};

// Heuristic, to be replaced with the definitive table-driven mapping based on actual fieldPath schema
export function resolveStepForFieldPath(fieldPath: string): number {
  // fieldPath examples: source.title, piece[p-1].title
  // We only extract the root entity name before the first dot or bracket
  const root = fieldPath.split(".")[0]?.split("[")[0] ?? "";
  return STEP_FOR_ENTITY[root] ?? 0;
}

// Build a FeedFormState from a review working copy and the clicked checklist item
export function buildFeedFormStateFromWorkingCopy(
  workingCopy: ReviewWorkingCopy,
  clickedItem: RequiredChecklistItem, // Accept the whole item
  opts: { reviewId: string; sliceKey?: string; anchors?: BridgeAnchors },
): FeedFormState {
  // TODO: replace with the proper formInfo properties to deduce the current step
  const step = resolveStepForFieldPath(clickedItem.fieldPath);

  // Build anchors directly from the item's lineage, which is now reliable
  const anchors: BridgeAnchors = {
    pvId: clickedItem.lineage.pieceVersionId,
    movId: clickedItem.lineage.movementId,
    // You can add more as needed, e.g., for a specific section
    ...(clickedItem.entityType === "SECTION" && clickedItem.entityId
      ? {
          secId: clickedItem.entityId,
        }
      : {}),
  };

  const reviewContext: ReviewContext = {
    reviewId: opts.reviewId, // This needs to be passed in `opts`
    reviewEdit: true,
    updatedAt: new Date().toISOString(),
    anchors,
  };

  // Since the shapes are aligned, this is now mostly a deep copy.
  const feedState: FeedFormState = {
    formInfo: {
      currentStepRank: step,
      introDone: true, // Always skip the intro in review-edit mode
      reviewContext,
    },
    // Deep-copy all the relevant slices from the working copy graph
    mMSourceDescription: { ...workingCopy.graph.source },
    mMSourceContributions: [...(workingCopy.graph.contributions ?? [])],
    mMSourceOnPieceVersions: [
      ...(workingCopy.graph.sourceOnPieceVersions ?? []),
    ],
    organizations: [...(workingCopy.graph.organizations ?? [])],
    collections: [...(workingCopy.graph.collections ?? [])],
    persons: [...(workingCopy.graph.persons ?? [])],
    pieces: [...(workingCopy.graph.pieces ?? [])],
    pieceVersions: [...(workingCopy.graph.pieceVersions ?? [])],
    tempoIndications: [...(workingCopy.graph.tempoIndications ?? [])],
    metronomeMarks: [...(workingCopy.graph.metronomeMarks ?? [])],
  };
  return feedState;
}

/**
 * JSDoc: Rebuilds the review's working copy graph from the state of the feed form.
 *
 * This function creates the next version of the `ChecklistGraph` after a user
 * finishes an editing session in the `feedForm`. It treats the incoming
 * `feedFormState` as the definitive source of truth. Any entities removed
 * by the user in the form will be absent from the new working copy.
 *
 * It performs a direct translation from the `FeedFormState` shape to the
 * `ChecklistGraph` shape, reconstructs any derived data (like `tempoIndications`),
 * and preserves immutable system fields (like `permalink`) from the previous copy.
 */
export function rebuildWorkingCopyFromFeedForm(
  feedFormState: FeedFormState,
  previousWorkingCopy: ReviewWorkingCopy,
): ReviewWorkingCopy {
  const prevGraph = previousWorkingCopy.graph || {};

  // If the feedFormState is not from a review edit session, do nothing.
  if (!feedFormState?.formInfo?.reviewContext) {
    return previousWorkingCopy;
  }

  // The incoming feedFormState is the source of truth.
  // Default to empty arrays for any missing top-level properties.
  const source = {
    ...prevGraph.source, // Preserve non-editable fields like id, permalink
    ...feedFormState.mMSourceDescription,
  };
  const contributions = feedFormState.mMSourceContributions ?? [];
  const organizations = feedFormState.organizations ?? [];
  const persons = feedFormState.persons ?? [];
  const collections = feedFormState.collections ?? [];
  const pieces = feedFormState.pieces ?? [];
  const pieceVersions = feedFormState.pieceVersions ?? [];
  const metronomeMarks = feedFormState.metronomeMarks ?? [];

  // Rebuild derived data: `tempoIndications` are collected from within the piece structure.
  const tempoIndicationMap = new Map<string, { id: string; text: string }>();
  for (const pv of pieceVersions) {
    for (const m of (pv as any).movements ?? []) {
      for (const s of (m as any).sections ?? []) {
        const ti = s.tempoIndication;
        if (ti?.id) {
          tempoIndicationMap.set(ti.id, { id: ti.id, text: ti.text ?? "" });
        }
      }
    }
  }
  const tempoIndications = Array.from(tempoIndicationMap.values());

  // Rebuild derived data: `sourceOnPieceVersions` needs to be enriched with data
  // from the newly defined pieces and pieceVersions.
  const sourceOnPieceVersions = (
    feedFormState.mMSourceOnPieceVersions ?? []
  ).map((j) => {
    const pv = pieceVersions.find((pv) => pv.id === j.pieceVersionId);
    const piece = pv ? pieces.find((p) => p.id === pv.pieceId) : undefined;
    return {
      joinId: `join-${j.pieceVersionId}`, // Regenerate joinId for simplicity
      mMSourceId: source.id,
      pieceVersionId: j.pieceVersionId,
      rank: j.rank,
      pieceId: pv?.pieceId as string, // TODO: replace by type safeguards for mandatory entities in workingCopy (coming from persisted MMSource)
      collectionId: piece?.collectionId ?? undefined,
      collectionRank: piece?.collectionRank ?? undefined,
    };
  });

  const nextGraph: ChecklistGraph = {
    source,
    contributions,
    organizations,
    persons,
    collections,
    pieces,
    pieceVersions,
    metronomeMarks,
    tempoIndications,
    sourceOnPieceVersions,
  };

  return {
    graph: nextGraph,
    updatedAt: new Date().toISOString(),
  };
}

// Utilities to write/read the boot payload used to start the feed form in review edit mode
export function writeBootStateForFeedForm(state: FeedFormState) {
  try {
    localStorage.setItem(FEED_FORM_BOOT_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function consumeBootStateForFeedForm(): FeedFormState | null {
  try {
    const raw = localStorage.getItem(FEED_FORM_BOOT_KEY);
    if (!raw) return null;
    localStorage.removeItem(FEED_FORM_BOOT_KEY);
    return JSON.parse(raw) as FeedFormState;
  } catch {
    return null;
  }
}
