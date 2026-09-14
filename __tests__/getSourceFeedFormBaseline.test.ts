const mockGetServerSession = jest.fn();
jest.mock("next-auth", () => ({
  getServerSession: (...args: any[]) => mockGetServerSession(...args),
}));

const mockReviewFindFirst = jest.fn();
const mockMMSourceFindUnique = jest.fn();
const mockCollectionFindMany = jest.fn();
const mockPersonFindMany = jest.fn();
const mockOrganizationFindMany = jest.fn();

jest.mock("@/utils/server/db", () => ({
  db: {
    review: { findFirst: (...args: any[]) => mockReviewFindFirst(...args) },
    mMSource: {
      findUnique: (...args: any[]) => mockMMSourceFindUnique(...args),
    },
    collection: {
      findMany: (...args: any[]) => mockCollectionFindMany(...args),
    },
    person: { findMany: (...args: any[]) => mockPersonFindMany(...args) },
    organization: {
      findMany: (...args: any[]) => mockOrganizationFindMany(...args),
    },
  },
}));

import {
  getSourceFeedFormBaseline,
  getSourceEditBaseline,
} from "@/utils/server/getSourceFeedFormBaseline";
import {
  REVIEW_STATE,
  SOURCE_TYPE,
  CONTRIBUTION_ROLE,
  NOTE_VALUE,
  KEY,
  PIECE_CATEGORY,
  REFERENCE_TYPE,
} from "@/prisma/client/enums";

