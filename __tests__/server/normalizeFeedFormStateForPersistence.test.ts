import { normalizeFeedFormStateForPersistence } from "@/utils/server/normalizeFeedFormStateForPersistence";
import { FeedFormState } from "@/types/feedFormTypes";
import {
  CONTRIBUTION_ROLE,
  KEY,
  NOTE_VALUE,
  PIECE_CATEGORY,
  REFERENCE_TYPE,
  SOURCE_TYPE,
} from "@/prisma/client/enums";
import { prodLog } from "@/utils/debugLogger";

describe("normalizeFeedFormStateForPersistence", () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(prodLog, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  function buildValidState(): FeedFormState {
    return {
      formInfo: {
        currentStepRank: 4,
        introDone: true,
        allSourceOnPieceVersionsDone: true,
      },
      mMSourceDescription: {
        id: "src-1",
        title: "Original Title",
        type: SOURCE_TYPE.EDITION,
        link: "https://imslp.org/test",
        permalink: "https://imslp.org/test-perma",
        year: 1801,
        isYearEstimated: false,
        comment: "Some comment",
        references: [
          {
            id: "ref-1",
            type: REFERENCE_TYPE.ISBN,
            reference: "978-0-123456-47-2",
          },
        ],
      },
      mMSourceContributions: [
        {
          id: "c-1",
          role: CONTRIBUTION_ROLE.EDITOR,
          personId: "p-1",
        },
      ],
      organizations: [
        {
          id: "org-1",
          name: "Breitkopf & Härtel",
        },
      ],
      persons: [
        {
          id: "p-1",
          firstName: "Ludwig van",
          lastName: "Beethoven",
          birthYear: 1770,
          deathYear: 1827,
        },
      ],
      collections: [
        {
          id: "col-1",
          title: "32 Piano Sonatas",
          composerId: "p-1",
          pieceCount: 32,
        },
      ],
      pieces: [
        {
          id: "piece-1",
          title: "Piano Sonata No. 1",
          nickname: null,
          composerId: "p-1",
          yearOfComposition: 1795,
          collectionId: "col-1",
          collectionRank: 1,
        },
      ],
      tempoIndications: [
        {
          id: "ti-1",
          text: "Allegro",
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
      ],
    };
  }

  describe("Rule 1 — Retrait des marques noMM: true", () => {
    it("filters out metronome marks with noMM: true and retains noMM: false marks", () => {
      const state = buildValidState();
      state.metronomeMarks = [
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
          sectionId: "sec-1",
          noMM: true,
        },
      ];

      const result = normalizeFeedFormStateForPersistence(state);

      expect(result.metronomeMarks).toHaveLength(1);
      expect(result.metronomeMarks![0]).toEqual({
        id: "mm-1",
        pieceVersionId: "pv-1",
        sectionId: "sec-1",
        bpm: 112,
        beatUnit: NOTE_VALUE.HALF,
        comment: null,
        noMM: false,
      });
    });

    it("dedicated scenario: toggling a real metronome mark to 'no MM' removes it from state for DELETE detection", () => {
      // In review workflow (§12.1), when reviewer toggles an existing MM to noMM,
      // it is received in state with noMM: true. Normalization must drop it completely.
      const state = buildValidState();
      state.metronomeMarks = [
        {
          id: "existing-mm-id",
          pieceVersionId: "pv-1",
          sectionId: "sec-1",
          noMM: true,
        },
      ];

      const result = normalizeFeedFormStateForPersistence(state);

      expect(result.metronomeMarks).toEqual([]);
    });
  });

  describe("Rule 2 — Retrait des champs UI", () => {
    it("strips isNew, isComposerNew, isCollectionNew, next, noDate and other form flags", () => {
      const state = buildValidState();
      // Add UI flags to various entities
      (state.mMSourceDescription as any).isNew = true;
      (state.mMSourceDescription as any).next = true;
      (state.mMSourceDescription as any).noDate = false;
      (state.mMSourceDescription!.references[0] as any).isNew = true;

      (state.mMSourceContributions![0] as any).isNew = true;
      (state.mMSourceContributions![0] as any).isPersonNew = true;

      (state.organizations![0] as any).isNew = true;

      (state.persons![0] as any).isNew = true;

      (state.collections![0] as any).isNew = true;
      (state.collections![0] as any).isComposerNew = true;

      (state.pieces![0] as any).isNew = true;
      (state.pieces![0] as any).isComposerNew = true;
      (state.pieces![0] as any).isCollectionNew = true;

      (state.pieceVersions![0] as any).isNew = true;
      (state.pieceVersions![0].movements[0] as any).isNew = true;
      (state.pieceVersions![0].movements[0].sections[0] as any).isNew = true;

      (state.tempoIndications![0] as any).isNew = true;

      (state.metronomeMarks![0] as any).isNew = true;

      (state.mMSourceOnPieceVersions![0] as any).isNew = true;

      const result = normalizeFeedFormStateForPersistence(state);

      expect((result.mMSourceDescription as any).isNew).toBeUndefined();
      expect((result.mMSourceDescription as any).next).toBeUndefined();
      expect((result.mMSourceDescription as any).noDate).toBeUndefined();
      expect((result.mMSourceDescription!.references[0] as any).isNew).toBeUndefined();
      expect((result.mMSourceContributions![0] as any).isNew).toBeUndefined();
      expect((result.mMSourceContributions![0] as any).isPersonNew).toBeUndefined();
      expect((result.organizations![0] as any).isNew).toBeUndefined();
      expect((result.persons![0] as any).isNew).toBeUndefined();
      expect((result.collections![0] as any).isNew).toBeUndefined();
      expect((result.collections![0] as any).isComposerNew).toBeUndefined();
      expect((result.pieces![0] as any).isNew).toBeUndefined();
      expect((result.pieces![0] as any).isComposerNew).toBeUndefined();
      expect((result.pieces![0] as any).isCollectionNew).toBeUndefined();
      expect((result.pieceVersions![0] as any).isNew).toBeUndefined();
      expect((result.pieceVersions![0].movements[0] as any).isNew).toBeUndefined();
      expect((result.pieceVersions![0].movements[0].sections[0] as any).isNew).toBeUndefined();
      expect((result.tempoIndications![0] as any).isNew).toBeUndefined();
      expect((result.metronomeMarks![0] as any).isNew).toBeUndefined();
      expect((result.mMSourceOnPieceVersions![0] as any).isNew).toBeUndefined();
    });
  });

  describe("Rule 3 — Normalisation des valeurs vides", () => {
    it("converts empty string and undefined to null across all entities", () => {
      const state = buildValidState();

      // Set empty strings and undefined on various fields
      state.mMSourceDescription!.title = "";
      state.mMSourceDescription!.comment = undefined;
      state.mMSourceDescription!.permalink = "";
      state.mMSourceDescription!.references[0].reference = "";

      state.persons![0].deathYear = undefined as any;

      state.pieces![0].nickname = "";
      state.pieces![0].yearOfComposition = undefined;
      state.pieces![0].collectionId = undefined;
      state.pieces![0].collectionRank = undefined;

      state.pieceVersions![0].movements[0].key = undefined as any;
      state.pieceVersions![0].movements[0].isVariation = undefined;

      const sec = state.pieceVersions![0].movements[0].sections[0];
      sec.isCommonTime = undefined;
      sec.isCutTime = undefined;
      sec.fastestStructuralNotesPerBar = undefined as any;
      sec.fastestBelCantoNotesPerBar = "" as any;
      sec.comment = "";
      sec.commentForReview = undefined;

      (state.metronomeMarks![0] as any).comment = "";

      const result = normalizeFeedFormStateForPersistence(state);

      expect(result.mMSourceDescription!.title).toBeNull();
      expect(result.mMSourceDescription!.comment).toBeNull();
      expect(result.mMSourceDescription!.permalink).toBeNull();
      expect(result.mMSourceDescription!.references[0].reference).toBeNull();

      expect(result.persons![0].deathYear).toBeNull();

      expect(result.pieces![0].nickname).toBeNull();
      expect(result.pieces![0].yearOfComposition).toBeNull();
      expect(result.pieces![0].collectionId).toBeNull();
      expect(result.pieces![0].collectionRank).toBeNull();

      expect(result.pieceVersions![0].movements[0].key).toBeNull();
      expect(result.pieceVersions![0].movements[0].isVariation).toBe(false);

      const normalizedSec = result.pieceVersions![0].movements[0].sections[0];
      expect(normalizedSec.isCommonTime).toBe(false);
      expect(normalizedSec.isCutTime).toBe(false);
      expect(normalizedSec.fastestStructuralNotesPerBar).toBeNull();
      expect(normalizedSec.fastestBelCantoNotesPerBar).toBeNull();
      expect(normalizedSec.comment).toBeNull();
      expect(normalizedSec.commentForReview).toBeNull();

      expect((result.metronomeMarks![0] as any).comment).toBeNull();
    });

    it("preserves explicit boolean false and true values", () => {
      const state = buildValidState();
      state.pieceVersions![0].movements[0].isVariation = false;
      state.pieceVersions![0].movements[0].sections[0].isCommonTime = true;
      state.pieceVersions![0].movements[0].sections[0].isCutTime = false;

      const result = normalizeFeedFormStateForPersistence(state);

      expect(result.pieceVersions![0].movements[0].isVariation).toBe(false);
      expect(result.pieceVersions![0].movements[0].sections[0].isCommonTime).toBe(true);
      expect(result.pieceVersions![0].movements[0].sections[0].isCutTime).toBe(false);
    });
  });

  describe("Rule 4 — Continuité des rangs de mMSourceOnPieceVersions", () => {
    it("sorts by existing rank and renumbers ranks starting from 1 with no gaps", () => {
      const state = buildValidState();
      state.mMSourceOnPieceVersions = [
        { pieceVersionId: "pv-3", rank: 10 },
        { pieceVersionId: "pv-1", rank: 2 },
        { pieceVersionId: "pv-2", rank: 5 },
      ];

      const result = normalizeFeedFormStateForPersistence(state);

      expect(result.mMSourceOnPieceVersions).toEqual([
        { pieceVersionId: "pv-1", rank: 1 },
        { pieceVersionId: "pv-2", rank: 2 },
        { pieceVersionId: "pv-3", rank: 3 },
      ]);
    });

    it("handles empty array cleanly", () => {
      const state = buildValidState();
      state.mMSourceOnPieceVersions = [];

      const result = normalizeFeedFormStateForPersistence(state);

      expect(result.mMSourceOnPieceVersions).toEqual([]);
    });
  });

  describe("Rule 5 — Attribution d'ids manquants", () => {
    it("generates uuid for Reference without logging a warning", () => {
      const state = buildValidState();
      state.mMSourceDescription!.references = [
        {
          type: REFERENCE_TYPE.ISBN,
          reference: "Ref without id",
        },
      ];

      const result = normalizeFeedFormStateForPersistence(state);

      expect(result.mMSourceDescription!.references[0].id).toBeDefined();
      expect(typeof result.mMSourceDescription!.references[0].id).toBe("string");
      expect(result.mMSourceDescription!.references[0].id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it("generates uuid and logs warning for non-Reference entities without id", () => {
      const state = buildValidState();
      delete (state.mMSourceDescription as any).id;
      delete (state.mMSourceContributions![0] as any).id;
      delete (state.organizations![0] as any).id;
      delete (state.persons![0] as any).id;
      delete (state.collections![0] as any).id;
      delete (state.pieces![0] as any).id;
      delete (state.pieceVersions![0] as any).id;
      delete (state.pieceVersions![0].movements[0] as any).id;
      delete (state.tempoIndications![0] as any).id;
      delete (state.metronomeMarks![0] as any).id;
      // Section without id tested with no metronome marks to avoid unlinked sectionId
      state.metronomeMarks = [];

      // Test section without id
      delete (state.pieceVersions![0].movements[0].sections[0] as any).id;

      const result = normalizeFeedFormStateForPersistence(state);

      expect(result.mMSourceDescription!.id).toBeDefined();
      expect(result.mMSourceContributions![0].id).toBeDefined();
      expect(result.organizations![0].id).toBeDefined();
      expect(result.persons![0].id).toBeDefined();
      expect(result.collections![0].id).toBeDefined();
      expect(result.pieces![0].id).toBeDefined();
      expect(result.pieceVersions![0].id).toBeDefined();
      expect(result.pieceVersions![0].movements[0].id).toBeDefined();
      expect(result.pieceVersions![0].movements[0].sections[0].id).toBeDefined();
      expect(result.tempoIndications![0].id).toBeDefined();

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("[normalizeFeedFormStateForPersistence] Missing id for MMSource"),
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("[normalizeFeedFormStateForPersistence] Missing id for Contribution"),
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("[normalizeFeedFormStateForPersistence] Missing id for Organization"),
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("[normalizeFeedFormStateForPersistence] Missing id for Person"),
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("[normalizeFeedFormStateForPersistence] Missing id for Collection"),
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("[normalizeFeedFormStateForPersistence] Missing id for Piece"),
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("[normalizeFeedFormStateForPersistence] Missing id for PieceVersion"),
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("[normalizeFeedFormStateForPersistence] Missing id for Movement"),
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("[normalizeFeedFormStateForPersistence] Missing id for Section"),
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("[normalizeFeedFormStateForPersistence] Missing id for TempoIndication"),
      );
    });

    it("generates uuid and logs warning for MetronomeMark without id", () => {
      const state = buildValidState();
      delete (state.metronomeMarks![0] as any).id;

      const result = normalizeFeedFormStateForPersistence(state);

      expect(result.metronomeMarks![0].id).toBeDefined();
      expect(typeof result.metronomeMarks![0].id).toBe("string");
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("[normalizeFeedFormStateForPersistence] Missing id for MetronomeMark"),
      );
    });
  });

  describe("Rule 6 — Vérification de cohérence", () => {
    it("throws if a Section is missing tempoIndicationId", () => {
      const state = buildValidState();
      (state.pieceVersions![0].movements[0].sections[0] as any).tempoIndicationId = null;

      expect(() => normalizeFeedFormStateForPersistence(state)).toThrow(
        "[normalizeFeedFormStateForPersistence] Section sec-1 is missing mandatory tempoIndicationId",
      );
    });

    it("throws if a Section has an empty string tempoIndicationId", () => {
      const state = buildValidState();
      state.pieceVersions![0].movements[0].sections[0].tempoIndicationId = "";

      expect(() => normalizeFeedFormStateForPersistence(state)).toThrow(
        "[normalizeFeedFormStateForPersistence] Section sec-1 is missing mandatory tempoIndicationId",
      );
    });

    it("throws if a retained MetronomeMark references an unknown sectionId", () => {
      const state = buildValidState();
      state.metronomeMarks![0].sectionId = "unknown-sec-99";

      expect(() => normalizeFeedFormStateForPersistence(state)).toThrow(
        '[normalizeFeedFormStateForPersistence] MetronomeMark mm-1 references unknown sectionId "unknown-sec-99"',
      );
    });

    it("does not throw for removed noMM: true mark referencing an unknown sectionId", () => {
      const state = buildValidState();
      state.metronomeMarks = [
        {
          id: "mm-1",
          pieceVersionId: "pv-1",
          sectionId: "sec-1",
          bpm: 112,
          beatUnit: NOTE_VALUE.HALF,
          noMM: false,
        },
        {
          id: "mm-noMM",
          pieceVersionId: "pv-1",
          sectionId: "deleted-section-id",
          noMM: true,
        },
      ];

      expect(() => normalizeFeedFormStateForPersistence(state)).not.toThrow();
    });
  });

  describe("Purity — Pas d'effet de bord sur l'argument reçu", () => {
    it("does not mutate the input state object", () => {
      const state = buildValidState();
      const stateSnapshot = JSON.parse(JSON.stringify(state));

      normalizeFeedFormStateForPersistence(state);

      expect(state).toEqual(stateSnapshot);
    });
  });
});
