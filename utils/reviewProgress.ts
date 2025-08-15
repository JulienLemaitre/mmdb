import { ChecklistGraph, RequiredChecklistItem, expandRequiredChecklistItems } from "@/utils/ReviewChecklistSchema";

export type ProgressCounts = {
  required: number;
  checked: number; // skeleton: 0 for now
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
  }
  for (const mv of graph.movements ?? []) {
    if (mv && mv.id && mv.pieceVersionId) movementToPieceVersion[mv.id] = mv.pieceVersionId;
  }
  for (const sec of graph.sections ?? []) {
    if (sec && sec.id && sec.movementId) sectionToMovement[sec.id] = sec.movementId;
  }
  for (const mm of graph.metronomeMarks ?? []) {
    if (mm && mm.id && mm.sectionId) mmToSection[mm.id] = mm.sectionId;
  }
  const pieceToCollection: Record<string, string | undefined> = {};
  for (const p of graph.pieces ?? []) {
    if (p && p.id) pieceToCollection[p.id] = p.collectionId;
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
    const section = (graph.sections ?? []).find((s) => s.tempoIndicationId === item.entityId);
    if (section) {
      const mvId = idx.sectionToMovement[section.id];
      const pvId = mvId ? idx.movementToPieceVersion[mvId] : undefined;
      return pvId ? idx.pieceVersionToPiece[pvId] : undefined;
    }
  }
  // REFERENCE or CONTRIBUTION or PERSON/ORGANIZATION are not attributed to a piece in this simple rollup; keep them at source-level
  return undefined;
}

export function computeOverviewProgress(graph: ChecklistGraph): OverviewProgress {
  const items = expandRequiredChecklistItems(graph);
  const idx = buildParentIndexes(graph);

  const perPiece: Record<string, ProgressCounts> = {};
  const perCollection: Record<string, ProgressCounts> = {};

  // Initialize from pieces/collections present in graph
  for (const p of graph.pieces ?? []) {
    perPiece[p.id] = { required: 0, checked: 0 };
    const colId = p.collectionId as string | undefined;
    if (colId && !perCollection[colId]) perCollection[colId] = { required: 0, checked: 0 };
  }
  for (const c of graph.collections ?? []) {
    if (!perCollection[c.id]) perCollection[c.id] = { required: 0, checked: 0 };
  }

  // Attribute items
  for (const item of items) {
    const pieceId = attributeItemToPieceId(item, graph, idx);
    if (pieceId) {
      perPiece[pieceId] = perPiece[pieceId] || { required: 0, checked: 0 };
      perPiece[pieceId].required += 1;
      const colId = idx.pieceToCollection[pieceId];
      if (colId) {
        perCollection[colId] = perCollection[colId] || { required: 0, checked: 0 };
        perCollection[colId].required += 1;
      }
      continue;
    }
    // Otherwise, treat as source-level requirement
  }

  // Source required = total items
  const source: ProgressCounts = { required: items.length, checked: 0 };

  return { source, perCollection, perPiece };
}
