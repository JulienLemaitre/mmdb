import { computeMMSourceDerivedData } from "@/utils/server/computeMMSourceDerivedData";
import { FeedFormState } from "@/types/feedFormTypes";
import { KEY, PIECE_CATEGORY, SOURCE_TYPE } from "@/prisma/client/enums";

describe("computeMMSourceDerivedData", () => {
  const createMockSection = (id: string, rank: number, tempoIndicationId: string) => ({
    id,
    rank,
    tempoIndicationId,
    metreNumerator: 4,
    metreDenominator: 4,
    fastestStructuralNotesPerBar: 4,
  });

  const createMockMovement = (id: string, rank: number, sections: ReturnType<typeof createMockSection>[]) => ({
    id,
    rank,
    key: KEY.C_MAJOR,
    isVariation: false,
    sections,
  });

  describe("sectionCount calculation", () => {
    it("calculates sectionCount across multiple linked piece versions, movements, and sections", () => {
      const state: FeedFormState = {
        mMSourceDescription: {
          id: "src-1",
          type: SOURCE_TYPE.EDITION,
          title: "Complete Works",
          link: "https://imslp.org/wiki/Special:ImagefromIndex/12345/abc",
          isYearEstimated: false,
          references: [],
        },
        mMSourceOnPieceVersions: [
          { pieceVersionId: "pv-1", rank: 1 },
          { pieceVersionId: "pv-2", rank: 2 },
        ],
        pieceVersions: [
          {
            id: "pv-1",
            pieceId: "piece-1",
            category: PIECE_CATEGORY.KEYBOARD,
            movements: [
              createMockMovement("mov-1", 1, [
                createMockSection("sec-1", 1, "ti-1"),
                createMockSection("sec-2", 2, "ti-2"),
              ]),
              createMockMovement("mov-2", 2, [
                createMockSection("sec-3", 1, "ti-1"),
                createMockSection("sec-4", 2, "ti-2"),
              ]),
            ],
          },
          {
            id: "pv-2",
            pieceId: "piece-2",
            category: PIECE_CATEGORY.KEYBOARD,
            movements: [
              createMockMovement("mov-3", 1, [
                createMockSection("sec-5", 1, "ti-1"),
                createMockSection("sec-6", 2, "ti-2"),
                createMockSection("sec-7", 3, "ti-3"),
              ]),
            ],
          },
          {
            // pv-3 is in pieceVersions but NOT linked to the source in mMSourceOnPieceVersions
            id: "pv-3",
            pieceId: "piece-3",
            category: PIECE_CATEGORY.ORCHESTRAL,
            movements: [
              createMockMovement("mov-4", 1, [
                createMockSection("sec-8", 1, "ti-1"),
                createMockSection("sec-9", 2, "ti-2"),
                createMockSection("sec-10", 3, "ti-3"),
                createMockSection("sec-11", 4, "ti-4"),
              ]),
            ],
          },
        ],
      };

      const result = computeMMSourceDerivedData(state);

      // pv-1 (4 sections) + pv-2 (3 sections) = 7 sections (pv-3 ignored)
      expect(result.sectionCount).toBe(7);
      expect(result.permalink).toBe(
        "https://imslp.org/wiki/Special:ImagefromIndex/12345",
      );
    });

    it("returns 0 when there are no linked piece versions or no sections", () => {
      const emptyState: FeedFormState = {
        mMSourceDescription: {
          id: "src-empty",
          type: SOURCE_TYPE.MANUSCRIPT,
          title: "Empty Source",
          link: "",
          isYearEstimated: false,
          references: [],
        },
        mMSourceOnPieceVersions: [],
        pieceVersions: [],
      };

      const result = computeMMSourceDerivedData(emptyState);
      expect(result.sectionCount).toBe(0);
      expect(result.permalink).toBe("");
    });

    it("handles undefined properties gracefully", () => {
      const minimalState: FeedFormState = {};

      const result = computeMMSourceDerivedData(minimalState);
      expect(result.sectionCount).toBe(0);
      expect(result.permalink).toBe("");
    });
  });

  describe("permalink calculation", () => {
    it("generates IMSLP permalink for ephemeral mirror link", () => {
      const state: FeedFormState = {
        mMSourceDescription: {
          id: "src-1",
          type: SOURCE_TYPE.EDITION,
          title: "Edition",
          link: "https://vmirror.imslp.org/files/imglnks/usimg/3/30/IMSLP78946-PMLP01479-Beethoven_Op.2_No.1.pdf",
          isYearEstimated: false,
          references: [],
        },
      };

      const result = computeMMSourceDerivedData(state);
      expect(result.permalink).toBe(
        "https://imslp.org/wiki/Special:ImagefromIndex/78946",
      );
    });

    it("generates IMSLP permalink for Special:ImagefromIndex link", () => {
      const state: FeedFormState = {
        mMSourceDescription: {
          id: "src-1",
          type: SOURCE_TYPE.EDITION,
          title: "Edition",
          link: "https://imslp.org/wiki/Special:ImagefromIndex/78946/senen",
          isYearEstimated: false,
          references: [],
        },
      };

      const result = computeMMSourceDerivedData(state);
      expect(result.permalink).toBe(
        "https://imslp.org/wiki/Special:ImagefromIndex/78946",
      );
    });

    it("generates IMSLP permalink for Special:IMSLPImageHandler link", () => {
      const state: FeedFormState = {
        mMSourceDescription: {
          id: "src-1",
          type: SOURCE_TYPE.EDITION,
          title: "Edition",
          link: "https://imslp.org/wiki/Special:IMSLPImageHandler/78946/senen",
          isYearEstimated: false,
          references: [],
        },
      };

      const result = computeMMSourceDerivedData(state);
      expect(result.permalink).toBe(
        "https://imslp.org/wiki/Special:ImagefromIndex/78946",
      );
    });

    it("preserves non-IMSLP valid URL as permalink", () => {
      const state: FeedFormState = {
        mMSourceDescription: {
          id: "src-1",
          type: SOURCE_TYPE.EDITION,
          title: "External Library",
          link: "https://gallica.bnf.fr/ark:/12148/bpt6k12345",
          isYearEstimated: false,
          references: [],
        },
      };

      const result = computeMMSourceDerivedData(state);
      expect(result.permalink).toBe(
        "https://gallica.bnf.fr/ark:/12148/bpt6k12345",
      );
    });

    it("returns empty string when link is null, undefined, or empty string", () => {
      const stateWithNull: FeedFormState = {
        mMSourceDescription: {
          id: "src-1",
          type: SOURCE_TYPE.EDITION,
          title: "No link",
          link: null as any,
          isYearEstimated: false,
          references: [],
        },
      };
      expect(computeMMSourceDerivedData(stateWithNull).permalink).toBe("");

      const stateWithWhitespace: FeedFormState = {
        mMSourceDescription: {
          id: "src-2",
          type: SOURCE_TYPE.EDITION,
          title: "Whitespace link",
          link: "   ",
          isYearEstimated: false,
          references: [],
        },
      };
      expect(computeMMSourceDerivedData(stateWithWhitespace).permalink).toBe("");
    });
  });
});
