import { commitCollectionPieceVersionsFormToFeedForm } from "@/utils/commitCollectionPieceVersionsFormToFeedForm";
import { CollectionPieceVersionsFormState } from "@/types/collectionPieceVersionFormTypes";
import { FeedFormState } from "@/types/feedFormTypes";
import {
  MMSourceOnPieceVersionsState,
  PersonState,
  PieceState,
  PieceVersionState,
  SectionState,
  TempoIndicationState,
} from "@/types/formTypes";
import { KEY } from "@/prisma/client";
import { PIECE_CATEGORY } from "@/prisma/client/enums";

describe("commitCollectionPieceVersionsFormToFeedForm", () => {
  const composer: PersonState = {
    id: "composer-1",
    firstName: "Ludwig van",
    lastName: "Beethoven",
    birthYear: 1770,
    deathYear: 1827,
  };

  const collection = {
    id: "collection-1",
    composerId: composer.id,
    title: "Symphonies",
    isNew: true,
  };

  const tempo: TempoIndicationState = {
    id: "tempo-1",
    text: "Allegro",
  };

  const buildSection = (
    id: string,
    rank: number,
    tempoIndication: TempoIndicationState,
  ): SectionState => ({
    id,
    rank,
    metreNumerator: 4,
    metreDenominator: 4,
    isCommonTime: true,
    isCutTime: false,
    comment: "",
    commentForReview: "",
    fastestStructuralNotesPerBar: 0,
    fastestStaccatoNotesPerBar: 0,
    fastestRepeatedNotesPerBar: 0,
    fastestOrnamentalNotesPerBar: 0,
    isFastestStructuralNoteBelCanto: false,
    tempoIndication,
  });

  const piece1: PieceState = {
    id: "piece-1",
    title: "Symphony No. 1",
    composerId: composer.id,
  };

  const piece2: PieceState = {
    id: "piece-2",
    title: "Symphony No. 2",
    composerId: composer.id,
  };

  const pieceVersion1: PieceVersionState = {
    id: "pv-1",
    pieceId: piece1.id,
    category: PIECE_CATEGORY.OTHER,
    movements: [
      {
        id: "mov-1",
        rank: 1,
        key: KEY.C_MAJOR,
        sections: [buildSection("sec-1", 1, tempo)],
      },
    ],
  };

  const pieceVersion2: PieceVersionState = {
    id: "pv-2",
    pieceId: piece2.id,
    category: PIECE_CATEGORY.OTHER,
    movements: [
      {
        id: "mov-2",
        rank: 1,
        key: KEY.D_MAJOR,
        sections: [buildSection("sec-2", 1, tempo)],
      },
    ],
  };

  let feedFormDispatch: jest.Mock;

  beforeEach(() => {
    feedFormDispatch = jest.fn();
    jest.clearAllMocks();
    console.error = jest.fn();
  });

  it("should return false and not dispatch when collection is incomplete", () => {
    const state: CollectionPieceVersionsFormState = {
      formInfo: { currentStepRank: 0 },
      collection: { composerId: composer.id },
      pieces: [piece1],
      pieceVersions: [pieceVersion1],
    };

    const result = commitCollectionPieceVersionsFormToFeedForm({
      collectionPieceVersionFormState: state,
      sourceOnPieceVersions: [{ pieceVersionId: pieceVersion1.id, rank: 1 }],
      feedFormState: {},
      feedFormDispatch,
    });

    expect(result).toBe(false);
    expect(feedFormDispatch).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });

  it("should return false and not dispatch when sourceOnPieceVersions references unknown local entities", () => {
    const state: CollectionPieceVersionsFormState = {
      formInfo: { currentStepRank: 0 },
      collection,
      pieces: [piece1],
      pieceVersions: [pieceVersion1],
    };

    const result = commitCollectionPieceVersionsFormToFeedForm({
      collectionPieceVersionFormState: state,
      sourceOnPieceVersions: [{ pieceVersionId: "missing-pv", rank: 1 }],
      feedFormState: {},
      feedFormDispatch,
    });

    expect(result).toBe(false);
    expect(feedFormDispatch).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });

  it("should dispatch all local entities and append ranks in create mode", () => {
    const sourceOnPieceVersions: MMSourceOnPieceVersionsState[] = [
      { pieceVersionId: pieceVersion2.id, rank: 2 },
      { pieceVersionId: pieceVersion1.id, rank: 1 },
    ];

    const state: CollectionPieceVersionsFormState = {
      formInfo: { currentStepRank: 2 },
      collection,
      persons: [composer],
      pieces: [piece1, piece2],
      pieceVersions: [pieceVersion1, pieceVersion2],
      tempoIndications: [tempo],
      mMSourceOnPieceVersions: sourceOnPieceVersions,
    };

    const feedFormState: FeedFormState = {
      mMSourceOnPieceVersions: [
        { pieceVersionId: "existing-pv-1", rank: 1 },
        { pieceVersionId: "existing-pv-2", rank: 2 },
      ],
    };

    const result = commitCollectionPieceVersionsFormToFeedForm({
      collectionPieceVersionFormState: state,
      sourceOnPieceVersions,
      feedFormState,
      feedFormDispatch,
    });

    expect(result).toBe(true);

    expect(feedFormDispatch).toHaveBeenCalledWith({
      type: "persons",
      payload: { array: [composer] },
    });

    expect(feedFormDispatch).toHaveBeenCalledWith({
      type: "collections",
      payload: {
        array: [
          {
            ...collection,
            pieceCount: 2,
          },
        ],
      },
    });

    expect(feedFormDispatch).toHaveBeenCalledWith({
      type: "pieces",
      payload: {
        array: [
          {
            ...piece1,
            collectionId: collection.id,
            collectionRank: 1,
          },
          {
            ...piece2,
            collectionId: collection.id,
            collectionRank: 2,
          },
        ],
      },
    });

    expect(feedFormDispatch).toHaveBeenCalledWith({
      type: "pieceVersions",
      payload: {
        array: [pieceVersion1, pieceVersion2],
      },
    });

    expect(feedFormDispatch).toHaveBeenCalledWith({
      type: "tempoIndications",
      payload: {
        array: [tempo],
      },
    });

    expect(feedFormDispatch).toHaveBeenCalledWith({
      type: "mMSourceOnPieceVersions",
      payload: {
        array: [
          { pieceVersionId: pieceVersion1.id, rank: 3 },
          { pieceVersionId: pieceVersion2.id, rank: 4 },
        ],
        isCollectionUpdate: false,
      },
    });
  });

  it("should dispatch collection update payload with preserved starting rank in update mode", () => {
    const sourceOnPieceVersions: MMSourceOnPieceVersionsState[] = [
      { pieceVersionId: pieceVersion1.id, rank: 1 },
      { pieceVersionId: pieceVersion2.id, rank: 2 },
    ];

    const state: CollectionPieceVersionsFormState = {
      formInfo: {
        currentStepRank: 2,
        collectionFirstMMSourceOnPieceVersionRank: 5,
      },
      collection,
      pieces: [piece1, piece2],
      pieceVersions: [pieceVersion1, pieceVersion2],
      mMSourceOnPieceVersions: sourceOnPieceVersions,
    };

    const result = commitCollectionPieceVersionsFormToFeedForm({
      collectionPieceVersionFormState: state,
      sourceOnPieceVersions,
      feedFormState: {
        mMSourceOnPieceVersions: [
          { pieceVersionId: "existing-pv", rank: 1 },
          { pieceVersionId: "existing-pv-2", rank: 2 },
        ],
      },
      feedFormDispatch,
    });

    expect(result).toBe(true);
    expect(feedFormDispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: "persons" }),
    );
    expect(feedFormDispatch).toHaveBeenCalledWith({
      type: "mMSourceOnPieceVersions",
      payload: {
        array: [
          { pieceVersionId: pieceVersion1.id, rank: 5 },
          { pieceVersionId: pieceVersion2.id, rank: 6 },
        ],
        isCollectionUpdate: true,
      },
    });
  });
});
