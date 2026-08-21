const mockGetServerSession = jest.fn();
jest.mock("next-auth", () => ({
  getServerSession: (...args: any[]) => mockGetServerSession(...args),
}));

const mockReviewFindUnique = jest.fn();
const mockMMSourceFindUnique = jest.fn();
const mockReviewedEntityFindMany = jest.fn();
const mockCollectionFindMany = jest.fn();
const mockPersonFindMany = jest.fn();
const mockOrganizationFindMany = jest.fn();

jest.mock("@/utils/server/db", () => ({
  db: {
    review: { findUnique: (...args: any[]) => mockReviewFindUnique(...args) },
    mMSource: { findUnique: (...args: any[]) => mockMMSourceFindUnique(...args) },
    reviewedEntity: {
      findMany: (...args: any[]) => mockReviewedEntityFindMany(...args),
    },
    collection: { findMany: (...args: any[]) => mockCollectionFindMany(...args) },
    person: { findMany: (...args: any[]) => mockPersonFindMany(...args) },
    organization: {
      findMany: (...args: any[]) => mockOrganizationFindMany(...args),
    },
  },
}));

import {
  getReviewBaseline,
  buildReviewInitialFeedFormState,
} from "@/utils/server/getReviewBaseline";
import {
  REVIEW_STATE,
  REVIEWED_ENTITY_TYPE,
  SOURCE_TYPE,
  CONTRIBUTION_ROLE,
  NOTE_VALUE,
  KEY,
  PIECE_CATEGORY,
  REFERENCE_TYPE,
} from "@/prisma/client/enums";
import { FeedFormState } from "@/types/feedFormTypes";
import { GloballyReviewedIds } from "@/types/zodTypes";

