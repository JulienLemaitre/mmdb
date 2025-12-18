import { useMemo } from "react";
import { expandRequiredChecklistItems } from "@/features/review/utils/expandRequiredChecklistItems";
import {
  ChecklistGraph,
  ExpandOptions,
  RequiredChecklistItem,
} from "@/types/reviewTypes";

export type CheckedKeySet = ReadonlySet<string> | Set<string>;
export type ProgressCounts = {
  required: number;
  checked: number;
};

export type OverviewProgress = {
  source: ProgressCounts;
  perCollection: Record<string, ProgressCounts>;
  perPiece: Record<string, ProgressCounts>;
};

// Helper to build a simple parent map to attribute checklist items to pieces/collections
function buildParentIndexes(graph: ChecklistGraph) {
  const pieceVersionToPiece: Record<string, string> = {};
  const movementToPieceVersion: Record<string, string> = {};
  const sectionToMovement: Record<string, string> = {};
  const mmToSection: Record<string, string> = {};

  for (const pv of graph.pieceVersions ?? []) {
    if (pv && pv.id && pv.pieceId) pieceVersionToPiece[pv.id] = pv.pieceId;

    for (const mvt of pv.movements ?? []) {
      if (mvt && mvt.id && pv.id) movementToPieceVersion[mvt.id] = pv.id;
      for (const sec of mvt.sections ?? []) {
        if (sec && sec.id && mvt.id) sectionToMovement[sec.id] = mvt.id;
      }
    }
  }

  for (const mm of graph.metronomeMarks ?? []) {
    if (mm && mm.id && mm.sectionId) mmToSection[mm.id] = mm.sectionId;
  }
  const pieceToCollection: Record<string, string | undefined> = {};
  for (const p of graph.pieces ?? []) {
    if (p && p.id && p.collectionId) pieceToCollection[p.id] = p.collectionId;
  }
  return {
    pieceVersionToPiece,
    movementToPieceVersion,
    sectionToMovement,
    mmToSection,
    pieceToCollection,
  };
}

function attributeItemToPieceId(
  item: RequiredChecklistItem,
  graph: ChecklistGraph,
  idx: ReturnType<typeof buildParentIndexes>,
): string | undefined {
  // Directly on PIECE
  if (item.entityType === "PIECE") return item.entityId ?? undefined;
  // From PIECE_VERSION
  if (item.entityType === "PIECE_VERSION" && item.entityId) {
    return idx.pieceVersionToPiece[item.entityId];
  }
  // From MOVEMENT -> PIECE_VERSION
  if (item.entityType === "MOVEMENT" && item.entityId) {
    const pvId = idx.movementToPieceVersion[item.entityId];
    return pvId ? idx.pieceVersionToPiece[pvId] : undefined;
  }
  // From SECTION -> MOVEMENT -> PIECE_VERSION
  if (item.entityType === "SECTION" && item.entityId) {
    const mvId = idx.sectionToMovement[item.entityId];
    const pvId = mvId ? idx.movementToPieceVersion[mvId] : undefined;
    return pvId ? idx.pieceVersionToPiece[pvId] : undefined;
  }
  // From METRONOME_MARK -> SECTION -> ...
  if (item.entityType === "METRONOME_MARK" && item.entityId) {
    const secId = idx.mmToSection[item.entityId];
    if (!secId) return undefined;
    const mvId = idx.sectionToMovement[secId];
    const pvId = mvId ? idx.movementToPieceVersion[mvId] : undefined;
    return pvId ? idx.pieceVersionToPiece[pvId] : undefined;
  }
  // TEMPO_INDICATION may be attached to SECTION via section.tempoIndicationId; we attribute by section if present in graph
  if (item.entityType === "TEMPO_INDICATION" && item.entityId) {
    let pieceId: string | undefined;

    for (const pv of graph.pieceVersions ?? []) {
      for (const mv of pv.movements ?? []) {
        for (const sec of mv.sections ?? []) {
          if (sec.tempoIndication?.id === item.entityId) {
            const mvId = idx.sectionToMovement[sec.id];
            const pvId = mvId ? idx.movementToPieceVersion[mvId] : undefined;
            pieceId = pvId ? idx.pieceVersionToPiece[pvId] : undefined;
            if (pieceId) return pieceId; // Early return once found
          }
        }
      }
    }
    return pieceId;
  }
  // REFERENCE or CONTRIBUTION or PERSON/ORGANIZATION are not attributed to a piece in this simple rollup; keep them at source-level
  return undefined;
}

/**
 * Compute overview progress with optional checked key set.
 * Single traversal; honors conditional required fields and globallyReviewed via options.
 */
export function computeOverviewProgress(
  graph: ChecklistGraph,
  options?: ExpandOptions,
  checkedKeys?: CheckedKeySet,
): OverviewProgress {
  const items = expandRequiredChecklistItems(graph, options);
  const idx = buildParentIndexes(graph);
  const checked = checkedKeys ?? new Set<string>();

  const perPiece: Record<string, ProgressCounts> = {};
  const perCollection: Record<string, ProgressCounts> = {};

  // Initialize from pieces/collections present in graph
  for (const p of graph.pieces ?? []) {
    perPiece[p.id] = { required: 0, checked: 0 };
    const colId = (p as any).collectionId as string | undefined;
    if (colId && !perCollection[colId])
      perCollection[colId] = { required: 0, checked: 0 };
  }
  for (const c of graph.collections ?? []) {
    if (!perCollection[c.id]) perCollection[c.id] = { required: 0, checked: 0 };
  }

  // Attribute items and tally
  let sourceChecked = 0;
  for (const item of items) {
    const key = item.fieldPath;
    const isChecked = checked.has(key);

    const pieceId = attributeItemToPieceId(item, graph, idx);
    if (pieceId) {
      const pp = (perPiece[pieceId] = perPiece[pieceId] || {
        required: 0,
        checked: 0,
      });
      pp.required += 1;
      if (isChecked) pp.checked += 1;
      const colId = idx.pieceToCollection[pieceId];
      if (colId) {
        const pc = (perCollection[colId] = perCollection[colId] || {
          required: 0,
          checked: 0,
        });
        pc.required += 1;
        if (isChecked) pc.checked += 1;
      }
    }
    // source-level always accumulates
    if (isChecked) sourceChecked += 1;
  }

  // Source required = total items
  const source: ProgressCounts = {
    required: items.length,
    checked: sourceChecked,
  };

  return { source, perCollection, perPiece };
}

/**
 * React hook wrapper that memoizes overview progress based on inputs.
 */
export function useOverviewProgress(
  graph: ChecklistGraph,
  checkedKeys?: CheckedKeySet,
  options?: ExpandOptions,
): OverviewProgress {
  // Note: callers should pass stable references or a primitive nonce for graph if needed
  return useMemo(
    () => computeOverviewProgress(graph, options, checkedKeys),
    [graph, options, checkedKeys],
  );
}
