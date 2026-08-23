import { computeChangedFieldPaths } from "@/features/review/reviewDiff";
import {
  AuditEntityType,
  AuditEntry,
  AuditOperation,
  ReviewEntityType,
} from "@/types/reviewTypes";
import { FeedFormState } from "@/types/feedFormTypes";

export function toAuditEntityType(
  t: ReviewEntityType | AuditEntityType,
): AuditEntityType {
  if (t === "MM_SOURCE_ON_PIECE_VERSION") {
    return "MM_SOURCE";
  }
  return t as AuditEntityType;
}

/**
 * Finds a specific node within a FeedFormState by its entity type and ID.
 *
 * @param state The FeedFormState to search within.
 * @param entityType The type of the entity to find.
 * @param entityId The ID of the entity to find.
 * @returns The found entity node, or null if not found.
 */
export function findNodeInState(
  state: FeedFormState | null | undefined,
  entityType: ReviewEntityType | AuditEntityType,
  entityId: string,
): any | null {
  if (!state) return null;

  switch (entityType) {
    case "MM_SOURCE":
    case "MM_SOURCE_ON_PIECE_VERSION": {
      const src = state.mMSourceDescription;
      if (!src) return null;
      if (src.id === entityId || !entityId || entityId === "unknown_source") {
        return src;
      }
      return src.id ? (src.id === entityId ? src : null) : src;
    }
    case "PERSON":
      return state.persons?.find((n) => n.id === entityId) ?? null;
    case "ORGANIZATION":
      return state.organizations?.find((n) => n.id === entityId) ?? null;
    case "COLLECTION":
      return state.collections?.find((n) => n.id === entityId) ?? null;
    case "PIECE":
      return state.pieces?.find((n) => n.id === entityId) ?? null;
    case "PIECE_VERSION":
      return state.pieceVersions?.find((n) => n.id === entityId) ?? null;
    case "MOVEMENT": {
      for (const pv of state.pieceVersions ?? []) {
        const mov = pv.movements?.find((m) => m.id === entityId);
        if (mov) return mov;
      }
      return null;
    }
    case "SECTION": {
      for (const pv of state.pieceVersions ?? []) {
        for (const mov of pv.movements ?? []) {
          const sec = mov.sections?.find((s) => s.id === entityId);
          if (sec) return sec;
        }
      }
      return null;
    }
    case "TEMPO_INDICATION":
      return state.tempoIndications?.find((n) => n.id === entityId) ?? null;
    case "METRONOME_MARK":
      return state.metronomeMarks?.find((n) => n.id === entityId) ?? null;
    case "REFERENCE":
      return (
        state.mMSourceDescription?.references?.find((n) => n.id === entityId) ??
        null
      );
    case "CONTRIBUTION":
      return (
        state.mMSourceContributions?.find((n) => n.id === entityId) ?? null
      );
    default:
      return null;
  }
}

export function buildSourceOrderingSnapshot(
  state: FeedFormState | null | undefined,
) {
  return (state?.mMSourceOnPieceVersions ?? [])
    .slice()
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
    .map((row) => ({ pieceVersionId: row.pieceVersionId, rank: row.rank }));
}

/**
 * Composes a list of audit entries by comparing a baseline and working FeedFormState.
 * It computes changed fields, groups them by entity, checks for protected entity deletions,
 * and attaches full before/after snapshots (including contentsOrder for MM_SOURCE).
 */
export function composeAuditEntries(
  reviewId: string,
  baseline: any,
  working: any,
  protectedEntityIds?: Set<string>,
): AuditEntry[] {
  const changes = computeChangedFieldPaths(baseline, working);

  const key = (et: ReviewEntityType, id?: string | null) =>
    `${et}:${id ?? "MM_SOURCE"}`;
  const changedEntities = new Map<
    string,
    { entityType: ReviewEntityType; entityId: string | null }
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
      entityId ??
      baseline.mMSourceDescription?.id ??
      working.mMSourceDescription?.id ??
      "unknown_source";
    if (resolvedId === "unknown_source") continue;

    const before = findNodeInState(baseline, entityType, resolvedId);
    const after = findNodeInState(working, entityType, resolvedId);

    let operation: AuditOperation = "UPDATE";
    if (before == null && after != null) operation = "CREATE";
    else if (after == null && before != null) operation = "DELETE";

    // Discard DELETE entries for protected entities (e.g. forked originals)
    if (operation === "DELETE" && protectedEntityIds?.has(resolvedId)) {
      continue;
    }

    let beforeSnap = before;
    let afterSnap = after;

    // For source, add contentsOrder snapshot for auditing
    if (
      entityType === "MM_SOURCE" ||
      entityType === "MM_SOURCE_ON_PIECE_VERSION"
    ) {
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