describe("getSourceFeedFormBaseline & getSourceEditBaseline", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function setSession(user: { id: string; role?: string } | null) {
    mockGetServerSession.mockResolvedValue(user ? { user } : null);
  }

  const sampleDbMMSource = {
    id: "src-1",
    title: "Test MM Source",
    type: SOURCE_TYPE.EDITION,
    link: "https://imslp.org/test",
    permalink: "https://imslp.org/test-perma",
    year: 1850,
    isYearEstimated: false,
    comment: "Source comment",
    creatorId: "user-author",
    reviewState: REVIEW_STATE.PENDING,
    creator: { id: "user-author", name: "Author", email: "author@example.com" },
    references: [
      {
        id: "ref-1",
        type: REFERENCE_TYPE.ISBN,
        reference: "https://imslp.org/test",
      },
    ],
    contributions: [
      {
        id: "contrib-1",
        role: CONTRIBUTION_ROLE.PUBLISHER,
        personId: null,
        organizationId: "org-1",
        person: null,
        organization: { id: "org-1", name: "Publisher Org" },
      },
    ],
    pieceVersions: [
      {
        id: "join-1",
        rank: 0,
        pieceVersionId: "pv-1",
        pieceVersion: {
          id: "pv-1",
          category: PIECE_CATEGORY.CHAMBER_INSTRUMENTAL,
          piece: {
            id: "p-1",
            title: "Symphony No. 5",
            nickname: "Fate",
            yearOfComposition: 1808,
            composerId: "person-beethoven",
            collectionId: null,
            collectionRank: null,
          },
          movements: [
            {
              id: "mov-1",
              rank: 0,
              key: KEY.C_MINOR,
              isVariation: false,
              sections: [
                {
                  id: "sec-1",
                  rank: 0,
                  metreNumerator: 2,
                  metreDenominator: 4,
                  isCommonTime: false,
                  isCutTime: false,
                  fastestStructuralNotesPerBar: NOTE_VALUE.EIGHTH,
                  fastestBelCantoNotesPerBar: null,
                  fastestStaccatoNotesPerBar: null,
                  fastestRepeatedNotesPerBar: null,
                  fastestOrnamentalNotesPerBar: null,
                  tempoIndicationId: "ti-1",
                  tempoIndication: { id: "ti-1", text: "Allegro con brio" },
                  comment: "Section comment",
                  commentForReview: "For reviewer",
                },
              ],
            },
          ],
        },
      },
    ],
    metronomeMarks: [
      {
        id: "mm-1",
        beatUnit: NOTE_VALUE.HALF,
        bpm: 108,
        comment: "Half note = 108",
        sectionId: "sec-1",
      },
    ],
  };

  describe("getSourceFeedFormBaseline", () => {
    it("throws if mMSourceId is empty", async () => {
      await expect(getSourceFeedFormBaseline("")).rejects.toThrow(
        "[getSourceFeedFormBaseline] mMSourceId is required",
      );
    });

    it("returns null if MM Source not found", async () => {
      mockMMSourceFindUnique.mockResolvedValue(null);
      const result = await getSourceFeedFormBaseline("non-existent");
      expect(result).toBeNull();
    });

    it("extracts and maps full entity graph into FeedFormState baseline without formInfo", async () => {
      mockMMSourceFindUnique.mockResolvedValue(sampleDbMMSource);
      mockOrganizationFindMany.mockResolvedValue([
        { id: "org-1", name: "Publisher Org" },
      ]);
      mockPersonFindMany.mockResolvedValue([
        {
          id: "person-beethoven",
          firstName: "Ludwig van",
          lastName: "Beethoven",
          birthYear: 1770,
          deathYear: 1827,
        },
      ]);
      mockCollectionFindMany.mockResolvedValue([]);

      const result = await getSourceFeedFormBaseline("src-1");
      expect(result).not.toBeNull();
      const { baseline, mMSource } = result!;

      expect(mMSource.id).toBe("src-1");
      expect(mMSource.creatorId).toBe("user-author");
      expect(mMSource.reviewState).toBe(REVIEW_STATE.PENDING);

      // Verify baseline shape has NO formInfo
      expect(baseline.formInfo).toBeUndefined();
      expect(baseline.mMSourceDescription?.title).toBe("Test MM Source");
      expect(baseline.mMSourceDescription?.references).toHaveLength(1);
      expect(baseline.mMSourceContributions).toHaveLength(1);
      expect(baseline.pieces).toHaveLength(1);
      expect(baseline.pieces![0].title).toBe("Symphony No. 5");
      expect(baseline.pieceVersions).toHaveLength(1);
      expect(baseline.pieceVersions![0].movements).toHaveLength(1);
      expect(baseline.metronomeMarks).toHaveLength(1);
      // @ts-expect-error type narrowing error in test ?
      expect(baseline.metronomeMarks![0].bpm).toBe(108);
      expect(baseline.metronomeMarks![0].noMM).toBe(false);
    });

    it("generates noMM: true for sections that have no metronome mark in the database", async () => {
      const sourceWithEmptySections = {
        ...sampleDbMMSource,
        pieceVersions: [
          {
            ...sampleDbMMSource.pieceVersions[0],
            pieceVersion: {
              ...sampleDbMMSource.pieceVersions[0].pieceVersion,
              movements: [
                {
                  ...sampleDbMMSource.pieceVersions[0].pieceVersion.movements[0],
                  sections: [
                    sampleDbMMSource.pieceVersions[0].pieceVersion.movements[0].sections[0],
                    {
                      id: "sec-2",
                      rank: 1,
                      metreNumerator: 3,
                      metreDenominator: 4,
                      isCommonTime: false,
                      isCutTime: false,
                      fastestStructuralNotesPerBar: NOTE_VALUE.QUARTER,
                      fastestBelCantoNotesPerBar: null,
                      fastestStaccatoNotesPerBar: null,
                      fastestRepeatedNotesPerBar: null,
                      fastestOrnamentalNotesPerBar: null,
                      tempoIndicationId: null,
                      tempoIndication: null,
                      comment: null,
                      commentForReview: null,
                    },
                  ],
                },
              ],
            },
          },
        ],
        // metronomeMarks contains only sec-1, sec-2 has none
        metronomeMarks: [
          {
            id: "mm-1",
            beatUnit: NOTE_VALUE.HALF,
            bpm: 108,
            comment: "Half note = 108",
            sectionId: "sec-1",
          },
        ],
      };

      mockMMSourceFindUnique.mockResolvedValue(sourceWithEmptySections);
      mockOrganizationFindMany.mockResolvedValue([]);
      mockPersonFindMany.mockResolvedValue([]);
      mockCollectionFindMany.mockResolvedValue([]);

      const result = await getSourceFeedFormBaseline("src-1");
      expect(result).not.toBeNull();
      const { baseline } = result!;

      expect(baseline.metronomeMarks).toHaveLength(2);
      const mm1 = baseline.metronomeMarks!.find((m) => m.sectionId === "sec-1");
      const mm2 = baseline.metronomeMarks!.find((m) => m.sectionId === "sec-2");

      expect(mm1).toEqual({
        id: "mm-1",
        sectionId: "sec-1",
        beatUnit: NOTE_VALUE.HALF,
        bpm: 108,
        comment: "Half note = 108",
        pieceVersionId: "pv-1",
        noMM: false,
      });

      expect(mm2).toEqual({
        sectionId: "sec-2",
        pieceVersionId: "pv-1",
        noMM: true,
      });
    });

    it("throws an error if a metronome mark references an orphan sectionId", async () => {
      const sourceWithOrphanMM = {
        ...sampleDbMMSource,
        metronomeMarks: [
          {
            id: "mm-orphan",
            beatUnit: NOTE_VALUE.HALF,
            bpm: 108,
            comment: null,
            sectionId: "sec-non-existent",
          },
        ],
      };

      mockMMSourceFindUnique.mockResolvedValue(sourceWithOrphanMM);
      mockOrganizationFindMany.mockResolvedValue([]);
      mockPersonFindMany.mockResolvedValue([]);
      mockCollectionFindMany.mockResolvedValue([]);

      await expect(getSourceFeedFormBaseline("src-1")).rejects.toThrow(
        "[getSourceFeedFormBaseline] Metronome mark sectionId sec-non-existent not found in pieceVersions",
      );
    });
  });

  describe("getSourceEditBaseline", () => {
    it("throws Unauthorized if session is missing", async () => {
      setSession(null);
      await expect(getSourceEditBaseline("src-1")).rejects.toThrow(
        "[getSourceEditBaseline] Unauthorized",
      );
    });

    it("throws if active review exists", async () => {
      setSession({ id: "user-author", role: "EDITOR" });
      mockReviewFindFirst.mockResolvedValue({ id: "rev-active" });

      await expect(getSourceEditBaseline("src-1")).rejects.toThrow(
        "[getSourceEditBaseline] A review is currently in progress on this MM Source",
      );
    });

    it("throws Forbidden if current user is not the creator", async () => {
      setSession({ id: "user-other", role: "EDITOR" });
      mockReviewFindFirst.mockResolvedValue(null);
      mockMMSourceFindUnique.mockResolvedValue(sampleDbMMSource);
      mockOrganizationFindMany.mockResolvedValue([]);
      mockPersonFindMany.mockResolvedValue([]);
      mockCollectionFindMany.mockResolvedValue([]);

      await expect(getSourceEditBaseline("src-1")).rejects.toThrow(
        "[getSourceEditBaseline] Forbidden: only the creator can edit this MM Source",
      );
    });

    it("throws if reviewState is not PENDING", async () => {
      setSession({ id: "user-author", role: "EDITOR" });
      mockReviewFindFirst.mockResolvedValue(null);
      mockMMSourceFindUnique.mockResolvedValue({
        ...sampleDbMMSource,
        reviewState: REVIEW_STATE.APPROVED,
      });
      mockOrganizationFindMany.mockResolvedValue([]);
      mockPersonFindMany.mockResolvedValue([]);
      mockCollectionFindMany.mockResolvedValue([]);

      await expect(getSourceEditBaseline("src-1")).rejects.toThrow(
        "[getSourceEditBaseline] Only PENDING MM Sources can be edited",
      );
    });

    it("successfully returns baseline and initialState with initialized formInfo for author", async () => {
      setSession({ id: "user-author", role: "EDITOR" });
      mockReviewFindFirst.mockResolvedValue(null);
      mockMMSourceFindUnique.mockResolvedValue(sampleDbMMSource);
      mockOrganizationFindMany.mockResolvedValue([
        { id: "org-1", name: "Publisher Org" },
      ]);
      mockPersonFindMany.mockResolvedValue([
        {
          id: "person-beethoven",
          firstName: "Ludwig van",
          lastName: "Beethoven",
          birthYear: 1770,
          deathYear: 1827,
        },
      ]);
      mockCollectionFindMany.mockResolvedValue([]);

      const result = await getSourceEditBaseline("src-1");

      expect(result.mMSource.id).toBe("src-1");
      expect(result.baseline.formInfo).toBeUndefined();
      expect(result.initialState.formInfo).toEqual({
        currentStepRank: 0,
        introDone: false,
        allSourceOnPieceVersionsDone: true,
      });
    });

    it("generates noMM: true entries in both baseline and initialState for sections without DB marks", async () => {
      const sourceWithEmptySections = {
        ...sampleDbMMSource,
        pieceVersions: [
          {
            ...sampleDbMMSource.pieceVersions[0],
            pieceVersion: {
              ...sampleDbMMSource.pieceVersions[0].pieceVersion,
              movements: [
                {
                  ...sampleDbMMSource.pieceVersions[0].pieceVersion.movements[0],
                  sections: [
                    sampleDbMMSource.pieceVersions[0].pieceVersion.movements[0].sections[0],
                    {
                      id: "sec-2",
                      rank: 1,
                      metreNumerator: 3,
                      metreDenominator: 4,
                      isCommonTime: false,
                      isCutTime: false,
                      fastestStructuralNotesPerBar: null,
                      fastestBelCantoNotesPerBar: null,
                      fastestStaccatoNotesPerBar: null,
                      fastestRepeatedNotesPerBar: null,
                      fastestOrnamentalNotesPerBar: null,
                      tempoIndicationId: null,
                      tempoIndication: null,
                      comment: null,
                      commentForReview: null,
                    },
                  ],
                },
              ],
            },
          },
        ],
        metronomeMarks: [
          {
            id: "mm-1",
            beatUnit: NOTE_VALUE.HALF,
            bpm: 108,
            comment: "Half note = 108",
            sectionId: "sec-1",
          },
        ],
      };

      setSession({ id: "user-author", role: "EDITOR" });
      mockReviewFindFirst.mockResolvedValue(null);
      mockMMSourceFindUnique.mockResolvedValue(sourceWithEmptySections);
      mockOrganizationFindMany.mockResolvedValue([]);
      mockPersonFindMany.mockResolvedValue([]);
      mockCollectionFindMany.mockResolvedValue([]);

      const result = await getSourceEditBaseline("src-1");
      expect(result.baseline.metronomeMarks).toHaveLength(2);
      expect(result.initialState.metronomeMarks).toHaveLength(2);

      const baselineNoMM = result.baseline.metronomeMarks!.find(
        (m) => m.sectionId === "sec-2",
      );
      const initialNoMM = result.initialState.metronomeMarks!.find(
        (m) => m.sectionId === "sec-2",
      );

      expect(baselineNoMM?.noMM).toBe(true);
      expect(initialNoMM?.noMM).toBe(true);
    });
  });
});
