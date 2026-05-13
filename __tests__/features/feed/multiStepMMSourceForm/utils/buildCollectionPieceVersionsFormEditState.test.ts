import { buildCollectionPieceVersionsFormEditState } from "@/features/feed/multiStepMMSourceForm/utils/buildCollectionPieceVersionsFormEditState";
import { FeedFormState } from "@/types/feedFormTypes";
import {
  CollectionState,
  PersonState,
  PieceState,
  PieceVersionState,
  SectionState,
  TempoIndicationState,
} from "@/types/formTypes";
import { KEY } from "@/prisma/client";
import { PIECE_CATEGORY } from "@/prisma/client/enums";

describe("buildCollectionPieceVersionsFormEditState", () => {
  const composer: PersonState = {
    id: "composer-1",
    firstName: "Ludwig van",
    lastName: "Beethoven",
    birthYear: 1770,
    deathYear: 1827,
  };

  const otherComposer: PersonState = {
    id: "composer-2",
    firstName: "Johann Sebastian",
    lastName: "Bach",
    birthYear: 1685,
    deathYear: 1750,
  };

  const collection: CollectionState = {
    id: "collection-1",
    composerId: composer.id,
    title: "Symphonies",
    pieceCount: 2,
    isNew: true,
  };

  const tempo1: TempoIndicationState = { id: "tempo-1", text: "Allegro" };
  const tempo2: TempoIndicationState = { id: "tempo-2", text: "Andante" };

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

  const collectionPiece1: PieceState = {
    id: "piece-1",
    title: "Symphony No. 1",
    composerId: composer.id,
    collectionId: collection.id,
    collectionRank: 1,
  };

  const collectionPiece2: PieceState = {
    id: "piece-2",
    title: "Symphony No. 2",
    composerId: composer.id,
    collectionId: collection.id,
    collectionRank: 2,
  };

  const otherPiece: PieceState = {
    id: "piece-3",
    title: "Mass in B minor",
    composerId: otherComposer.id,
  };

  const pieceVersion1: PieceVersionState = {
    id: "pv-1",
    pieceId: collectionPiece1.id,
    category: PIECE_CATEGORY.OTHER,
    movements: [
      {
        id: "mov-1",
        rank: 1,
        key: KEY.C_MAJOR,
        sections: [buildSection("sec-1", 1, tempo1)],
      },
    ],
  };

  const pieceVersion2: PieceVersionState = {
    id: "pv-2",
    pieceId: collectionPiece2.id,
    category: PIECE_CATEGORY.OTHER,
    movements: [
      {
        id: "mov-2",
        rank: 1,
        key: KEY.D_MAJOR,
        sections: [
          buildSection("sec-2", 1, tempo2),
          buildSection("sec-3", 2, tempo1),
        ],
      },
    ],
  };

  const otherPieceVersion: PieceVersionState = {
    id: "pv-3",
    pieceId: otherPiece.id,
    category: PIECE_CATEGORY.OTHER,
    movements: [
      {
        id: "mov-3",
        rank: 1,
        key: KEY.A_MINOR,
        sections: [buildSection("sec-4", 1, tempo2)],
      },
    ],
  };

  it("should build a fully rehydrated collection edit state", () => {
    const feedFormState: FeedFormState = {
      collections: [collection],
      persons: [composer, otherComposer],
      pieces: [collectionPiece1, collectionPiece2, otherPiece],
      pieceVersions: [pieceVersion1, pieceVersion2, otherPieceVersion],
      mMSourceOnPieceVersions: [
        { pieceVersionId: otherPieceVersion.id, rank: 1 },
        { pieceVersionId: pieceVersion2.id, rank: 4 },
        { pieceVersionId: pieceVersion1.id, rank: 3 },
      ],
    };

    const result = buildCollectionPieceVersionsFormEditState({
      feedFormState,
      collectionId: collection.id,
    });

    expect(result).not.toBeNull();
    expect(result?.formInfo).toEqual({
      currentStepRank: 0,
      collectionFirstMMSourceOnPieceVersionRank: 3,
    });
    expect(result?.collection).toEqual({
      id: collection.id,
      composerId: collection.composerId,
      title: collection.title,
      isNew: true,
      pieceCount: 2,
    });
    expect(result?.mMSourceOnPieceVersions).toEqual([
      { pieceVersionId: pieceVersion1.id, rank: 1 },
      { pieceVersionId: pieceVersion2.id, rank: 2 },
    ]);
    expect(result?.persons?.map((person) => person.id)).toEqual([composer.id]);
    expect(result?.pieces?.map((piece) => piece.id)).toEqual([
      collectionPiece1.id,
      collectionPiece2.id,
    ]);
    expect(
      result?.pieceVersions?.map((pieceVersion) => pieceVersion.id),
    ).toEqual([pieceVersion1.id, pieceVersion2.id]);
    expect(
      result?.tempoIndications?.map((tempoIndication) => tempoIndication.id),
    ).toEqual([tempo1.id, tempo2.id]);
  });

  it("should return null when collection does not exist", () => {
    const result = buildCollectionPieceVersionsFormEditState({
      feedFormState: { collections: [] },
      collectionId: "missing-collection",
    });

    expect(result).toBeNull();
  });

  it("should return null when collection has no source on piece versions", () => {
    const result = buildCollectionPieceVersionsFormEditState({
      feedFormState: {
        collections: [collection],
        persons: [composer],
        pieces: [collectionPiece1],
        pieceVersions: [pieceVersion1],
        mMSourceOnPieceVersions: [],
      },
      collectionId: collection.id,
    });

    expect(result).toBeNull();
  });
});
