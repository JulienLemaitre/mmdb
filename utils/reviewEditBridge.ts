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
  const prev = previousWorkingCopy.graph || {};

  // Fast-path: if feed state has no relevant slices, keep the previous graph reference unchanged
  const hasSlices = Boolean(
    feedFormState?.pieces?.length ||
      feedFormState?.pieceVersions?.length ||
      feedFormState?.mMSourceDescription ||
      feedFormState?.mMSourcePieceVersions?.length ||
      feedFormState?.collections?.length ||
      feedFormState?.metronomeMarks?.length ||
      feedFormState?.tempoIndications?.length
  );
  if (!hasSlices) {
    return {
      graph: previousWorkingCopy.graph,
      updatedAt: new Date().toISOString(),
    };
  }

  // Helper lookups from feed state
  const feedPieces = feedFormState.pieces ?? [];
  const feedPVs = feedFormState.pieceVersions ?? [];
  const feedCollections = feedFormState.collections ?? [];
  const feedMovements = feedPVs.flatMap((pv) =>
    (pv.movements ?? []).map((m) => ({ ...m, pieceVersionId: pv.id })),
  );
  const feedSections = feedMovements.flatMap((mv) =>
    (mv.sections ?? []).map((s) => ({ ...s, movementId: mv.id })),
  );

  // Build tempoIndications deduped from sections
  const tempoIndicationMap = new Map<string, { id: string; text: string }>();
  for (const s of feedSections) {
    const ti = s.tempoIndication;
    if (ti && typeof ti.id === "string") {
      tempoIndicationMap.set(ti.id, { id: ti.id, text: ti.text ?? "" });
    }
  }

  // Source metadata (fallback to previous for fields not provided by the feed form)
  const desc = feedFormState.mMSourceDescription ?? {};
  const source = {
    id: prev?.source?.id,
    title: desc.title ?? prev?.source?.title ?? null,
    type: desc.type ?? prev?.source?.type ?? null,
    link: desc.link ?? prev?.source?.link ?? null,
    permalink: prev?.source?.permalink ?? null, // feed form does not own permalink; preserve
    year: desc.year ?? prev?.source?.year ?? null,
    comment: desc.comment ?? prev?.source?.comment ?? "",
  } as any;

  // Collections
  const collections = feedCollections.length
    ? feedCollections.map((c) => ({ id: c.id, title: c.title, composerId: c.composerId }))
    : prev?.collections ?? [];

  // Pieces
  const pieces = feedPieces.length
    ? feedPieces.map((p) => ({
        id: p.id,
        title: p.title ?? null,
        nickname: p.nickname ?? null,
        composerId: p.composerId ?? null,
        yearOfComposition: p.yearOfComposition ?? null,
        collectionId: p.collectionId ?? null,
        collectionRank: p.collectionRank ?? null,
      }))
    : prev?.pieces ?? [];

  // Piece Versions
  const pieceVersions = feedPVs.length
    ? feedPVs.map((pv) => ({ id: pv.id, pieceId: pv.pieceId ?? null, category: pv.category ?? null }))
    : prev?.pieceVersions ?? [];

  // Movements
  const movements = feedMovements.length
    ? feedMovements.map((m) => ({ id: m.id, pieceVersionId: m.pieceVersionId, rank: m.rank, key: (m as any).key ?? null }))
    : prev?.movements ?? [];

  // Sections
  const sections = feedSections.length
    ? feedSections.map((s) => ({
        id: s.id,
        movementId: s.movementId,
        rank: s.rank,
        metreNumerator: s.metreNumerator,
        metreDenominator: s.metreDenominator,
        isCommonTime: s.isCommonTime,
        isCutTime: s.isCutTime,
        fastestStructuralNotesPerBar: s.fastestStructuralNotesPerBar,
        fastestStaccatoNotesPerBar: s.fastestStaccatoNotesPerBar ?? null,
        fastestRepeatedNotesPerBar: s.fastestRepeatedNotesPerBar ?? null,
        fastestOrnamentalNotesPerBar: s.fastestOrnamentalNotesPerBar ?? null,
        isFastestStructuralNoteBelCanto: s.isFastestStructuralNoteBelCanto ?? false,
        tempoIndicationId: s.tempoIndication?.id,
        comment: s.comment ?? "",
        commentForReview: s.commentForReview ?? "",
      }))
    : prev?.sections ?? [];

  // Tempo indications
  const tempoIndications = tempoIndicationMap.size
    ? Array.from(tempoIndicationMap.values())
    : prev?.tempoIndications ?? [];

  // Metronome marks (ignore "noMM" entries)
  const metronomeMarks = (feedFormState.metronomeMarks ?? []).length
    ? (feedFormState.metronomeMarks ?? [])
        .filter((mm) => (mm as any).noMM !== true)
        .map((mm: any) => ({
          id: mm.id ?? `${mm.sectionId}`,
          sectionId: mm.sectionId,
          beatUnit: mm.beatUnit,
          bpm: mm.bpm,
          comment: mm.comment ?? "",
        }))
    : prev?.metronomeMarks ?? [];

  // References & Contributions: keep previous for stability (feed form lacks reference ids)
  const references = prev?.references ?? [];
  const contributions = prev?.contributions ?? [];
  const persons = prev?.persons ?? [];
  const organizations = prev?.organizations ?? [];

  // Source contents (ordering): preserve joinIds when possible
  const prevJoinsByPv: Record<string, any> = Object.fromEntries(
    (prev?.sourceContents ?? []).map((j: any) => [j.pieceVersionId, j]),
  );
  let sourceContents: any[] = prev?.sourceContents ?? [];
  const feedJoins = feedFormState.mMSourcePieceVersions ?? [];
  if (feedJoins.length) {
    const pieceById: Record<string, any> = Object.fromEntries(
      pieces.map((p: any) => [p.id, p]),
    );
    sourceContents = feedJoins.map((j) => {
      const prevJoin = prevJoinsByPv[j.pieceVersionId];
      const pv = pieceVersions.find((pv) => pv.id === j.pieceVersionId);
      const piece = pv ? pieceById[pv.pieceId] : undefined;
      return {
        joinId: prevJoin?.joinId ?? `join-${j.pieceVersionId}`,
        mMSourceId: source.id,
        pieceVersionId: j.pieceVersionId,
        rank: j.rank,
        pieceId: pv?.pieceId ?? null,
        collectionId: piece?.collectionId,
        collectionRank: piece?.collectionRank,
      };
    });
  }

  const nextGraph = {
    source,
    collections,
    pieces,
    pieceVersions,
    movements,
    sections,
    tempoIndications,
    metronomeMarks,
    references,
    contributions,
    persons,
    organizations,
    sourceContents,
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
