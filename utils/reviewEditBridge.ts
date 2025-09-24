// Bridge between Review working copy and Feed Form state
// Phase 2 – Scaffolding
// This file provides type stubs and placeholder functions to be implemented in subsequent steps.

import { FeedFormState, ReviewContext } from "@/types/feedFormTypes";
import { FEED_FORM_BOOT_KEY } from "@/utils/constants";

// Minimal structure for the review working copy we operate on
export type ReviewWorkingCopy = {
  graph: any; // ChecklistGraph (client shape)
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
// NOTE: This is a placeholder; the concrete ranks must align with stepsUtils.ts
export const STEP_FOR_ENTITY: Record<string, number> = {
  MM_SOURCE: 1, // source metadata/contributions
  COLLECTION: 1, // collection description step (within source/pieces)
  PIECE: 1, // piece description step
  PIECE_VERSION: 2, // structure step (piece versions/movements)
  MOVEMENT: 2,
  SECTION: 2,
  TEMPO_INDICATION: 2,
  METRONOME_MARK: 3, // dedicated MM step in the form
  REFERENCE: 1, // source metadata step
  CONTRIBUTION: 1, // source contributions step
  PERSON: 1, // metadata (via contributions)
  ORGANIZATION: 1, // metadata (via contributions)
};

// Heuristic, to be replaced with the definitive table-driven mapping based on actual fieldPath schema
export function resolveStepForFieldPath(fieldPath: string): number {
  // fieldPath examples (expected):
  // MM_SOURCE.title, PIECE:{pieceId}.title, PIECE_VERSION:{pvId}.movements[...]
  // We only extract the root entity name before the first dot or colon
  const root = fieldPath.split(".")[0]?.split(":")[0] ?? "";
  return STEP_FOR_ENTITY[root] ?? 0;
}

// Build a FeedFormState from a review working copy and the clicked checklist fieldPath
// This is a stub returning the current persisted feed form state shape filled with minimal formInfo
export function buildFeedFormStateFromWorkingCopy(
  workingCopy: ReviewWorkingCopy,
  fieldPath: string,
  opts: { reviewId: string; sliceKey?: string; anchors?: BridgeAnchors }
): FeedFormState {
  const step = resolveStepForFieldPath(fieldPath);
  const reviewContext: ReviewContext = {
    reviewId: opts.reviewId,
    reviewEdit: true,
    updatedAt: new Date().toISOString(),
    anchors: opts.anchors,
  };

  // TODO: Map workingCopy.graph to full FeedFormState structure
  const stub: FeedFormState = {
    formInfo: {
      currentStepRank: step,
      introDone: true,
      reviewContext,
    },
    // The rest of the fields will be populated in a later step
    mMSourceDescription: undefined,
    mMSourceContributions: [],
    mMSourcePieceVersions: [],
    organizations: [],
    collections: [],
    persons: [],
    pieces: [],
    pieceVersions: [],
    tempoIndications: [],
    metronomeMarks: [],
  };
  return stub;
}

// Rebuild the review working copy graph from a feed form state (inverse mapping of the above)
// This is a stub that currently returns the input graph unchanged.
export function rebuildWorkingCopyFromFeedForm(
  feedFormState: FeedFormState,
  previousWorkingCopy: ReviewWorkingCopy
): ReviewWorkingCopy {
  // TODO: Implement proper inverse mapping from FeedFormState to review working copy graph
  return {
    graph: previousWorkingCopy.graph,
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
