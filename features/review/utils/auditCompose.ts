import { ENTITY_PREFIX } from "@/features/review/reviewChecklistSchema";
import { computeChangedChecklistFieldPaths } from "@/features/review/reviewDiff";
import {
  AuditEntityType,
  AuditEntry,
  AuditOperation,
  ChecklistEntityType,
  ChecklistGraph,
} from "@/types/reviewTypes";

export function toAuditEntityType(t: ChecklistEntityType): AuditEntityType {
  return t as unknown as AuditEntityType;
}

/**
 * JSDoc: Finds a specific node within a ChecklistGraph by its type and ID.
 * This helper function is essential for diffing and auditing, as it can
 * locate entities regardless of whether they are in a top-level array
 * (e.g., `graph.pieces`) or deeply nested (e.g., a `SECTION` within a `MOVEMENT`).
 *
 * @param graph The ChecklistGraph to search within.
 * @param entityType The type of the entity to find.
 * @param entityId The ID of the entity to find.
 * @returns The found entity node, or null if not found.
 */
function findNodeInGraph(
  graph: ChecklistGraph,
  entityType: ChecklistEntityType,
  entityId: string,
): any | null {
  if (entityType === "MM_SOURCE") {
    return graph.source;
  }

  const topLevelProps: (keyof ChecklistGraph)[] = [
    "persons",
    "organizations",
    "collections",
    "pieces",
    "tempoIndications",
    "metronomeMarks",
    "contributions",
  ];
  if (graph.source?.references) {
    topLevelProps.push("references" as any);
  }

  for (const prop of topLevelProps) {
    if (prop.startsWith(ENTITY_PREFIX[entityType])) {
      const list = (graph as any)[prop] ?? (graph.source as any)?.[prop];
      const node = list?.find((n: any) => n.id === entityId);
      if (node) return node;
    }
  }

  // Traverse nested structures for piece-related entities
  for (const pv of graph.pieceVersions ?? []) {
    if (entityType === "PIECE_VERSION" && pv.id === entityId) return pv;
    for (const mov of (pv as any).movements ?? []) {
      if (entityType === "MOVEMENT" && mov.id === entityId) return mov;
      for (const sec of (mov as any).sections ?? []) {
        if (entityType === "SECTION" && sec.id === entityId) return sec;
      }
    }
  }

  return null;
}

function buildSourceOrderingSnapshot(graph: ChecklistGraph) {
  return (graph.sourceOnPieceVersions ?? [])
    .slice()
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
    .map((row) => ({ pieceVersionId: row.pieceVersionId, rank: row.rank }));
}

/**
 * JSDoc: Composes a list of audit entries by comparing a baseline and working graph.
 * It first computes the set of changed fields, then groups those changes by
 * entity. For each changed entity, it retrieves the full "before" and "after"
 * snapshots by traversing the graphs and records the change as a CREATE,
 * UPDATE, or DELETE operation.
 */
export function composeAuditEntries(
  reviewId: string,
  baseline: ChecklistGraph,
  working: ChecklistGraph,
): AuditEntry[] {
  const changes = computeChangedChecklistFieldPaths(baseline, working);

  const key = (et: ChecklistEntityType, id?: string | null) =>
    `${et}:${id ?? "MM_SOURCE"}`;
  const changedEntities = new Map<
    string,
    { entityType: ChecklistEntityType; entityId: string | null }
  >();

  for (const c of changes) {
    const entityKey = key(c.entityType, c.entityId);
    if (!changedEntities.has(entityKey)) {
      changedEntities.set(entityKey, {
        entityType: c.entityType,
        entityId: c.entityId ?? null,
      });
    }
  }

  const entries: AuditEntry[] = [];
  for (const { entityType, entityId } of changedEntities.values()) {
    const resolvedId =
      entityId ?? baseline.source?.id ?? working.source?.id ?? "unknown_source";
    if (resolvedId === "unknown_source") continue;

    const before = findNodeInGraph(baseline, entityType, resolvedId);
    const after = findNodeInGraph(working, entityType, resolvedId);

    let operation: AuditOperation = "UPDATE";
    if (before == null && after != null) operation = "CREATE";
    else if (after == null && before != null) operation = "DELETE";

    let beforeSnap = before;
    let afterSnap = after;

    // For source, add the ordering as a special field for auditing
    if (entityType === "MM_SOURCE") {
      beforeSnap = {
        ...(before ?? {}),
        contentsOrder: buildSourceOrderingSnapshot(baseline),
      };
      afterSnap = {
        ...(after ?? {}),
        contentsOrder: buildSourceOrderingSnapshot(working),
      };
    }

    entries.push({
      reviewId,
      entityType: toAuditEntityType(entityType),
      entityId: resolvedId,
      operation,
      before: beforeSnap,
      after: afterSnap,
    });
  }

  return entries;
}