describe("getReviewBaseline", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function setSession(user: { id: string; role?: string } | null) {
    mockGetServerSession.mockResolvedValue(user ? { user } : null);
  }

  it("throws Unauthorized if session is missing", async () => {
    setSession(null);
    await expect(getReviewBaseline("rev-1")).rejects.toThrow(
      "[getReviewBaseline] Unauthorized",
    );
  });

  it("throws Forbidden if role is not REVIEWER or ADMIN", async () => {
    setSession({ id: "user-1", role: "USER" });
    await expect(getReviewBaseline("rev-1")).rejects.toThrow(
      "[getReviewBaseline] Forbidden: reviewer role required",
    );
  });

  it("throws if reviewId is empty", async () => {
    setSession({ id: "user-1", role: "REVIEWER" });
    await expect(getReviewBaseline("")).rejects.toThrow(
      "[getReviewBaseline] reviewId is required",
    );
  });

  it("throws if review not found", async () => {
    setSession({ id: "user-1", role: "REVIEWER" });
    mockReviewFindUnique.mockResolvedValue(null);
    await expect(getReviewBaseline("rev-1")).rejects.toThrow(
      "[getReviewBaseline] Review not found",
    );
  });

  it("throws Forbidden if user is not the review owner (even if ADMIN when requireOwner=true)", async () => {
    setSession({ id: "admin-1", role: "ADMIN" });
    mockReviewFindUnique.mockResolvedValue({
      id: "rev-1",
      creatorId: "user-reviewer",
      state: REVIEW_STATE.IN_REVIEW,
      mMSourceId: "src-1",
    });

    await expect(getReviewBaseline("rev-1")).rejects.toThrow(
      "[getReviewBaseline] Forbidden: only review owner can access this review baseline",
    );
  });

  it("allows non-owner if requireOwner is explicitly false", async () => {
    setSession({ id: "admin-1", role: "ADMIN" });
    mockReviewFindUnique.mockResolvedValue({
      id: "rev-1",
      creatorId: "user-reviewer",
      state: REVIEW_STATE.IN_REVIEW,
      mMSourceId: "src-1",
    });
    mockMMSourceFindUnique.mockResolvedValue({
      id: "src-1",
      title: "Test MM Source",
      type: SOURCE_TYPE.EDITION,
      link: "https://imslp.org/test",
      permalink: "https://imslp.org/test-perma",
      year: 1850,
      isYearEstimated: false,
      comment: "A test source",
      creator: { id: "creator-1", name: "Alice", email: "alice@example.com" },
      references: [],
      contributions: [],
      pieceVersions: [],
      metronomeMarks: [],
    });
    mockReviewedEntityFindMany.mockResolvedValue([]);

    const result = await getReviewBaseline("rev-1", { requireOwner: false });
    expect(result.review.id).toBe("rev-1");
    expect(result.mMSource.id).toBe("src-1");
  });

  it("throws if review state is not IN_REVIEW", async () => {
    setSession({ id: "user-1", role: "REVIEWER" });
    mockReviewFindUnique.mockResolvedValue({
      id: "rev-1",
      creatorId: "user-1",
      state: REVIEW_STATE.APPROVED,
      mMSourceId: "src-1",
    });

    await expect(getReviewBaseline("rev-1")).rejects.toThrow(
      "[getReviewBaseline] Review must be IN_REVIEW",
    );
  });

  it("throws if MMSource is not found", async () => {
    setSession({ id: "user-1", role: "REVIEWER" });
    mockReviewFindUnique.mockResolvedValue({
      id: "rev-1",
      creatorId: "user-1",
      state: REVIEW_STATE.IN_REVIEW,
      mMSourceId: "src-1",
    });
    mockMMSourceFindUnique.mockResolvedValue(null);

    await expect(getReviewBaseline("rev-1")).rejects.toThrow(
      "[getReviewBaseline] MM Source not found",
    );
  });

  it("loads full baseline graph correctly into FeedFormState shape", async () => {
    setSession({ id: "user-1", role: "REVIEWER" });
    mockReviewFindUnique.mockResolvedValue({
      id: "rev-1",
      creatorId: "user-1",
      state: REVIEW_STATE.IN_REVIEW,
      mMSourceId: "src-1",
    });

    const mockMMSource = {
      id: "src-1",
      title: "Sonata Op. 1",
      type: SOURCE_TYPE.EDITION,
      link: "https://imslp.org/wiki/Sonata_1",
      permalink: "https://imslp.org/wiki/Special:ReverseLookup/123",
      year: 1820,
      isYearEstimated: false,
      comment: "Urtext edition",
      creator: { id: "u-creator", name: "Bob", email: "bob@example.com" },
      references: [
        { id: "ref-1", type: REFERENCE_TYPE.PLATE_NUMBER, reference: "12345" },
      ],
      contributions: [
        {
          id: "cb-1",
          role: CONTRIBUTION_ROLE.EDITOR,
          personId: "person-editor",
          organizationId: null,
        },
        {
          id: "cb-2",
          role: CONTRIBUTION_ROLE.PUBLISHER,
          personId: null,
          organizationId: "org-publisher",
        },
      ],
      pieceVersions: [
        {
          id: "join-1",
          rank: 1,
          pieceVersionId: "pv-1",
          pieceVersion: {
            id: "pv-1",
            category: PIECE_CATEGORY.KEYBOARD,
            piece: {
              id: "piece-1",
              title: "Sonata No. 1",
              nickname: "The First",
              yearOfComposition: 1819,
              composerId: "person-composer",
              collectionId: "col-1",
              collectionRank: 1,
            },
            movements: [
              {
                id: "mov-1",
                rank: 1,
                key: KEY.C_MAJOR,
                isVariation: false,
                sections: [
                  {
                    id: "sec-1",
                    rank: 1,
                    metreNumerator: 4,
                    metreDenominator: 4,
                    isCommonTime: true,
                    isCutTime: false,
                    fastestStructuralNotesPerBar: 16,
                    fastestBelCantoNotesPerBar: null,
                    fastestStaccatoNotesPerBar: null,
                    fastestRepeatedNotesPerBar: null,
                    fastestOrnamentalNotesPerBar: null,
                    tempoIndicationId: "ti-1",
                    tempoIndication: { id: "ti-1", text: "Allegro" },
                    comment: "Opening theme",
                    commentForReview: "Check bar 10",
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
          beatUnit: NOTE_VALUE.QUARTER,
          bpm: 120,
          comment: "Quarter = 120",
          sectionId: "sec-1",
        },
      ],
    };

    mockMMSourceFindUnique.mockResolvedValue(mockMMSource);

    mockReviewedEntityFindMany.mockResolvedValue([
      { entityType: REVIEWED_ENTITY_TYPE.PERSON, entityId: "person-composer" },
      { entityType: REVIEWED_ENTITY_TYPE.PIECE, entityId: "piece-1" },
    ]);

    mockCollectionFindMany.mockResolvedValue([
      {
        id: "col-1",
        title: "Complete Sonatas",
        composerId: "person-composer",
        _count: { pieces: 3 },
      },
    ]);

    mockPersonFindMany.mockResolvedValue([
      {
        id: "person-composer",
        firstName: "Ludwig van",
        lastName: "Beethoven",
        birthYear: 1770,
        deathYear: 1827,
      },
      {
        id: "person-editor",
        firstName: "Carl",
        lastName: "Czerny",
        birthYear: 1791,
        deathYear: 1857,
      },
    ]);

    mockOrganizationFindMany.mockResolvedValue([
      { id: "org-publisher", name: "Breitkopf & Härtel" },
    ]);

    const result = await getReviewBaseline("rev-1");

    expect(result.review).toEqual({
      id: "rev-1",
      creatorId: "user-1",
      state: REVIEW_STATE.IN_REVIEW,
      mMSourceId: "src-1",
    });

    expect(result.mMSource.title).toBe("Sonata Op. 1");
    expect(result.mMSource.creator?.email).toBe("bob@example.com");

    // Globally reviewed IDs
    expect(result.globallyReviewed).toEqual({
      personIds: ["person-composer"],
      organizationIds: [],
      collectionIds: [],
      pieceIds: ["piece-1"],
      pieceVersionIds: [],
    });

    // Baseline FeedFormState (without formInfo)
    const { baseline } = result;
    expect(baseline.formInfo).toBeUndefined();
    expect(baseline.mMSourceDescription).toEqual({
      id: "src-1",
      title: "Sonata Op. 1",
      type: SOURCE_TYPE.EDITION,
      link: "https://imslp.org/wiki/Sonata_1",
      permalink: "https://imslp.org/wiki/Special:ReverseLookup/123",
      year: 1820,
      isYearEstimated: false,
      comment: "Urtext edition",
      references: [
        { id: "ref-1", type: REFERENCE_TYPE.PLATE_NUMBER, reference: "12345" },
      ],
    });

    expect(baseline.mMSourceContributions).toEqual([
      { id: "cb-1", role: CONTRIBUTION_ROLE.EDITOR, personId: "person-editor" },
      { id: "cb-2", role: CONTRIBUTION_ROLE.PUBLISHER, organizationId: "org-publisher" },
    ]);

    expect(baseline.mMSourceOnPieceVersions).toEqual([
      { pieceVersionId: "pv-1", rank: 1 },
    ]);

    expect(baseline.organizations).toEqual([
      { id: "org-publisher", name: "Breitkopf & Härtel" },
    ]);

    expect(baseline.collections).toEqual([
      {
        id: "col-1",
        title: "Complete Sonatas",
        composerId: "person-composer",
        pieceCount: 3,
      },
    ]);

    expect(baseline.persons).toHaveLength(2);
    expect(baseline.pieces).toHaveLength(1);
    expect(baseline.pieces![0]).toEqual({
      id: "piece-1",
      title: "Sonata No. 1",
      nickname: "The First",
      composerId: "person-composer",
      yearOfComposition: 1819,
      collectionId: "col-1",
      collectionRank: 1,
    });

    expect(baseline.pieceVersions).toHaveLength(1);
    expect(baseline.pieceVersions![0].movements).toHaveLength(1);
    expect(baseline.pieceVersions![0].movements[0].sections).toHaveLength(1);
    expect(baseline.pieceVersions![0].movements[0].sections[0].tempoIndicationId).toBe("ti-1");

    expect(baseline.tempoIndications).toEqual([
      { id: "ti-1", text: "Allegro" },
    ]);

    expect(baseline.metronomeMarks).toEqual([
      {
        id: "mm-1",
        sectionId: "sec-1",
        beatUnit: NOTE_VALUE.QUARTER,
        bpm: 120,
        comment: "Quarter = 120",
        pieceVersionId: "pv-1",
        noMM: false,
      },
    ]);
  });

  it("handles noMM metronome marks correctly", async () => {
    setSession({ id: "user-1", role: "REVIEWER" });
    mockReviewFindUnique.mockResolvedValue({
      id: "rev-1",
      creatorId: "user-1",
      state: REVIEW_STATE.IN_REVIEW,
      mMSourceId: "src-1",
    });

    mockMMSourceFindUnique.mockResolvedValue({
      id: "src-1",
      title: "Source No MM",
      type: SOURCE_TYPE.MANUSCRIPT,
      link: null,
      permalink: null,
      year: null,
      isYearEstimated: false,
      comment: null,
      creator: null,
      references: [],
      contributions: [],
      pieceVersions: [
        {
          id: "join-1",
          rank: 1,
          pieceVersionId: "pv-1",
          pieceVersion: {
            id: "pv-1",
            category: PIECE_CATEGORY.KEYBOARD,
            piece: {
              id: "p-1",
              title: "Piece",
              nickname: null,
              yearOfComposition: null,
              composerId: "c-1",
              collectionId: null,
              collectionRank: null,
            },
            movements: [
              {
                id: "mov-1",
                rank: 1,
                key: null,
                isVariation: false,
                sections: [
                  {
                    id: "sec-1",
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
          id: "mm-null-unit",
          beatUnit: null,
          bpm: null,
          comment: null,
          sectionId: "sec-1",
        },
      ],
    });

    mockReviewedEntityFindMany.mockResolvedValue([]);
    mockPersonFindMany.mockResolvedValue([]);

    const result = await getReviewBaseline("rev-1");
    expect(result.baseline.metronomeMarks).toEqual([
      {
        id: "mm-null-unit",
        sectionId: "sec-1",
        pieceVersionId: "pv-1",
        noMM: true,
      },
    ]);
  });
});

describe("buildReviewInitialFeedFormState", () => {
  it("sets isNew flags properly according to globallyReviewed and initializes formInfo", () => {
    const baseline: FeedFormState = {
      mMSourceDescription: {
        id: "src-1",
        title: "Test Source",
        type: SOURCE_TYPE.EDITION,
        link: "https://example.com",
        isYearEstimated: false,
        references: [],
      },
      mMSourceContributions: [],
      mMSourceOnPieceVersions: [{ pieceVersionId: "pv-1", rank: 1 }],
      persons: [
        {
          id: "person-1",
          firstName: "Ludwig",
          lastName: "Beethoven",
          birthYear: 1770,
          deathYear: 1827,
        },
        {
          id: "person-new",
          firstName: "Unknown",
          lastName: "Composer",
          birthYear: 1800,
          deathYear: null,
        },
      ],
      organizations: [
        { id: "org-reviewed", name: "Reviewed Publisher" },
        { id: "org-new", name: "New Publisher" },
      ],
      collections: [
        {
          id: "col-reviewed",
          title: "Reviewed Collection",
          composerId: "person-1",
          pieceCount: 5,
        },
        {
          id: "col-new",
          title: "New Collection",
          composerId: "person-new",
          pieceCount: 1,
        },
      ],
      pieces: [
        {
          id: "piece-reviewed",
          title: "Reviewed Piece",
          composerId: "person-1",
          collectionId: null,
          collectionRank: null,
          nickname: null,
          yearOfComposition: null,
        },
        {
          id: "piece-new",
          title: "New Piece",
          composerId: "person-new",
          collectionId: null,
          collectionRank: null,
          nickname: null,
          yearOfComposition: null,
        },
      ],
      pieceVersions: [
        {
          id: "pv-reviewed",
          pieceId: "piece-reviewed",
          category: PIECE_CATEGORY.KEYBOARD,
          movements: [],
        },
        {
          id: "pv-new",
          pieceId: "piece-new",
          category: PIECE_CATEGORY.KEYBOARD,
          movements: [],
        },
      ],
      tempoIndications: [{ id: "ti-1", text: "Allegro" }],
      metronomeMarks: [],
    };

    const globallyReviewed: GloballyReviewedIds = {
      personIds: ["person-1"],
      organizationIds: ["org-reviewed"],
      collectionIds: ["col-reviewed"],
      pieceIds: ["piece-reviewed"],
      pieceVersionIds: ["pv-reviewed"],
    };

    const initial = buildReviewInitialFeedFormState({
      baseline,
      globallyReviewed,
    });

    expect(initial.formInfo).toEqual({
      currentStepRank: 0,
      introDone: false,
      allSourceOnPieceVersionsDone: true,
    });

    expect(initial.persons).toEqual([
      expect.objectContaining({ id: "person-1", isNew: false }),
      expect.objectContaining({ id: "person-new", isNew: true }),
    ]);

    expect(initial.organizations).toEqual([
      expect.objectContaining({ id: "org-reviewed", isNew: false }),
      expect.objectContaining({ id: "org-new", isNew: true }),
    ]);

    expect(initial.collections).toEqual([
      expect.objectContaining({ id: "col-reviewed", isNew: false }),
      expect.objectContaining({ id: "col-new", isNew: true }),
    ]);

    expect(initial.pieces).toEqual([
      expect.objectContaining({ id: "piece-reviewed", isNew: false }),
      expect.objectContaining({ id: "piece-new", isNew: true }),
    ]);

    expect(initial.pieceVersions).toEqual([
      expect.objectContaining({ id: "pv-reviewed", isNew: false }),
      expect.objectContaining({ id: "pv-new", isNew: true }),
    ]);
  });
});
