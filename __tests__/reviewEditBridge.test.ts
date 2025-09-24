import { describe, it, expect, beforeEach } from '@jest/globals'
import {
  resolveStepForFieldPath,
  writeBootStateForFeedForm,
  consumeBootStateForFeedForm,
  buildFeedFormStateFromWorkingCopy,
  rebuildWorkingCopyFromFeedForm,
  type ReviewWorkingCopy,
} from '@/utils/reviewEditBridge'

// jsdom provides localStorage

describe('reviewEditBridge utilities', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('resolveStepForFieldPath maps by root entity token', () => {
    expect(resolveStepForFieldPath('MM_SOURCE.title')).toBeGreaterThanOrEqual(0)
    expect(resolveStepForFieldPath('PIECE_VERSION:pv123.something')).toBe(2)
    expect(resolveStepForFieldPath('MOVEMENT:mv1.rank')).toBe(2)
    expect(resolveStepForFieldPath('SECTION:sec1.metreNumerator')).toBe(2)
    expect(resolveStepForFieldPath('METRONOME_MARK:mm1.bpm')).toBe(3)
    expect(resolveStepForFieldPath('REFERENCE:ref1.type')).toBe(1)
    expect(resolveStepForFieldPath('UNKNOWN:foo')).toBe(0)
  })

  it('writeBootStateForFeedForm and consumeBootStateForFeedForm round-trip via localStorage', () => {
    const payload = { formInfo: { currentStepRank: 2, reviewContext: { reviewId: 'r1', reviewEdit: true, updatedAt: new Date().toISOString() } } }
    writeBootStateForFeedForm(payload as any)
    const consumed = consumeBootStateForFeedForm()
    expect(consumed?.formInfo?.currentStepRank).toBe(2)
    expect(consumed?.formInfo?.reviewContext?.reviewId).toBe('r1')
    // After consume, key must be removed
    expect(localStorage.length).toBe(0)
  })

  it('buildFeedFormStateFromWorkingCopy sets reviewContext and step based on fieldPath', () => {
    const wc: ReviewWorkingCopy = { graph: { source: { id: 's1' } }, updatedAt: new Date().toISOString() }
    const state = buildFeedFormStateFromWorkingCopy(wc, 'MOVEMENT:mv1.rank', {
      reviewId: 'revA',
      sliceKey: 'MOVEMENT:mv1.rank',
    })
    expect(state.formInfo?.currentStepRank).toBe(2)
    expect(state.formInfo?.reviewContext?.reviewId).toBe('revA')
    expect(state.formInfo?.reviewContext?.reviewEdit).toBe(true)
  })

  it('rebuildWorkingCopyFromFeedForm returns previous graph and updates timestamp (stub behavior)', () => {
    const prev: ReviewWorkingCopy = { graph: { foo: 'bar' }, updatedAt: '2000-01-01T00:00:00.000Z' }
    const feedState: any = { formInfo: { currentStepRank: 0 } }
    const next = rebuildWorkingCopyFromFeedForm(feedState, prev)
    expect(next.graph).toBe(prev.graph)
    expect(new Date(next.updatedAt).getTime()).toBeGreaterThan(new Date(prev.updatedAt).getTime())
  })
})
