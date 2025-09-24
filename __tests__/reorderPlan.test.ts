import { applyRankUpdates, planReorderRanks } from '@/utils/reorderPlan'

function ranksAreUnique(rows: Array<{ joinId: string; rank: number }>): boolean {
  const set = new Set(rows.map((r) => r.rank))
  return set.size === rows.length
}

describe('planReorderRanks (collision-safe)', () => {
  it('produces an offset then normalize plan that avoids unique collisions and yields final contiguous ranks', () => {
    const current = [
      { joinId: 'join-1', rank: 1 },
      { joinId: 'join-2', rank: 2 },
      { joinId: 'join-3', rank: 3 },
    ]
    const desiredOrder = ['join-2', 'join-3', 'join-1']

    const plan = planReorderRanks(current, desiredOrder)
    const maxRank = Math.max(...current.map((r) => r.rank))
    expect(plan.offset).toBeGreaterThan(maxRank)

    // Apply offset step
    const afterOffset = applyRankUpdates(current, plan.offsetUpdates)
    expect(ranksAreUnique(afterOffset)).toBe(true)
    // All ranks moved above offset threshold
    for (const r of afterOffset) {
      expect(r.rank).toBeGreaterThan(plan.offset - 1)
    }

    // Apply normalize step
    const finalRows = applyRankUpdates(afterOffset, plan.normalizeUpdates)

    // Final ranks must be 1..n following desiredOrder
    const byId: Record<string, number> = Object.fromEntries(finalRows.map((r) => [r.joinId, r.rank]))
    expect(byId['join-2']).toBe(1)
    expect(byId['join-3']).toBe(2)
    expect(byId['join-1']).toBe(3)
    expect(ranksAreUnique(finalRows)).toBe(true)
  })

  it('throws when desiredOrder does not match the set of current joinIds', () => {
    const current = [
      { joinId: 'join-1', rank: 1 },
      { joinId: 'join-2', rank: 2 },
    ]
    expect(() => planReorderRanks(current, ['join-2'])).toThrow(/desiredOrder/)
    expect(() => planReorderRanks(current, ['join-2', 'join-3'])).toThrow(/missing/i)
  })
})
