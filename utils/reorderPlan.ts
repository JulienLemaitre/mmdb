export type JoinRow = { joinId: string; rank: number };

export type ReorderPlan = {
  offset: number;
  // First apply these updates (e.g., in one transaction) to move ranks out of the way
  offsetUpdates: Array<{ joinId: string; rank: number }>;
  // Then normalize to the final contiguous ranks following desiredOrder
  normalizeUpdates: Array<{ joinId: string; rank: number }>;
};

/**
 * Plan a collision-safe two‑phase rank update for a set of join rows belonging to the same source.
 * Strategy: add a large OFFSET to all current ranks (keeps uniqueness because current ranks are unique),
 * then assign final ranks 1..n following desiredOrder.
 *
 * Throws if desiredOrder doesn't match the set of joinIds.
 */
export function planReorderRanks(current: JoinRow[], desiredOrder: string[]): ReorderPlan {
  const currentIds = new Set(current.map((r) => String(r.joinId)));
  const desiredIds = new Set(desiredOrder.map((id) => String(id)));
  if (currentIds.size !== desiredIds.size) {
    throw new Error("[planReorderRanks] desiredOrder must contain exactly all joinIds");
  }
  for (const id of currentIds) {
    if (!desiredIds.has(id)) {
      throw new Error("[planReorderRanks] desiredOrder is missing a joinId: " + id);
    }
  }

  const maxRank = current.reduce((m, r) => Math.max(m, r.rank ?? 0), 0);
  // Pick a deterministic large offset above current ranks
  const offset = Math.max(1000, maxRank + 1000);

  const offsetUpdates = current.map((r) => ({ joinId: r.joinId, rank: (r.rank ?? 0) + offset }));
  const normalizeUpdates = desiredOrder.map((id, idx) => ({ joinId: id, rank: idx + 1 }));

  return { offset, offsetUpdates, normalizeUpdates };
}

/**
 * Helper used in tests: apply a set of updates to a copy of the rows and return the new array.
 */
export function applyRankUpdates(rows: JoinRow[], updates: Array<{ joinId: string; rank: number }>): JoinRow[] {
  const byId = new Map<string, JoinRow>(rows.map((r) => [String(r.joinId), { ...r }]));
  for (const u of updates) {
    const id = String(u.joinId);
    const r = byId.get(id);
    if (!r) continue;
    byId.set(id, { ...r, rank: u.rank });
  }
  return Array.from(byId.values());
}
