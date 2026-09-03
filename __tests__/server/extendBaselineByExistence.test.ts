const mockPersonFindMany = jest.fn();
const mockOrganizationFindMany = jest.fn();
const mockCollectionFindMany = jest.fn();
const mockPieceFindMany = jest.fn();
const mockPieceVersionFindMany = jest.fn();
const mockTempoIndicationFindMany = jest.fn();
const mockReferenceFindMany = jest.fn();
const mockContributionFindMany = jest.fn();
const mockMetronomeMarkFindMany = jest.fn();

jest.mock("@/utils/server/db", () => ({
  db: {
    person: { findMany: (...args: any[]) => mockPersonFindMany(...args) },
    organization: {
      findMany: (...args: any[]) => mockOrganizationFindMany(...args),
    },
    collection: { findMany: (...args: any[]) => mockCollectionFindMany(...args) },
    piece: { findMany: (...args: any[]) => mockPieceFindMany(...args) },
    pieceVersion: {
      findMany: (...args: any[]) => mockPieceVersionFindMany(...args),
    },
    tempoIndication: {
      findMany: (...args: any[]) => mockTempoIndicationFindMany(...args),
    },
    reference: { findMany: (...args: any[]) => mockReferenceFindMany(...args) },
    contribution: {
      findMany: (...args: any[]) => mockContributionFindMany(...args),
    },
    metronomeMark: {
      findMany: (...args: any[]) => mockMetronomeMarkFindMany(...args),
    },
  },
}));

import { extendBaselineByExistence } from "@/utils/server/extendBaselineByExistence";
import { FeedFormState } from "@/types/feedFormTypes";
import {
  CONTRIBUTION_ROLE,
  KEY,
  NOTE_VALUE,
  PIECE_CATEGORY,
  REFERENCE_TYPE,
  SOURCE_TYPE,
} from "@/prisma/client/enums";

