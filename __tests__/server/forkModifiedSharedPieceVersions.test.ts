import {
  forkModifiedSharedPieceVersions,
  isPieceVersionModified,
  PrismaTx,
} from "@/utils/server/forkModifiedSharedPieceVersions";
import { FeedFormState } from "@/types/feedFormTypes";
import {
  KEY,
  NOTE_VALUE,
  PIECE_CATEGORY,
  REFERENCE_TYPE,
  SOURCE_TYPE,
} from "@/prisma/client/enums";
import { prodLog } from "@/utils/debugLogger";

describe("forkModifiedSharedPieceVersions", () => {
  let infoSpy: jest.SpyInstance;

  beforeEach(() => {
    infoSpy = jest.spyOn(prodLog, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    infoSpy.mockRestore();
  });

  function buildBaselineState(): FeedFormState {
    return {
      mMSourceDescription: {
        id: "source-1",
        title: "Original Source Title",
        type: SOURCE_TYPE.EDITION,
        link: "https://imslp.org/test",
        permalink: "https://imslp.org/test-perma",
        year: 1801,
        isYearEstimated: false,
        comment: null,
        references: [
          {
            id: "ref-1",
            type: REFERENCE_TYPE.ISBN,
            reference: "978-0-123456-47-2",
          },
        ],
        pieceVersions: [{ id: "pv-1" }],
      },
      mMSourceContributions: [],
      organizations: [],
      persons: [],
      collections: [],
      pieces: [
        {
          id: "piece-1",
          title: "Piano Sonata No. 1",
          nickname: null,
          composerId: "person-1",
          yearOfComposition: 1795,
          collectionId: null,
          collectionRank: null,
        },
      ],
      tempoIndications: [
        {
          id: "ti-1",
          text: "Allegro",
        },
        {
          id: "ti-2",
          text: "Adagio",
        },
      ],
      pieceVersions: [
        {
          id: "pv-1",
          pieceId: "piece-1",
          category: PIECE_CATEGORY.KEYBOARD,
          movements: [
            {
              id: "mov-1",
              rank: 1,
              key: KEY.F_MINOR,
              isVariation: false,
              sections: [
                {
                  id: "sec-1",
                  rank: 1,
                  tempoIndicationId: "ti-1",
                  metreNumerator: 2,
                  metreDenominator: 2,
                  isCommonTime: false,
                  isCutTime: true,
                  fastestStructuralNotesPerBar: 8,
                  fastestBelCantoNotesPerBar: null,
                  fastestStaccatoNotesPerBar: null,
                  fastestRepeatedNotesPerBar: null,
                  fastestOrnamentalNotesPerBar: null,
                  comment: null,
                  commentForReview: null,
                },
                {
                  id: "sec-2",
                  rank: 2,
                  tempoIndicationId: "ti-2",
                  metreNumerator: 3,
                  metreDenominator: 4,
                  isCommonTime: false,
                  isCutTime: false,
                  fastestStructuralNotesPerBar: 6,
                  fastestBelCantoNotesPerBar: null,
                  fastestStaccatoNotesPerBar: null,
                  fastestRepeatedNotesPerBar: null,
                  fastestOrnamentalNotesPerBar: null,
                  comment: null,
                  commentForReview: null,
                },
              ],
            },
          ],
        },
      ],
      mMSourceOnPieceVersions: [
        {
          pieceVersionId: "pv-1",
          rank: 1,
        },
      ],
      metronomeMarks: [
        {
          id: "mm-1",
          pieceVersionId: "pv-1",
          sectionId: "sec-1",
          bpm: 112,
          beatUnit: NOTE_VALUE.HALF,
          comment: null,
          noMM: false,
        },
        {
          id: "mm-2",
          pieceVersionId: "pv-1",
          sectionId: "sec-2",
          bpm: 60,
          beatUnit: NOTE_VALUE.QUARTER,
          comment: null,
          noMM: false,
        },
      ],
    };
  }

  function createMockTx(sharedCounts: Record<string, number> = {}) {
    return {
      mMSourcesOnPieceVersions: {
        count: jest.fn(async ({ where }: any) => {
          const pvId = where.pieceVersionId;
          return sharedCounts[pvId] ?? 0;
        }),
      },
    } as unknown as PrismaTx;
  }

  describe("isPieceVersionModified helper", () => {
    it("returns false if baseline is identical to state", () => {
      const baseline = buildBaselineState();
      const baselinePv = baseline.pieceVersions![0];
      const statePv = JSON.parse(JSON.stringify(baselinePv));

      expect(isPieceVersionModified(baselinePv, statePv)).toBe(false);
    });

    it("returns false if baseline is undefined (newly created piece version)", () => {
      const baseline = buildBaselineState();
      const statePv = baseline.pieceVersions![0];

      expect(isPieceVersionModified(undefined, statePv)).toBe(false);
    });

    it("detects modification when category changes", () => {
      const baseline = buildBaselineState();
      const baselinePv = baseline.pieceVersions![0];
      const statePv = JSON.parse(JSON.stringify(baselinePv));
      statePv.category = PIECE_CATEGORY.ORCHESTRAL;

      expect(isPieceVersionModified(baselinePv, statePv)).toBe(true);
    });

    it("detects modification when pieceId changes", () => {
      const baseline = buildBaselineState();
      const baselinePv = baseline.pieceVersions![0];
      const statePv = JSON.parse(JSON.stringify(baselinePv));
      statePv.pieceId = "piece-other";

      expect(isPieceVersionModified(baselinePv, statePv)).toBe(true);
    });

    it("detects modification when movement rank or key changes", () => {
      const baseline = buildBaselineState();
      const baselinePv = baseline.pieceVersions![0];
      const statePv = JSON.parse(JSON.stringify(baselinePv));
      statePv.movements[0].key = KEY.C_MAJOR;

      expect(isPieceVersionModified(baselinePv, statePv)).toBe(true);
    });

    it("detects modification when a section is added", () => {
      const baseline = buildBaselineState();
      const baselinePv = baseline.pieceVersions![0];
      const statePv = JSON.parse(JSON.stringify(baselinePv));
      statePv.movements[0].sections.push({
        id: "sec-3",
        rank: 3,
        tempoIndicationId: "ti-1",
        metreNumerator: 4,
        metreDenominator: 4,
        isCommonTime: true,
        isCutTime: false,
        fastestStructuralNotesPerBar: 4,
        fastestBelCantoNotesPerBar: null,
        fastestStaccatoNotesPerBar: null,
        fastestRepeatedNotesPerBar: null,
        fastestOrnamentalNotesPerBar: null,
        comment: null,
        commentForReview: null,
      });

      expect(isPieceVersionModified(baselinePv, statePv)).toBe(true);
    });

    it("detects modification when a movement is removed", () => {
      const baseline = buildBaselineState();
      const baselinePv = baseline.pieceVersions![0];
      const statePv = JSON.parse(JSON.stringify(baselinePv));
      statePv.movements = [];

      expect(isPieceVersionModified(baselinePv, statePv)).toBe(true);
    });

    it("detects modification when a field transitions null → value and value → null", () => {
      const baseline = buildBaselineState();
      const baselinePv = baseline.pieceVersions![0];

      // null -> value
      const stateWithComment = JSON.parse(JSON.stringify(baselinePv));
      stateWithComment.movements[0].sections[0].comment = "Added comment";
      expect(isPieceVersionModified(baselinePv, stateWithComment)).toBe(true);

      // value -> null
      const stateWithoutNotes = JSON.parse(JSON.stringify(baselinePv));
      stateWithoutNotes.movements[0].sections[0].fastestStructuralNotesPerBar =
        null;
      expect(isPieceVersionModified(baselinePv, stateWithoutNotes)).toBe(true);
    });
  });

  describe("fork scenarios and edge cases", () => {
    it("Case 1: version modified + shared with another source → forks PV, movements, sections, and remaps join & marks", async () => {
      const baseline = buildBaselineState();
      const state = JSON.parse(JSON.stringify(baseline));

      // Modify a section in the state
      state.pieceVersions[0].movements[0].sections[0].fastestStructuralNotesPerBar = 16;
      state.pieceVersions[0].movements[0].sections[0].comment = "Edited section";

      // Shared with 1 other source in DB
      const mockTx = createMockTx({ "pv-1": 1 });

      const result = await forkModifiedSharedPieceVersions(mockTx, {
        mMSourceId: "source-1",
        baseline,
        state,
      });

      // 1. Result summary
      expect(result.forkedPairs).toHaveLength(1);
      expect(result.forkedPairs[0].from).toBe("pv-1");
      const newPvId = result.forkedPairs[0].to;
      expect(newPvId).not.toBe("pv-1");
      expect(result.createdPieceVersionIds).toEqual([newPvId]);

      // 2. Protected original entities
      expect(result.protectedEntityIds).toBeInstanceOf(Set);
      expect(result.protectedEntityIds.has("pv-1")).toBe(true);
      expect(result.protectedEntityIds.has("mov-1")).toBe(true);
      expect(result.protectedEntityIds.has("sec-1")).toBe(true);
      expect(result.protectedEntityIds.has("sec-2")).toBe(true);

      // 3. Remapped state: PieceVersions
      expect(result.state.pieceVersions).toHaveLength(1);
      const clonedPv = result.state.pieceVersions![0];
      expect(clonedPv.id).toBe(newPvId);
      expect(clonedPv.pieceId).toBe("piece-1"); // pieceId preserved
      expect(clonedPv.category).toBe(PIECE_CATEGORY.KEYBOARD);

      // Cloned movements & sections have new IDs
      expect(clonedPv.movements).toHaveLength(1);
      const clonedMov = clonedPv.movements[0];
      expect(clonedMov.id).not.toBe("mov-1");
      expect(clonedMov.sections).toHaveLength(2);

      const clonedSec1 = clonedMov.sections[0];
      const clonedSec2 = clonedMov.sections[1];
      expect(clonedSec1.id).not.toBe("sec-1");
      expect(clonedSec2.id).not.toBe("sec-2");
      expect(clonedSec1.tempoIndicationId).toBe("ti-1"); // tempoIndicationId preserved
      expect(clonedSec2.tempoIndicationId).toBe("ti-2");
      expect(clonedSec1.fastestStructuralNotesPerBar).toBe(16); // value from state
      expect(clonedSec1.comment).toBe("Edited section");

      // 4. Remapped state: MMSourcesOnPieceVersions join
      expect(result.state.mMSourceOnPieceVersions).toEqual([
        {
          pieceVersionId: newPvId,
          rank: 1, // rank preserved
        },
      ]);

      // 5. Remapped state: MMSourceDescription pieceVersions
      expect(result.state.mMSourceDescription?.pieceVersions).toEqual([
        { id: newPvId },
      ]);

      // 6. Remapped state: MetronomeMarks
      expect(result.state.metronomeMarks).toHaveLength(2);
      expect(result.state.metronomeMarks![0]).toEqual({
        id: "mm-1",
        pieceVersionId: newPvId,
        sectionId: clonedSec1.id,
        bpm: 112,
        beatUnit: NOTE_VALUE.HALF,
        comment: null,
        noMM: false,
      });
      expect(result.state.metronomeMarks![1]).toEqual({
        id: "mm-2",
        pieceVersionId: newPvId,
        sectionId: clonedSec2.id,
        bpm: 60,
        beatUnit: NOTE_VALUE.QUARTER,
        comment: null,
        noMM: false,
      });

      // 7. Server logging
      expect(infoSpy).toHaveBeenCalledWith(
        `[forkPieceVersion] pv-1 → ${newPvId} (source source-1)`,
      );
    });

    it("Case 2: version modified + NOT shared with any other source → NO fork, in-place update", async () => {
      const baseline = buildBaselineState();
      const state = JSON.parse(JSON.stringify(baseline));

      // Modify section
      state.pieceVersions[0].movements[0].sections[0].comment = "In place edit";

      // Count = 0 (only referenced by source-1 or no other source)
      const mockTx = createMockTx({ "pv-1": 0 });

      const result = await forkModifiedSharedPieceVersions(mockTx, {
        mMSourceId: "source-1",
        baseline,
        state,
      });

      expect(result.forkedPairs).toHaveLength(0);
      expect(result.createdPieceVersionIds).toHaveLength(0);
      expect(result.protectedEntityIds.size).toBe(0);
      expect(result.state).toBe(state);
      expect(infoSpy).not.toHaveBeenCalled();
    });

    it("Case 3: version NOT modified + shared with other sources → NO fork", async () => {
      const baseline = buildBaselineState();
      const state = JSON.parse(JSON.stringify(baseline));

      // State is completely identical to baseline
      const mockTx = createMockTx({ "pv-1": 2 });

      const result = await forkModifiedSharedPieceVersions(mockTx, {
        mMSourceId: "source-1",
        baseline,
        state,
      });

      expect(result.forkedPairs).toHaveLength(0);
      expect(result.createdPieceVersionIds).toHaveLength(0);
      expect(result.protectedEntityIds.size).toBe(0);
      expect(result.state).toBe(state);
      expect(infoSpy).not.toHaveBeenCalled();
    });

    it("Case 4: version shared ONLY with itself (count query excludes mMSourceId) → NO fork", async () => {
      const baseline = buildBaselineState();
      const state = JSON.parse(JSON.stringify(baseline));
      state.pieceVersions[0].category = PIECE_CATEGORY.CHAMBER_INSTRUMENTAL;

      // Mock tx verifies where clause has mMSourceId: { not: "source-1" }
      const countMock = jest.fn(async ({ where }: any) => {
        expect(where.mMSourceId).toEqual({ not: "source-1" });
        expect(where.pieceVersionId).toBe("pv-1");
        return 0; // Excludes current source, so returns 0 other sources
      });

      const mockTx = {
        mMSourcesOnPieceVersions: { count: countMock },
      } as unknown as PrismaTx;

      const result = await forkModifiedSharedPieceVersions(mockTx, {
        mMSourceId: "source-1",
        baseline,
        state,
      });

      expect(countMock).toHaveBeenCalledTimes(1);
      expect(result.forkedPairs).toHaveLength(0);
    });

    it("Case 5: addition of section alone triggers fork", async () => {
      const baseline = buildBaselineState();
      const state = JSON.parse(JSON.stringify(baseline));

      // Add a section
      state.pieceVersions[0].movements[0].sections.push({
        id: "sec-new",
        rank: 3,
        tempoIndicationId: "ti-1",
        metreNumerator: 4,
        metreDenominator: 4,
        isCommonTime: true,
        isCutTime: false,
        fastestStructuralNotesPerBar: 4,
        fastestBelCantoNotesPerBar: null,
        fastestStaccatoNotesPerBar: null,
        fastestRepeatedNotesPerBar: null,
        fastestOrnamentalNotesPerBar: null,
        comment: null,
        commentForReview: null,
      });

      const mockTx = createMockTx({ "pv-1": 1 });

      const result = await forkModifiedSharedPieceVersions(mockTx, {
        mMSourceId: "source-1",
        baseline,
        state,
      });

      expect(result.forkedPairs).toHaveLength(1);
      expect(result.state.pieceVersions![0].movements[0].sections).toHaveLength(
        3,
      );
    });

    it("Case 6: removal of movement alone triggers fork", async () => {
      const baseline = buildBaselineState();
      const state = JSON.parse(JSON.stringify(baseline));

      // Remove movement
      state.pieceVersions[0].movements = [];

      const mockTx = createMockTx({ "pv-1": 1 });

      const result = await forkModifiedSharedPieceVersions(mockTx, {
        mMSourceId: "source-1",
        baseline,
        state,
      });

      expect(result.forkedPairs).toHaveLength(1);
      expect(result.state.pieceVersions![0].movements).toHaveLength(0);
      // Original movement and sections from baseline are protected!
      expect(result.protectedEntityIds.has("mov-1")).toBe(true);
      expect(result.protectedEntityIds.has("sec-1")).toBe(true);
      expect(result.protectedEntityIds.has("sec-2")).toBe(true);
    });

    it("Case 7: field transition null → value and value → null triggers fork", async () => {
      // null -> value
      const baseline = buildBaselineState();
      const stateNullToVal = JSON.parse(JSON.stringify(baseline));
      stateNullToVal.pieceVersions[0].movements[0].sections[0].commentForReview =
        "Review note";

      const mockTx = createMockTx({ "pv-1": 1 });

      const res1 = await forkModifiedSharedPieceVersions(mockTx, {
        mMSourceId: "source-1",
        baseline,
        state: stateNullToVal,
      });
      expect(res1.forkedPairs).toHaveLength(1);

      // value -> null
      const stateValToNull = JSON.parse(JSON.stringify(baseline));
      stateValToNull.pieceVersions[0].movements[0].sections[0].fastestStructuralNotesPerBar =
        null;

      const res2 = await forkModifiedSharedPieceVersions(mockTx, {
        mMSourceId: "source-1",
        baseline,
        state: stateValToNull,
      });
      expect(res2.forkedPairs).toHaveLength(1);
    });

    it("Case 8: tempoIndicationId is strictly preserved across cloned sections", async () => {
      const baseline = buildBaselineState();
      const state = JSON.parse(JSON.stringify(baseline));
      state.pieceVersions[0].category = PIECE_CATEGORY.VOCAL;

      const mockTx = createMockTx({ "pv-1": 1 });

      const result = await forkModifiedSharedPieceVersions(mockTx, {
        mMSourceId: "source-1",
        baseline,
        state,
      });

      const sections = result.state.pieceVersions![0].movements[0].sections;
      expect(sections[0].tempoIndicationId).toBe("ti-1");
      expect(sections[1].tempoIndicationId).toBe("ti-2");
    });

    it("Case 9: protectedEntityIds contains ALL original IDs from baseline subtree", async () => {
      const baseline = buildBaselineState();
      const state = JSON.parse(JSON.stringify(baseline));
      // Delete sec-2 and modify sec-1
      state.pieceVersions[0].movements[0].sections = [
        state.pieceVersions[0].movements[0].sections[0],
      ];
      state.pieceVersions[0].movements[0].sections[0].comment = "Updated";

      const mockTx = createMockTx({ "pv-1": 1 });

      const result = await forkModifiedSharedPieceVersions(mockTx, {
        mMSourceId: "source-1",
        baseline,
        state,
      });

      expect(result.protectedEntityIds.has("pv-1")).toBe(true);
      expect(result.protectedEntityIds.has("mov-1")).toBe(true);
      expect(result.protectedEntityIds.has("sec-1")).toBe(true);
      expect(result.protectedEntityIds.has("sec-2")).toBe(true); // Deleted in state, but protected from baseline!
    });

    it("Case 10: Metronome marks for other piece versions or sources are untouched", async () => {
      const baseline = buildBaselineState();

      // Add a second piece version to state and baseline
      const pv2 = {
        id: "pv-2",
        pieceId: "piece-2",
        category: PIECE_CATEGORY.CHAMBER_INSTRUMENTAL,
        movements: [
          {
            id: "mov-2",
            rank: 1,
            key: KEY.D_MAJOR,
            isVariation: false,
            sections: [
              {
                id: "sec-pv2-1",
                rank: 1,
                tempoIndicationId: "ti-1",
                metreNumerator: 4,
                metreDenominator: 4,
                isCommonTime: true,
                isCutTime: false,
                fastestStructuralNotesPerBar: 4,
                fastestBelCantoNotesPerBar: null,
                fastestStaccatoNotesPerBar: null,
                fastestRepeatedNotesPerBar: null,
                fastestOrnamentalNotesPerBar: null,
                comment: null,
                commentForReview: null,
              },
            ],
          },
        ],
      };

      baseline.pieceVersions!.push(pv2);
      baseline.mMSourceOnPieceVersions!.push({
        pieceVersionId: "pv-2",
        rank: 2,
      });
      baseline.metronomeMarks!.push({
        id: "mm-pv2",
        pieceVersionId: "pv-2",
        sectionId: "sec-pv2-1",
        bpm: 120,
        beatUnit: NOTE_VALUE.QUARTER,
        comment: null,
        noMM: false,
      });

      const state = JSON.parse(JSON.stringify(baseline));

      // Modify pv-1 (shared, will fork)
      state.pieceVersions[0].movements[0].sections[0].comment = "Modified pv1";

      // pv-2 is not modified and shared
      const mockTx = createMockTx({ "pv-1": 1, "pv-2": 3 });

      const result = await forkModifiedSharedPieceVersions(mockTx, {
        mMSourceId: "source-1",
        baseline,
        state,
      });

      expect(result.forkedPairs).toHaveLength(1);
      expect(result.forkedPairs[0].from).toBe("pv-1");
      const newPv1Id = result.forkedPairs[0].to;
      expect(
        result.state.pieceVersions!.find((p) => p.id === newPv1Id),
      ).toBeDefined();

      // pv-2 remains completely intact
      const resultPv2 = result.state.pieceVersions!.find(
        (p) => p.id === "pv-2",
      );
      expect(resultPv2).toBeDefined();
      expect(resultPv2!.movements[0].sections[0].id).toBe("sec-pv2-1");

      // Marks for pv-2 are untouched
      const mmPv2 = result.state.metronomeMarks!.find((m) => m.id === "mm-pv2");
      expect(mmPv2).toEqual({
        id: "mm-pv2",
        pieceVersionId: "pv-2",
        sectionId: "sec-pv2-1",
        bpm: 120,
        beatUnit: NOTE_VALUE.QUARTER,
        comment: null,
        noMM: false,
      });

      // Join for pv-2 is untouched
      expect(
        result.state.mMSourceOnPieceVersions!.find(
          (j) => j.pieceVersionId === "pv-2",
        ),
      ).toEqual({ pieceVersionId: "pv-2", rank: 2 });
    });

    it("Multiple piece versions: handles mixed forks and in-place updates properly", async () => {
      const baseline = buildBaselineState();

      const pv2 = {
        id: "pv-2",
        pieceId: "piece-2",
        category: PIECE_CATEGORY.KEYBOARD,
        movements: [
          {
            id: "mov-2",
            rank: 1,
            key: KEY.G_MAJOR,
            isVariation: false,
            sections: [
              {
                id: "sec-2-1",
                rank: 1,
                tempoIndicationId: "ti-1",
                metreNumerator: 4,
                metreDenominator: 4,
                isCommonTime: true,
                isCutTime: false,
                fastestStructuralNotesPerBar: 4,
                fastestBelCantoNotesPerBar: null,
                fastestStaccatoNotesPerBar: null,
                fastestRepeatedNotesPerBar: null,
                fastestOrnamentalNotesPerBar: null,
                comment: null,
                commentForReview: null,
              },
            ],
          },
        ],
      };

      baseline.pieceVersions!.push(pv2);
      baseline.mMSourceOnPieceVersions!.push({
        pieceVersionId: "pv-2",
        rank: 2,
      });

      const state = JSON.parse(JSON.stringify(baseline));

      // Modify both pv-1 and pv-2
      state.pieceVersions[0].movements[0].sections[0].comment = "Mod pv1";
      state.pieceVersions[1].movements[0].sections[0].comment = "Mod pv2";

      // pv-1 is shared (forks), pv-2 is unshared (in-place)
      const mockTx = createMockTx({ "pv-1": 1, "pv-2": 0 });

      const result = await forkModifiedSharedPieceVersions(mockTx, {
        mMSourceId: "source-1",
        baseline,
        state,
      });

      expect(result.forkedPairs).toHaveLength(1);
      expect(result.forkedPairs[0].from).toBe("pv-1");
      const newPv1Id = result.forkedPairs[0].to;

      // pv-1 is replaced with clone
      expect(
        result.state.pieceVersions!.find((p) => p.id === newPv1Id),
      ).toBeDefined();
      expect(
        result.state.pieceVersions!.find((p) => p.id === "pv-1"),
      ).toBeUndefined();

      // pv-2 is kept with modified comment in place
      const retainedPv2 = result.state.pieceVersions!.find(
        (p) => p.id === "pv-2",
      );
      expect(retainedPv2).toBeDefined();
      expect(retainedPv2!.movements[0].sections[0].comment).toBe("Mod pv2");
    });
  });
});
