import { commitSinglePieceVersionFormToFeedForm } from "@/utils/commitSinglePieceVersionFormToFeedForm";
import { SinglePieceVersionFormState } from "@/types/singlePieceVersionFormTypes";
import { FeedFormState } from "@/types/feedFormTypes";
import { CollectionPieceVersionsFormState } from "@/types/collectionPieceVersionFormTypes";
import {
  PersonState,
  PieceState,
  PieceVersionState,
  TempoIndicationState,
} from "@/types/formTypes";
import { PIECE_CATEGORY } from "@/prisma/client/enums";
import { KEY } from "@/prisma/client";

describe("commitSinglePieceVersionFormToFeedForm", () => {
  const mockComposer: PersonState = {
    id: "composer-id",
    firstName: "Ludwig van",
    lastName: "Beethoven",
    birthYear: 1770,
    deathYear: 1827,
  };

  const mockPiece: PieceState = {
    id: "piece-id",
    title: "Symphony No. 5",
    composerId: "composer-id",
    nickname: "Fate",
    yearOfComposition: 1808,
  };

  const mockTempoIndication: TempoIndicationState = {
    id: "tempo-id",
    text: "Allegro con brio",
  };

  const mockPieceVersion: PieceVersionState = {
    id: "pv-id",
    pieceId: "piece-id",
    category: PIECE_CATEGORY.OTHER,
    movements: [
      {
        id: "mov-id",
        key: KEY.A_MINOR,
        rank: 1,
        sections: [
          {
            id: "sec-id",
            rank: 1,
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
            tempoIndication: mockTempoIndication,
          },
        ],
      },
    ],
  };

  const mockSinglePieceVersionFormState: SinglePieceVersionFormState = {
    formInfo: { currentStepRank: 1 },
    composer: mockComposer,
    piece: mockPiece,
    pieceVersion: mockPieceVersion,
  };

  const mockFeedFormState: FeedFormState = {
    mMSourceOnPieceVersions: [],
  };

  let feedFormDispatch: jest.Mock;

  beforeEach(() => {
    feedFormDispatch = jest.fn();
    jest.clearAllMocks();
    console.error = jest.fn(); // Suppress console.error in tests
  });

  it("should not dispatch anything if required entities are missing", () => {
    commitSinglePieceVersionFormToFeedForm({
      singlePieceVersionFormState: {
        ...mockSinglePieceVersionFormState,
        composer: undefined,
      },
      feedFormState: mockFeedFormState,
      feedFormDispatch,
      isUpdateMode: false,
    });

    expect(feedFormDispatch).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });

  it("should dispatch all entities and update mMSourceOnPieceVersions in standard mode", () => {
    commitSinglePieceVersionFormToFeedForm({
      singlePieceVersionFormState: mockSinglePieceVersionFormState,
      feedFormState: mockFeedFormState,
      feedFormDispatch,
      isUpdateMode: false,
    });

    // 1. persons
    expect(feedFormDispatch).toHaveBeenCalledWith({
      type: "persons",
      payload: { array: [mockComposer] },
    });

    // 2. pieces
    expect(feedFormDispatch).toHaveBeenCalledWith({
      type: "pieces",
      payload: { array: [mockPiece] },
    });

    // 3. pieceVersions
    expect(feedFormDispatch).toHaveBeenCalledWith({
      type: "pieceVersions",
      payload: { array: [mockPieceVersion] },
    });

    // 4. tempoIndications
    expect(feedFormDispatch).toHaveBeenCalledWith({
      type: "tempoIndications",
      payload: { array: [mockTempoIndication] },
    });

    // 5. mMSourceOnPieceVersions (Rank 1 because feedFormState is empty)
    expect(feedFormDispatch).toHaveBeenCalledWith({
      type: "mMSourceOnPieceVersions",
      payload: {
        idKey: "rank",
        array: [{ pieceVersionId: "pv-id", rank: 1 }],
      },
    });
  });

  it("should use the provided rank in update mode", () => {
    const stateWithRank: SinglePieceVersionFormState = {
      ...mockSinglePieceVersionFormState,
      formInfo: {
        ...mockSinglePieceVersionFormState.formInfo,
        mMSourceOnPieceVersionRank: 5,
      },
    };

    commitSinglePieceVersionFormToFeedForm({
      singlePieceVersionFormState: stateWithRank,
      feedFormState: mockFeedFormState,
      feedFormDispatch,
      isUpdateMode: true,
    });

    expect(feedFormDispatch).toHaveBeenCalledWith({
      type: "mMSourceOnPieceVersions",
      payload: {
        idKey: "rank",
        array: [{ pieceVersionId: "pv-id", rank: 5 }],
      },
    });
  });

  it("should calculate the next rank based on collectionFormState in collection mode", () => {
    const mockCollectionFormState: CollectionPieceVersionsFormState = {
      formInfo: { currentStepRank: 1 },
      mMSourceOnPieceVersions: [{ pieceVersionId: "existing-pv", rank: 1 }],
    };

    commitSinglePieceVersionFormToFeedForm({
      singlePieceVersionFormState: mockSinglePieceVersionFormState,
      feedFormState: mockFeedFormState,
      feedFormDispatch,
      isUpdateMode: false,
      isCollectionMode: true,
      collectionFormState: mockCollectionFormState,
    });

    expect(feedFormDispatch).toHaveBeenCalledWith({
      type: "mMSourceOnPieceVersions",
      payload: {
        idKey: "rank",
        array: [{ pieceVersionId: "pv-id", rank: 2 }],
      },
    });
  });

  it("should correctly extract unique tempo indications from movements and sections", () => {
    const ti1: TempoIndicationState = { id: "ti-1", text: "Allegro" };
    const ti2: TempoIndicationState = { id: "ti-2", text: "Andante" };

    const complexPieceVersion: PieceVersionState = {
      ...mockPieceVersion,
      movements: [
        {
          id: "m1",
          key: KEY.A_MINOR,
          rank: 1,
          sections: [
            {
              id: "s1",
              rank: 1,
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
              tempoIndication: ti1,
            },
            {
              id: "s2",
              rank: 2,
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
              tempoIndication: ti2,
            },
          ],
        },
        {
          id: "m2",
          key: KEY.B_MAJOR,
          rank: 2,
          sections: [
            {
              id: "s3",
              rank: 1,
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
              tempoIndication: ti1,
            }, // Duplicate TI
          ],
        },
      ],
    };

    commitSinglePieceVersionFormToFeedForm({
      singlePieceVersionFormState: {
        ...mockSinglePieceVersionFormState,
        pieceVersion: complexPieceVersion,
      },
      feedFormState: mockFeedFormState,
      feedFormDispatch,
      isUpdateMode: false,
    });

    expect(feedFormDispatch).toHaveBeenCalledWith({
      type: "tempoIndications",
      payload: { array: [ti1, ti2] },
    });
  });

  it("should increment rank based on feedFormState in standard mode", () => {
    const feedFormStateWithItems: FeedFormState = {
      mMSourceOnPieceVersions: [
        { pieceVersionId: "pv1", rank: 1 },
        { pieceVersionId: "pv2", rank: 2 },
      ],
    };

    commitSinglePieceVersionFormToFeedForm({
      singlePieceVersionFormState: mockSinglePieceVersionFormState,
      feedFormState: feedFormStateWithItems,
      feedFormDispatch,
      isUpdateMode: false,
    });

    expect(feedFormDispatch).toHaveBeenCalledWith({
      type: "mMSourceOnPieceVersions",
      payload: {
        idKey: "rank",
        array: [{ pieceVersionId: "pv-id", rank: 3 }],
      },
    });
  });
});
