import { describe, it, expect, beforeEach } from "@jest/globals";
import { buildMockOverview } from "@/features/review/reviewMock";
import type { FeedFormState } from "@/types/feedFormTypes";
import {
  rebuildWorkingCopyFromFeedForm,
  type ReviewWorkingCopy,
} from "@/features/review/reviewEditBridge";
import { computeChangedChecklistFieldPaths } from "@/features/review/reviewDiff";
import { buildFieldPath } from "@/features/review/reviewChecklistSchema";

function toChangedKeySet(
  changes: Array<{
    entityType: string;
    entityId?: string | null;
    fieldPath: string;
  }>,
) {
  return new Set(changes.map((c) => c.fieldPath));
}

describe("Inverse bridge mapping: FeedFormState -> WorkingCopy graph", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("maps Piece/Movement/Section/MM edits back into the working copy and diff detects changes", () => {
    const { graph } = buildMockOverview("rev-rr-1");

    // Baseline ids
    const pieceId = graph.pieces![0]!.id;
    const pieceVersion = graph.pieceVersions!.find(
      (pv) => pv.pieceId === pieceId,
    )!;
    const pvId = pieceVersion.id;
    const movement = (pieceVersion as any).movements[0]!;
    const movementId = movement.id;
    const section = (movement as any).sections[0]!;
    const sectionId = section.id;
    const mm = graph.metronomeMarks!.find((m) => m.sectionId === sectionId)!;
    const mmId = mm.id;
    const ti = graph.tempoIndications!.find(
      (t) => t.id === section.tempoIndication.id,
    )!;

    // Craft a feed form state reflecting the baseline graph, with edits
    const feedState: FeedFormState = {
      formInfo: {
        currentStepRank: 0,
        introDone: true,
        reviewContext: {
          reviewId: "rev-rr-1", // Using the same reviewId as in buildMockOverview
          reviewEdit: true,
          updatedAt: new Date().toISOString(),
        },
      },
      // Minimal source description slice
      mMSourceDescription: {
        id: graph.source.id,
        title: graph.source.title,
        type: graph.source.type,
        link: graph.source.link,
        year: graph.source.year,
        isYearEstimated: graph.source.isYearEstimated,
        comment: graph.source.comment,
        references: (graph.source.references ?? []).map((r) => ({
          id: r.id,
          type: r.type,
          reference: r.reference,
        })),
        pieceVersions: graph.pieceVersions?.map((pv) => ({ id: pv.id })),
      },
      collections: (graph.collections ?? []).map((c) => ({
        id: c.id,
        title: c.title,
        composerId: c.composerId,
        pieceCount: c.pieceCount,
      })),
      pieces: (graph.pieces ?? []).map((p) => ({
        id: p.id,
        title: p.id === pieceId ? "Changed Title" : p.title, // EDIT: change this piece title
        nickname: p.nickname ?? null,
        composerId: p.composerId ?? null,
        yearOfComposition: p.yearOfComposition ?? null,
        collectionId: p.collectionId ?? null,
        collectionRank: p.collectionRank ?? null,
      })),
      pieceVersions: (graph.pieceVersions ?? []).map((pv) => ({
        id: pv.id,
        category: pv.category,
        pieceId: pv.pieceId!,
        movements: ((pv as any).movements ?? []).map((mv: any) => ({
          id: mv.id,
          rank: mv.rank,
          key: mv.id === movementId ? "G major" : mv.key, // EDIT: change movement key
          sections: ((mv as any).sections ?? []).map((s: any) => ({
            id: s.id,
            movementId: mv.id,
            rank: s.rank,
            metreNumerator: s.metreNumerator,
            metreDenominator:
              s.id === sectionId ? s.metreDenominator + 1 : s.metreDenominator, // EDIT: change metre denominator
            isCommonTime: s.isCommonTime,
            isCutTime: s.isCutTime,
            fastestStructuralNotesPerBar: s.fastestStructuralNotesPerBar,
            fastestStaccatoNotesPerBar: s.fastestStaccatoNotesPerBar ?? null,
            fastestRepeatedNotesPerBar: s.fastestRepeatedNotesPerBar ?? null,
            fastestOrnamentalNotesPerBar:
              s.fastestOrnamentalNotesPerBar ?? null,
            isFastestStructuralNoteBelCanto:
              s.isFastestStructuralNoteBelCanto ?? false,
            tempoIndication: {
              id: ti.id,
              text: ti.text, // unchanged
            },
            comment: s.comment ?? "",
            commentForReview: s.commentForReview ?? "",
          })),
        })),
      })),
      // Ordering slice for source contents
      mMSourceOnPieceVersions: (graph.sourceOnPieceVersions ?? []).map((j) => ({
        rank: j.rank,
        pieceVersionId: j.pieceVersionId,
      })),
      // Metronome marks slice with one edited bpm
      metronomeMarks: (graph.metronomeMarks ?? []).map((x) => {
        if (x.noMM) {
          return {
            id: x.id,
            sectionId: x.sectionId,
            pieceVersionId: x.pieceVersionId,
            noMM: true,
          };
        }
        return {
          id: x.id,
          sectionId: x.sectionId,
          beatUnit: x.beatUnit,
          bpm: x.id === mmId ? x.bpm + 5 : x.bpm, // EDIT: change bpm
          comment: x.comment ?? "",
          pieceVersionId: x.pieceVersionId,
          noMM: false,
        };
      }),
      persons: graph.persons as any,
      organizations: graph.organizations as any,
      tempoIndications: graph.tempoIndications as any,
    };

    const prev: ReviewWorkingCopy = {
      graph,
      updatedAt: new Date().toISOString(),
    };

    const next = rebuildWorkingCopyFromFeedForm(feedState, prev);

    // Assert new values are present in the rebuilt graph
    const nextPiece = next.graph.pieces!.find((p) => p.id === pieceId)!;
    expect(nextPiece.title).toBe("Changed Title");

    const nextPieceVersion = next.graph.pieceVersions!.find(
      (pv) => pv.id === pvId,
    )!;
    const nextMovement = (nextPieceVersion as any).movements.find(
      (m: any) => m.id === movementId,
    )!;
    expect(nextMovement.key).toBe("G major");

    const nextSection = (nextMovement as any).sections.find(
      (s: any) => s.id === sectionId,
    )!;
    expect(nextSection.metreDenominator).toBe(section.metreDenominator + 1);

    const nextMM = next.graph.metronomeMarks!.find((m) => m.id === mmId)!;
    if (mm.noMM || nextMM.noMM) {
      throw new Error("Metronome marks should have values for this test");
    }
    expect(nextMM.bpm).toBe(mm.bpm + 5);

    // Diff vs baseline should include the changed field paths
    const changes = computeChangedChecklistFieldPaths(
      graph as any,
      next.graph as any,
    );
    const changed = toChangedKeySet(changes);

    expect(changed.has(buildFieldPath("PIECE", pieceId, "title"))).toBe(true);
    expect(changed.has(buildFieldPath("MOVEMENT", movementId, "key"))).toBe(
      true,
    );
    expect(
      changed.has(buildFieldPath("SECTION", sectionId, "metreDenominator")),
    ).toBe(true);
    expect(changed.has(buildFieldPath("METRONOME_MARK", mmId, "bpm"))).toBe(
      true,
    );
  });
});
