import { getNewUuid } from "@/utils/getNewUuid";

export default function getFeedFormTestState() {
  const personId1 = getNewUuid();
  const pieceVersionId1 = getNewUuid();
  const pieceId1 = getNewUuid();
  const mvt1 = getNewUuid();
  const section1 = getNewUuid();
  const randomFirstName = getNewUuid()
    .replace(/-/g, "")
    .replace(/_/g, "")
    .replace(/\d/g, "");
  const randomLastName = getNewUuid()
    .replace(/-/g, "")
    .replace(/_/g, "")
    .replace(/\d/g, "");

  return {
    formInfo: {
      currentStepRank: 3,
      introDone: true,
      isSourceOnPieceVersionformOpen: false,
      formType: "single",
    },
    mMSourceDescription: {
      title: "Voluptatibus asperio",
      year: 2017,
      isYearEstimated: true,
      type: "EDITION",
      link: "https://www.visit.ws",
      comment: "Tenetur ex in totam ",
      references: [],
      isNew: true,
    },
    mMSourceContributions: [{ personId: personId1, role: "EDITOR" }],
    mMSourceOnPieceVersions: [{ pieceVersionId: pieceVersionId1, rank: 1 }],
    collections: [],
    metronomeMarks: [],
    organizations: [],
    persons: [
      {
        id: personId1,
        birthYear: 1980,
        deathYear: null,
        firstName: randomFirstName,
        lastName: randomLastName,
        isNew: true,
      },
    ],
    pieces: [
      {
        title: "First piece",
        composerId: personId1,
        yearOfComposition: null,
        id: pieceId1,
        isNew: true,
      },
    ],
    pieceVersions: [
      {
        category: "VOCAL",
        movements: [
          {
            id: mvt1,
            rank: 1,
            key: "F_FLAT_MINOR",
            sections: [
              {
                id: section1,
                metreNumerator: 4,
                metreDenominator: 4,
                isCommonTime: true,
                isCutTime: false,
                fastestStructuralNotesPerBar: 12,
                isFastestStructuralNoteBelCanto: false,
                tempoIndication: {
                  id: "0e62caff-00af-499c-9746-00df5387c317",
                  text: "Adagio assai",
                },
                rank: 1,
              },
            ],
          },
        ],
        pieceId: pieceId1,
        id: pieceVersionId1,
        isNew: true,
      },
    ],
    tempoIndications: [
      { id: "0e62caff-00af-499c-9746-00df5387c317", text: "Adagio assai" },
    ],
  };
}