describe("extendBaselineByExistence", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const emptyBaseline: FeedFormState = {
    mMSourceDescription: {
      id: "src-1",
      title: "Base Source",
      type: SOURCE_TYPE.EDITION,
      link: "http://example.com",
      isYearEstimated: false,
      references: [{ id: "ref-base", type: REFERENCE_TYPE.ISBN, reference: "http://ref-base" }],
    },
    mMSourceContributions: [
      { id: "cb-base", role: CONTRIBUTION_ROLE.EDITOR, personId: "p-base" },
    ],
    mMSourceOnPieceVersions: [{ pieceVersionId: "pv-base", rank: 1 }],
    organizations: [{ id: "org-base", name: "Base Org" }],
    collections: [
      { id: "col-base", title: "Base Col", composerId: "p-base", pieceCount: 1 },
    ],
    persons: [
      {
        id: "p-base",
        firstName: "Base",
        lastName: "Person",
        birthYear: 1800,
        deathYear: null,
      },
    ],
    pieces: [
      {
        id: "piece-base",
        title: "Base Piece",
        nickname: null,
        composerId: "p-base",
        yearOfComposition: 1820,
        collectionId: null,
        collectionRank: null,
      },
    ],
    pieceVersions: [
      {
        id: "pv-base",
        pieceId: "piece-base",
        category: PIECE_CATEGORY.KEYBOARD,
        movements: [
          {
            id: "mov-base",
            rank: 1,
            key: KEY.C_MAJOR,
            isVariation: false,
            sections: [
              {
                id: "sec-base",
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
                tempoIndicationId: "ti-base",
                comment: null,
                commentForReview: null,
              },
            ],
          },
        ],
      },
    ],
    tempoIndications: [{ id: "ti-base", text: "Allegro" }],
    metronomeMarks: [
      {
        id: "mm-base",
        sectionId: "sec-base",
        beatUnit: NOTE_VALUE.QUARTER,
        bpm: 120,
        comment: null,
        pieceVersionId: "pv-base",
        noMM: false,
      },
    ],
  };

  it("does not emit any queries if submittedState has no missing IDs", async () => {
    // submittedState contains only items already in baseline
    const submittedState: FeedFormState = {
      ...emptyBaseline,
    };

    const extended = await extendBaselineByExistence(emptyBaseline, submittedState);

    expect(mockPersonFindMany).not.toHaveBeenCalled();
    expect(mockOrganizationFindMany).not.toHaveBeenCalled();
    expect(mockCollectionFindMany).not.toHaveBeenCalled();
    expect(mockPieceFindMany).not.toHaveBeenCalled();
    expect(mockPieceVersionFindMany).not.toHaveBeenCalled();
    expect(mockTempoIndicationFindMany).not.toHaveBeenCalled();
    expect(mockReferenceFindMany).not.toHaveBeenCalled();
    expect(mockContributionFindMany).not.toHaveBeenCalled();
    expect(mockMetronomeMarkFindMany).not.toHaveBeenCalled();

    expect(extended.persons).toHaveLength(1);
    expect(extended.organizations).toHaveLength(1);
  });

  it("fetches missing entities from DB and adds them to the baseline", async () => {
    const submittedState: FeedFormState = {
      mMSourceDescription: {
        id: "src-1",
        title: "Base Source",
        type: SOURCE_TYPE.EDITION,
        link: "http://example.com",
        isYearEstimated: false,
        references: [
          { id: "ref-base", type: REFERENCE_TYPE.ISBN, reference: "http://ref-base" },
          { id: "ref-extra", type: REFERENCE_TYPE.PLATE_NUMBER, reference: "http://ref-extra" },
        ],
      },
      mMSourceContributions: [
        { id: "cb-base", role: CONTRIBUTION_ROLE.EDITOR, personId: "p-base" },
        { id: "cb-extra-p", role: CONTRIBUTION_ROLE.ARRANGER, personId: "p-extra" },
        { id: "cb-extra-org", role: CONTRIBUTION_ROLE.PUBLISHER, organizationId: "org-extra" },
      ],
      mMSourceOnPieceVersions: [
        { pieceVersionId: "pv-base", rank: 1 },
        { pieceVersionId: "pv-extra", rank: 2 },
      ],
      organizations: [
        { id: "org-base", name: "Base Org" },
        { id: "org-extra", name: "Extra Org" },
      ],
      collections: [
        { id: "col-base", title: "Base Col", composerId: "p-base", pieceCount: 1 },
        { id: "col-extra", title: "Extra Col", composerId: "p-extra", pieceCount: 3 },
      ],
      persons: [
        {
          id: "p-base",
          firstName: "Base",
          lastName: "Person",
          birthYear: 1800,
          deathYear: null,
        },
        {
          id: "p-extra",
          firstName: "Extra",
          lastName: "Composer",
          birthYear: 1810,
          deathYear: 1870,
        },
      ],
      pieces: [
        {
          id: "piece-base",
          title: "Base Piece",
          nickname: null,
          composerId: "p-base",
          yearOfComposition: 1820,
          collectionId: null,
          collectionRank: null,
        },
        {
          id: "piece-extra",
          title: "Extra Piece",
          nickname: "Extra Nick",
          composerId: "p-extra",
          yearOfComposition: 1835,
          collectionId: "col-extra",
          collectionRank: 1,
        },
      ],
      pieceVersions: [
        {
          id: "pv-base",
          pieceId: "piece-base",
          category: PIECE_CATEGORY.KEYBOARD,
          movements: [],
        },
        {
          id: "pv-extra",
          pieceId: "piece-extra",
          category: PIECE_CATEGORY.KEYBOARD,
          movements: [],
        },
      ],
      tempoIndications: [
        { id: "ti-base", text: "Allegro" },
        { id: "ti-extra", text: "Andante" },
      ],
      metronomeMarks: [
        {
          id: "mm-base",
          sectionId: "sec-base",
          beatUnit: NOTE_VALUE.QUARTER,
          bpm: 120,
          comment: null,
          pieceVersionId: "pv-base",
          noMM: false,
        },
        {
          id: "mm-extra",
          sectionId: "sec-extra",
          beatUnit: NOTE_VALUE.HALF,
          bpm: 60,
          comment: "Half = 60",
          pieceVersionId: "pv-extra",
          noMM: false,
        },
      ],
    };

    // DB responses for missing IDs
    mockPersonFindMany.mockResolvedValue([
      {
        id: "p-extra",
        firstName: "Extra (DB)",
        lastName: "Composer (DB)",
        birthYear: 1810,
        deathYear: 1870,
      },
    ]);

    mockOrganizationFindMany.mockResolvedValue([
      { id: "org-extra", name: "Extra Org (DB)" },
    ]);

    mockCollectionFindMany.mockResolvedValue([
      {
        id: "col-extra",
        title: "Extra Col (DB)",
        composerId: "p-extra",
        _count: { pieces: 3 },
      },
    ]);

    mockPieceFindMany.mockResolvedValue([
      {
        id: "piece-extra",
        title: "Extra Piece (DB)",
        nickname: "Extra Nick (DB)",
        composerId: "p-extra",
        yearOfComposition: 1835,
        collectionId: "col-extra",
        collectionRank: 1,
      },
    ]);

    mockPieceVersionFindMany.mockResolvedValue([
      {
        id: "pv-extra",
        category: PIECE_CATEGORY.KEYBOARD,
        pieceId: "piece-extra",
        movements: [
          {
            id: "mov-extra",
            rank: 1,
            key: KEY.D_MINOR,
            isVariation: false,
            sections: [
              {
                id: "sec-extra",
                rank: 1,
                metreNumerator: 3,
                metreDenominator: 4,
                isCommonTime: false,
                isCutTime: false,
                fastestStructuralNotesPerBar: 8,
                fastestBelCantoNotesPerBar: null,
                fastestStaccatoNotesPerBar: null,
                fastestRepeatedNotesPerBar: null,
                fastestOrnamentalNotesPerBar: null,
                tempoIndicationId: "ti-extra",
                comment: "Section comment",
                commentForReview: "Section rev comment",
              },
            ],
          },
        ],
      },
    ]);

    mockTempoIndicationFindMany.mockResolvedValue([
      { id: "ti-extra", text: "Andante (DB)" },
    ]);

    mockReferenceFindMany.mockResolvedValue([
      { id: "ref-extra", type: REFERENCE_TYPE.PLATE_NUMBER, reference: "http://ref-extra" },
    ]);

    mockContributionFindMany.mockResolvedValue([
      { id: "cb-extra-p", role: CONTRIBUTION_ROLE.ARRANGER, personId: "p-extra", organizationId: null },
      { id: "cb-extra-org", role: CONTRIBUTION_ROLE.PUBLISHER, personId: null, organizationId: "org-extra" },
    ]);

    mockMetronomeMarkFindMany.mockResolvedValue([
      {
        id: "mm-extra",
        beatUnit: NOTE_VALUE.HALF,
        bpm: 60,
        comment: "Half = 60",
        sectionId: "sec-extra",
        section: { movement: { pieceVersionId: "pv-extra" } },
      },
    ]);

    const extended = await extendBaselineByExistence(emptyBaseline, submittedState);

    // Verify exactly one findMany call per entity type
    expect(mockPersonFindMany).toHaveBeenCalledWith({
      where: { id: { in: ["p-extra"] } },
      select: expect.any(Object),
    });
    expect(mockOrganizationFindMany).toHaveBeenCalledWith({
      where: { id: { in: ["org-extra"] } },
      select: expect.any(Object),
    });
    expect(mockCollectionFindMany).toHaveBeenCalledWith({
      where: { id: { in: ["col-extra"] } },
      select: expect.any(Object),
    });
    expect(mockPieceFindMany).toHaveBeenCalledWith({
      where: { id: { in: ["piece-extra"] } },
      select: expect.any(Object),
    });
    expect(mockPieceVersionFindMany).toHaveBeenCalledWith({
      where: { id: { in: ["pv-extra"] } },
      select: expect.any(Object),
    });
    expect(mockTempoIndicationFindMany).toHaveBeenCalledWith({
      where: { id: { in: ["ti-extra"] } },
      select: expect.any(Object),
    });
    expect(mockReferenceFindMany).toHaveBeenCalledWith({
      where: { id: { in: ["ref-extra"] } },
      select: expect.any(Object),
    });
    expect(mockContributionFindMany).toHaveBeenCalledWith({
      where: { id: { in: ["cb-extra-p", "cb-extra-org"] } },
      select: expect.any(Object),
    });
    expect(mockMetronomeMarkFindMany).toHaveBeenCalledWith({
      where: { id: { in: ["mm-extra"] } },
      select: expect.any(Object),
    });

    // Verify extended baseline contents
    expect(extended.persons).toHaveLength(2);
    expect(extended.persons).toContainEqual({
      id: "p-extra",
      firstName: "Extra (DB)",
      lastName: "Composer (DB)",
      birthYear: 1810,
      deathYear: 1870,
    });

    expect(extended.organizations).toContainEqual({
      id: "org-extra",
      name: "Extra Org (DB)",
    });

    expect(extended.collections).toContainEqual({
      id: "col-extra",
      title: "Extra Col (DB)",
      composerId: "p-extra",
      pieceCount: 3,
    });

    expect(extended.pieces).toContainEqual({
      id: "piece-extra",
      title: "Extra Piece (DB)",
      nickname: "Extra Nick (DB)",
      composerId: "p-extra",
      yearOfComposition: 1835,
      collectionId: "col-extra",
      collectionRank: 1,
    });

    expect(extended.pieceVersions).toHaveLength(2);
    expect(extended.pieceVersions![1]).toEqual({
      id: "pv-extra",
      pieceId: "piece-extra",
      category: PIECE_CATEGORY.KEYBOARD,
      movements: [
        {
          id: "mov-extra",
          rank: 1,
          key: KEY.D_MINOR,
          isVariation: false,
          sections: [
            {
              id: "sec-extra",
              rank: 1,
              metreNumerator: 3,
              metreDenominator: 4,
              isCommonTime: false,
              isCutTime: false,
              fastestStructuralNotesPerBar: 8,
              fastestBelCantoNotesPerBar: null,
              fastestStaccatoNotesPerBar: null,
              fastestRepeatedNotesPerBar: null,
              fastestOrnamentalNotesPerBar: null,
              tempoIndicationId: "ti-extra",
              comment: "Section comment",
              commentForReview: "Section rev comment",
            },
          ],
        },
      ],
    });

    expect(extended.tempoIndications).toContainEqual({
      id: "ti-extra",
      text: "Andante (DB)",
    });

    expect(extended.mMSourceDescription?.references).toContainEqual({
      id: "ref-extra",
      type: REFERENCE_TYPE.PLATE_NUMBER,
      reference: "http://ref-extra",
    });

    expect(extended.mMSourceContributions).toContainEqual({
      id: "cb-extra-p",
      role: CONTRIBUTION_ROLE.ARRANGER,
      personId: "p-extra",
    });
    expect(extended.mMSourceContributions).toContainEqual({
      id: "cb-extra-org",
      role: CONTRIBUTION_ROLE.PUBLISHER,
      organizationId: "org-extra",
    });

    expect(extended.metronomeMarks).toContainEqual({
      id: "mm-extra",
      sectionId: "sec-extra",
      beatUnit: NOTE_VALUE.HALF,
      bpm: 60,
      comment: "Half = 60",
      pieceVersionId: "pv-extra",
      noMM: false,
    });
  });

  it("leaves non-existent IDs absent from baseline when not returned by DB", async () => {
    const submittedState: FeedFormState = {
      persons: [
        {
          id: "p-brand-new",
          firstName: "Brand",
          lastName: "New",
          birthYear: 1990,
          deathYear: null,
        },
      ],
    };

    // DB returns empty array (id does not exist in DB)
    mockPersonFindMany.mockResolvedValue([]);

    const extended = await extendBaselineByExistence(emptyBaseline, submittedState);

    expect(mockPersonFindMany).toHaveBeenCalledWith({
      where: { id: { in: ["p-brand-new"] } },
      select: expect.any(Object),
    });

    // p-brand-new is NOT added to extended.persons
    expect(extended.persons).toHaveLength(1);
    expect(extended.persons![0].id).toBe("p-base");
  });

  it("supports a custom prisma transaction client parameter", async () => {
    const customTx = {
      person: { findMany: jest.fn().mockResolvedValue([]) },
      organization: { findMany: jest.fn() },
      collection: { findMany: jest.fn() },
      piece: { findMany: jest.fn() },
      pieceVersion: { findMany: jest.fn() },
      tempoIndication: { findMany: jest.fn() },
      reference: { findMany: jest.fn() },
      contribution: { findMany: jest.fn() },
      metronomeMark: { findMany: jest.fn() },
    };

    const submittedState: FeedFormState = {
      persons: [
        {
          id: "p-tx-check",
          firstName: "Tx",
          lastName: "Check",
          birthYear: 1900,
          deathYear: null,
        },
      ],
    };

    await extendBaselineByExistence(emptyBaseline, submittedState, customTx as any);

    expect(customTx.person.findMany).toHaveBeenCalled();
    expect(mockPersonFindMany).not.toHaveBeenCalled();
  });
});
