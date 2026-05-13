import { cleanFeedFormState } from "@/context/utils/cleanFeedFormState";
import { getNewEntities } from "@/context/feedFormContext";
import { FeedFormState } from "@/types/feedFormTypes";
import {
  CollectionState,
  MetronomeMarkState,
  PersonState,
  PieceState,
  PieceVersionState,
  SectionState,
  TempoIndicationState,
} from "@/types/formTypes";
import { KEY } from "@/prisma/client";
import { PIECE_CATEGORY } from "@/prisma/client/enums";

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

describe("feed form cleanup utilities", () => {
  const composerUsed: PersonState = {
    id: "person-used",
    firstName: "Ludwig van",
    lastName: "Beethoven",
    birthYear: 1770,
    deathYear: 1827,
    isNew: true,
  };

  const composerUnused: PersonState = {
    id: "person-unused",
    firstName: "Unused",
    lastName: "Composer",
    birthYear: 1800,
    deathYear: 1850,
    isNew: true,
  };

  const collectionUsed: CollectionState = {
    id: "collection-used",
    composerId: composerUsed.id,
    title: "Used Collection",
    isNew: true,
    pieceCount: 1,
  };

  const collectionUnused: CollectionState = {
    id: "collection-unused",
    composerId: composerUnused.id,
    title: "Unused Collection",
    isNew: true,
    pieceCount: 0,
  };

  const pieceUsed: PieceState = {
    id: "piece-used",
    title: "Symphony No. 1",
    composerId: composerUsed.id,
    collectionId: collectionUsed.id,
    isNew: true,
  };

  const pieceUnused: PieceState = {
    id: "piece-unused",
    title: "Unused Piece",
    composerId: composerUnused.id,
    collectionId: collectionUnused.id,
    isNew: true,
  };

  const tempoUsed: TempoIndicationState = {
    id: "tempo-used",
    text: "Allegro",
  };

  const tempoUnused: TempoIndicationState = {
    id: "tempo-unused",
    text: "Largo",
  };

  const pieceVersionUsed: PieceVersionState = {
    id: "pv-used",
    pieceId: pieceUsed.id,
    category: PIECE_CATEGORY.OTHER,
    movements: [
      {
        id: "mov-used",
        rank: 1,
        key: KEY.C_MAJOR,
        sections: [buildSection("sec-used", 1, tempoUsed)],
      },
    ],
    isNew: true,
  };

  const pieceVersionUnused: PieceVersionState = {
    id: "pv-unused",
    pieceId: pieceUnused.id,
    category: PIECE_CATEGORY.OTHER,
    movements: [
      {
        id: "mov-unused",
        rank: 1,
        key: KEY.D_MAJOR,
        sections: [buildSection("sec-unused", 1, tempoUnused)],
      },
    ],
    isNew: true,
  };

  const metronomeMarkUsed: MetronomeMarkState = {
    id: "mm-used",
    sectionId: "sec-used",
    pieceVersionId: pieceVersionUsed.id,
    noMM: true,
  };

  const metronomeMarkUnused: MetronomeMarkState = {
    id: "mm-unused",
    sectionId: "sec-unused",
    pieceVersionId: pieceVersionUnused.id,
    noMM: true,
  };

  const baseState: FeedFormState = {
    formInfo: { currentStepRank: 1 },
    organizations: [
      {
        id: "org-unused",
        name: "Unused Organization",
      },
    ],
    persons: [composerUsed, composerUnused],
    collections: [collectionUsed, collectionUnused],
    pieces: [pieceUsed, pieceUnused],
    pieceVersions: [pieceVersionUsed, pieceVersionUnused],
    tempoIndications: [tempoUsed, tempoUnused],
    metronomeMarks: [metronomeMarkUsed, metronomeMarkUnused],
    mMSourceOnPieceVersions: [{ pieceVersionId: pieceVersionUsed.id, rank: 1 }],
  };

  it("cleanFeedFormState should remove unused entities from feed form", () => {
    const cleaned = cleanFeedFormState(baseState);

    expect(cleaned.organizations?.map((org) => org.id)).toEqual([]);
    expect(cleaned.persons?.map((person) => person.id)).toEqual([
      composerUsed.id,
    ]);
    expect(cleaned.collections?.map((collection) => collection.id)).toEqual([
      collectionUsed.id,
    ]);
    expect(cleaned.pieces?.map((piece) => piece.id)).toEqual([pieceUsed.id]);
    expect(
      cleaned.pieceVersions?.map((pieceVersion) => pieceVersion.id),
    ).toEqual([pieceVersionUsed.id]);
    expect(cleaned.tempoIndications?.map((tempo) => tempo.id)).toEqual([
      tempoUsed.id,
    ]);
    expect(
      cleaned.metronomeMarks?.map((metronomeMark) => metronomeMark.id),
    ).toEqual([metronomeMarkUsed.id]);
  });

  it("getNewEntities should only return used new entities", () => {
    const newPieces = getNewEntities(baseState, "pieces");
    const newPieceVersions = getNewEntities(baseState, "pieceVersions");
    const newCollections = getNewEntities(baseState, "collections");
    const newPersons = getNewEntities(baseState, "persons");

    expect(newPieces.map((piece) => piece.id)).toEqual([pieceUsed.id]);
    expect(newPieceVersions.map((pieceVersion) => pieceVersion.id)).toEqual([
      pieceVersionUsed.id,
    ]);
    expect(newCollections.map((collection) => collection.id)).toEqual([
      collectionUsed.id,
    ]);
    expect(newPersons.map((person) => person.id)).toEqual([composerUsed.id]);
  });
});
