import { ChecklistGraph } from "@/types/reviewTypes";
import { FeedFormState } from "@/types/feedFormTypes";

export type MockOverview = {
  graph: ChecklistGraph;
  state: FeedFormState;
  globallyReviewed: {
    personIds: string[];
    organizationIds: string[];
    collectionIds: string[];
    pieceIds: string[];
    pieceVersionIds: string[];
  };
};

export function buildMockFeedFormState(reviewId: string): FeedFormState {
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
  const refId = "ref-1";
  const contribId = "cont-1";

  return {
    mMSourceDescription: {
      id: sourceId,
      title: `Mock Review Source ${reviewId}`,
      type: "EDITION",
      link: "https://example.com/score",
      permalink: "https://perma.example/score",
      year: 1820,
      isYearEstimated: false,
      comment: "Demo comment",
      references: [
        { id: refId, type: "ISMN", reference: "https://example.com/op10" },
      ],
    },
    mMSourceContributions: [
      {
        id: contribId,
        role: "MM_PROVIDER",
        personId,
      },
    ],
    mMSourceOnPieceVersions: [
      {
        pieceVersionId: pvAId,
        rank: 1,
      },
      {
        pieceVersionId: pvBId,
        rank: 2,
      },
    ],
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
            isVariation: false,
            sections: [
              {
                id: secA1Id,
                rank: 1,
                metreNumerator: 4,
                metreDenominator: 4,
                isCommonTime: true,
                isCutTime: false,
                fastestStructuralNotesPerBar: 16,
                tempoIndicationId: tiAId,
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
            isVariation: false,
            sections: [
              {
                id: secB1Id,
                rank: 1,
                metreNumerator: 3,
                metreDenominator: 4,
                isCommonTime: false,
                isCutTime: false,
                fastestStructuralNotesPerBar: 12,
                tempoIndicationId: tiBId,
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
  };
}

export function buildMockOverview(reviewId: string): MockOverview {
  const state = buildMockFeedFormState(reviewId);
  const sourceId = state.mMSourceDescription!.id!;
  const personId = state.persons![0].id;
  const collectionId = state.collections![0].id;
  const pieceAId = state.pieces![0].id;
  const pieceBId = state.pieces![1].id;
  const pvAId = state.pieceVersions![0].id;
  const pvBId = state.pieceVersions![1].id;
  const editorId = "account-1";

  const graph: ChecklistGraph = {
    source: {
      ...state.mMSourceDescription!,
      id: sourceId,
      enteredBy: {
        id: editorId,
        name: "John Doe",
        email: "john.doe@example.com",
      },
      references: state.mMSourceDescription!.references,
    },
    collections: state.collections as any,
    pieces: state.pieces as any,
    pieceVersions: state.pieceVersions as any,
    tempoIndications: state.tempoIndications as any,
    metronomeMarks: state.metronomeMarks as any,
    contributions: state.mMSourceContributions as any,
    persons: state.persons as any,
    organizations: state.organizations as any,
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
    pieceVersionIds: [],
  };

  return { graph, state, globallyReviewed };
}
