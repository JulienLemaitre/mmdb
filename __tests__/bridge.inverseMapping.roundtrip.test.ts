import { describe, it, expect, beforeEach } from '@jest/globals'
import { buildMockOverview } from '@/utils/reviewMock'
import type { FeedFormState } from '@/types/feedFormTypes'
import { rebuildWorkingCopyFromFeedForm, type ReviewWorkingCopy } from '@/utils/reviewEditBridge'
import { computeChangedChecklistFieldPaths } from '@/utils/reviewDiff'
import { buildFieldPath } from '@/utils/ReviewChecklistSchema'

function toChangedKeySet(changes: Array<{ entityType: string; entityId?: string | null; fieldPath: string }>) {
  return new Set(changes.map(c => `${c.entityType}:${c.entityId ?? ''}:${c.fieldPath}`))
}

describe('Inverse bridge mapping: FeedFormState -> WorkingCopy graph', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('maps Piece/Movement/Section/MM edits back into the working copy and diff detects changes', () => {
    const { graph } = buildMockOverview('rev-rr-1')

    // Baseline ids
    const pieceId = graph.pieces![0]!.id
    const pvId = graph.pieceVersions!.find(pv => pv.pieceId === pieceId)!.id
    const movement = graph.movements!.find(m => m.pieceVersionId === pvId)!
    const movementId = movement.id
    const section = graph.sections!.find(s => s.movementId === movementId)!
    const sectionId = section.id
    const mm = graph.metronomeMarks!.find(m => m.sectionId === sectionId)!
    const mmId = mm.id
    const ti = graph.tempoIndications!.find(t => t.id === section.tempoIndicationId)!

    // Craft a feed form state reflecting the baseline graph, with edits
    const feedState: FeedFormState = {
      formInfo: { currentStepRank: 0, introDone: true },
      // Minimal source description slice
      mMSourceDescription: {
        id: graph.source.id,
        title: graph.source.title,
        type: graph.source.type,
        link: graph.source.link,
        year: graph.source.year,
        comment: graph.source.comment,
        references: (graph.references ?? []).map(r => ({ type: r.type, reference: r.reference })),
        pieceVersions: graph.pieceVersions?.map(pv => ({ id: pv.id })),
      },
      collections: (graph.collections ?? []).map(c => ({ id: c.id, title: c.title, composerId: c.composerId })),
      pieces: (graph.pieces ?? []).map(p => ({
        id: p.id,
        title: p.id === pieceId ? 'Changed Title' : p.title, // EDIT: change this piece title
        nickname: p.nickname ?? null,
        composerId: p.composerId ?? null,
        yearOfComposition: p.yearOfComposition ?? null,
        collectionId: p.collectionId ?? null,
        collectionRank: p.collectionRank ?? null,
      })),
      pieceVersions: (graph.pieceVersions ?? []).map(pv => ({
        id: pv.id,
        category: pv.category,
        pieceId: pv.pieceId!,
        movements: (graph.movements ?? [])
          .filter(m => m.pieceVersionId === pv.id)
          .map(mv => ({
            id: mv.id,
            rank: mv.rank,
            key: mv.id === movementId ? 'G major' : mv.key, // EDIT: change movement key
            sections: (graph.sections ?? [])
              .filter(s => s.movementId === mv.id)
              .map(s => ({
                id: s.id,
                movementId: mv.id,
                rank: s.rank,
                metreNumerator: s.metreNumerator,
                metreDenominator: s.id === sectionId ? (s.metreDenominator + 1) : s.metreDenominator, // EDIT: change metre denominator
                isCommonTime: s.isCommonTime,
                isCutTime: s.isCutTime,
                fastestStructuralNotesPerBar: s.fastestStructuralNotesPerBar,
                fastestStaccatoNotesPerBar: s.fastestStaccatoNotesPerBar ?? null,
                fastestRepeatedNotesPerBar: s.fastestRepeatedNotesPerBar ?? null,
                fastestOrnamentalNotesPerBar: s.fastestOrnamentalNotesPerBar ?? null,
                isFastestStructuralNoteBelCanto: s.isFastestStructuralNoteBelCanto ?? false,
                tempoIndication: {
                  id: s.tempoIndicationId,
                  text: ti.text, // unchanged
                },
                comment: s.comment ?? '',
                commentForReview: s.commentForReview ?? '',
              })),
          })),
      })),
      // Ordering slice for source contents
      mMSourcePieceVersions: (graph.sourceContents ?? []).map(j => ({ rank: j.rank, pieceVersionId: j.pieceVersionId })),
      // Metronome marks slice with one edited bpm
      metronomeMarks: (graph.metronomeMarks ?? []).map(x => ({
        id: x.id,
        sectionId: x.sectionId,
        beatUnit: x.beatUnit,
        bpm: x.id === mmId ? (x.bpm + 5) : x.bpm, // EDIT: change bpm
        comment: x.comment ?? '',
        pieceVersionId: pvId,
        pieceVersionRank: (graph.sourceContents ?? []).find(j => j.pieceVersionId === pvId)?.rank ?? 1,
        noMM: false,
      })),
      persons: graph.persons as any,
      organizations: graph.organizations as any,
      tempoIndications: graph.tempoIndications as any,
    }

    const prev: ReviewWorkingCopy = { graph, updatedAt: new Date().toISOString() }

    const next = rebuildWorkingCopyFromFeedForm(feedState, prev)

    // Assert new values are present in the rebuilt graph
    const nextPiece = next.graph.pieces!.find(p => p.id === pieceId)!
    expect(nextPiece.title).toBe('Changed Title')

    const nextMovement = next.graph.movements!.find(m => m.id === movementId)!
    expect(nextMovement.key).toBe('G major')

    const nextSection = next.graph.sections!.find(s => s.id === sectionId)!
    expect(nextSection.metreDenominator).toBe(section.metreDenominator + 1)

    const nextMM = next.graph.metronomeMarks!.find(m => m.id === mmId)!
    expect(nextMM.bpm).toBe(mm.bpm + 5)

    // Diff vs baseline should include the changed field paths
    const changes = computeChangedChecklistFieldPaths(graph as any, next.graph as any)
    const changed = toChangedKeySet(changes)

    expect(changed.has(`PIECE:${pieceId}:${buildFieldPath('PIECE', pieceId, 'title')}`)).toBe(true)
    expect(changed.has(`MOVEMENT:${movementId}:${buildFieldPath('MOVEMENT', movementId, 'key')}`)).toBe(true)
    expect(changed.has(`SECTION:${sectionId}:${buildFieldPath('SECTION', sectionId, 'metreDenominator')}`)).toBe(true)
    expect(changed.has(`METRONOME_MARK:${mmId}:${buildFieldPath('METRONOME_MARK', mmId, 'bpm')}`)).toBe(true)
  })
})
