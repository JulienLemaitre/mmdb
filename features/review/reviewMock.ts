import { ChecklistGraph } from "@/types/reviewTypes";

export type MockOverview = {
  graph: ChecklistGraph;
  globallyReviewed: {
    personIds: string[];
    organizationIds: string[];
    collectionIds: string[];
    pieceIds: string[];
  };
};

export function buildMockOverview(reviewId: string): MockOverview {
  // Mock entities
  const sourceId = "src-1";
  const collectionId = "col-1";
  const pieceAId = "p-1";
  const pieceBId = "p-2";
  const pvAId = "pv-1";
  const pvBId = "pv-2";
  const movA1Id = "mv-1";
  const movB1Id = "mv-2";
  const secA1Id = "s-1";
  const secB1Id = "s-2";
  const tiAId = "ti-1";
  const tiBId = "ti-2";
  const mmAId = "mm-1";
  const mmBId = "mm-2";
  const personId = "person-1";
  const editorId = "account-1";
  const refId = "ref-1";
  const contribId = "cont-1";

  const graph: ChecklistGraph = {
    source: {
      id: sourceId,
      title: `Mock Review Source ${reviewId}`,
      type: "EDITION",
      link: "https://example.com/score",
      permalink: "https://perma.example/score",
      year: 1820,
      isYearEstimated: false,
      comment: "Demo comment",
      enteredBy: {
        id: editorId,
        name: "John Doe",
        email: "john.doe@example.com",
      },
      references: [
        { id: refId, type: "ISMN", reference: "https://example.com/op10" },
      ],
    },
    collections: [
      {
        id: collectionId,
        title: "Op. 10",
        composerId: personId,
        pieceCount: 2,
      },
    ],
    pieces: [
      {
        id: pieceAId,
        title: "Op. 10 No. 1",
        nickname: "Allegro",
        composerId: personId,
        yearOfComposition: 1798,
        collectionId,
        collectionRank: 1,
      },
      {
        id: pieceBId,
        title: "Op. 10 No. 2",
        nickname: "Adagio",
        composerId: personId,
        yearOfComposition: 1798,
        collectionId,
        collectionRank: 2,
      },
    ],
    pieceVersions: [
      {
        id: pvAId,
        pieceId: pieceAId,
        category: "VOCAL",
        movements: [
          {
            id: movA1Id,
            rank: 1,
            key: "C_MINOR",
            sections: [
              {
                id: secA1Id,
                rank: 1,
                metreNumerator: 4,
                metreDenominator: 4,
                isCommonTime: true,
                isCutTime: false,
                fastestStructuralNotesPerBar: 16,
                tempoIndication: { id: tiAId, text: "tempoInd-1" },
                comment: "",
              },
            ],
          },
        ],
      },
      {
        id: pvBId,
        pieceId: pieceBId,
        category: "KEYBOARD",
        movements: [
          {
            id: movB1Id,
            rank: 1,
            key: "F_MAJOR",
            sections: [
              {
                id: secB1Id,
                rank: 1,
                metreNumerator: 3,
                metreDenominator: 4,
                isCommonTime: false,
                isCutTime: false,
                fastestStructuralNotesPerBar: 12,
                tempoIndication: { id: tiBId, text: "tempoInd-2" },
                comment: "",
              },
            ],
          },
        ],
      },
    ],
    tempoIndications: [
      { id: tiAId, text: "tempoInd-1" },
      { id: tiBId, text: "tempoInd-2" },
    ],
    metronomeMarks: [
      {
        id: mmAId,
        sectionId: secA1Id,
        beatUnit: "QUARTER",
        bpm: 120,
        comment: "",
        noMM: false,
        pieceVersionId: pvAId,
      },
      {
        id: mmBId,
        sectionId: secB1Id,
        beatUnit: "QUARTER",
        bpm: 88,
        comment: "",
        noMM: false,
        pieceVersionId: pvBId,
      },
    ],
    contributions: [
      {
        id: contribId,
        role: "MM_PROVIDER",
        person: {
          id: personId,
          firstName: "Ludwig",
          lastName: "Beethoven",
          birthYear: 1770,
          deathYear: 1827,
        },
      },
    ],
    persons: [
      {
        id: personId,
        firstName: "Ludwig",
        lastName: "Beethoven",
        birthYear: 1770,
        deathYear: 1827,
      },
    ],
    organizations: [],
    sourceOnPieceVersions: [
      {
        joinId: "join-1",
        mMSourceId: sourceId,
        pieceVersionId: pvAId,
        rank: 1,
        pieceId: pieceAId,
        collectionId,
        collectionRank: 1,
      },
      {
        joinId: "join-2",
        mMSourceId: sourceId,
        pieceVersionId: pvBId,
        rank: 2,
        pieceId: pieceBId,
        collectionId,
        collectionRank: 2,
      },
    ],
  };

  const globallyReviewed = {
    personIds: [personId],
    organizationIds: [],
    collectionIds: [],
    pieceIds: [],
  };

  return { graph, globallyReviewed };
}
