import { ChecklistGraph, ChecklistEntityType } from "@/utils/ReviewChecklistSchema";
import { computeChangedChecklistFieldPaths } from "@/utils/reviewDiff";

export type AuditOperation = "CREATE" | "UPDATE" | "DELETE";

export type AuditEntityType =
  | "PERSON"
  | "ORGANIZATION"
  | "COLLECTION"
  | "PIECE"
  | "PIECE_VERSION"
  | "MOVEMENT"
  | "SECTION"
  | "TEMPO_INDICATION"
  | "METRONOME_MARK"
  | "MM_SOURCE"
  | "REFERENCE"
  | "CONTRIBUTION";

export type AuditEntry = {
  reviewId: string;
  entityType: AuditEntityType;
  entityId: string; // For source we still include source.id
  operation: AuditOperation;
  before: any | null;
  after: any | null;
  // authorId, comment are attached at write-time (server), omitted here for preview
};

// Map ChecklistEntityType (UI) to AuditEntityType (DB enum). They match names.
export function toAuditEntityType(t: ChecklistEntityType): AuditEntityType {
  return t as unknown as AuditEntityType;
}

// Helper to pick an entity slice from the graph lists
function findNode(list: any[] | undefined, id: string | null | undefined) {
  if (!list || !id) return null;
  return list.find((n) => n?.id === id) ?? null;
}

function buildSourceOrderingSnapshot(graph: ChecklistGraph) {
  return (graph.sourceContents ?? [])
    .slice()
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
    .map((row) => ({ pieceVersionId: row.pieceVersionId, rank: row.rank }));
}

/**
 * Compose audit entries for changed entities between baseline and working graphs.
 * Currently classifies all as UPDATE with full before/after snapshots for the entity.
 * For the source node, also embeds contentsOrder arrays in before/after for ordering traceability.
 */
export function composeAuditEntries(
  reviewId: string,
  baseline: ChecklistGraph,
  working: ChecklistGraph,
): AuditEntry[] {
  const changes = computeChangedChecklistFieldPaths(baseline, working);

  // Group by entityType + entityId (null -> use source.id)
  const key = (et: ChecklistEntityType, id?: string | null) => `${et}:${id ?? working.source?.id ?? "source"}`;
  const byKey: Record<string, { entityType: ChecklistEntityType; entityId: string | null }> = {};

  for (const c of changes) {
    const k = key(c.entityType, c.entityId ?? null);
    if (!byKey[k]) byKey[k] = { entityType: c.entityType, entityId: (c.entityId ?? null) };
  }

  const entries: AuditEntry[] = [];
  for (const { entityType, entityId } of Object.values(byKey)) {
    let before: any | null = null;
    let after: any | null = null;
    let resolvedId: string = entityId ?? working.source?.id ?? "unknown";

    switch (entityType) {
      case "MM_SOURCE": {
        before = { ...(baseline.source ?? {}) };
        after = { ...(working.source ?? {}) };
        // Attach ordering snapshots
        (before as any).contentsOrder = buildSourceOrderingSnapshot(baseline);
        (after as any).contentsOrder = buildSourceOrderingSnapshot(working);
        resolvedId = working.source?.id ?? baseline.source?.id ?? "source";
        break;
      }
      case "COLLECTION":
        before = findNode(baseline.collections, entityId);
        after = findNode(working.collections, entityId);
        break;
      case "PIECE":
        before = findNode(baseline.pieces, entityId);
        after = findNode(working.pieces, entityId);
        break;
      case "PIECE_VERSION":
        before = findNode(baseline.pieceVersions, entityId);
        after = findNode(working.pieceVersions, entityId);
        break;
      case "MOVEMENT":
        before = findNode(baseline.movements, entityId);
        after = findNode(working.movements, entityId);
        break;
      case "SECTION":
        before = findNode(baseline.sections, entityId);
        after = findNode(working.sections, entityId);
        break;
      case "TEMPO_INDICATION":
        before = findNode(baseline.tempoIndications, entityId);
        after = findNode(working.tempoIndications, entityId);
        break;
      case "METRONOME_MARK":
        before = findNode(baseline.metronomeMarks, entityId);
        after = findNode(working.metronomeMarks, entityId);
        break;
      case "REFERENCE":
        before = findNode(baseline.references, entityId);
        after = findNode(working.references, entityId);
        break;
      case "CONTRIBUTION":
        before = findNode(baseline.contributions, entityId);
        after = findNode(working.contributions, entityId);
        break;
      case "PERSON":
        before = findNode(baseline.persons, entityId);
        after = findNode(working.persons, entityId);
        break;
      case "ORGANIZATION":
        before = findNode(baseline.organizations, entityId);
        after = findNode(working.organizations, entityId);
        break;
      default:
        break;
    }

    // Minimal classification: if both exist, UPDATE; if before null and after exists, CREATE; if after null and before exists, DELETE
    let operation: AuditOperation = "UPDATE";
    if (before == null && after != null) operation = "CREATE";
    else if (after == null && before != null) operation = "DELETE";

    entries.push({
      reviewId,
      entityType: toAuditEntityType(entityType),
      entityId: String(resolvedId),
      operation,
      before,
      after,
    });
  }

  return entries;
}
