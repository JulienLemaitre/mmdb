export default function getFeedFormTestState() {
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
    mMSourceContributions: [
      { personId: "638c9ce0-1a82-4ee7-a851-e48c1d2ea770", role: "EDITOR" },
    ],
    mMSourceOnPieceVersions: [
      { pieceVersionId: "fdceb470-341b-4e00-a283-206c711ba89d", rank: 1 },
    ],
    collections: [],
    metronomeMarks: [],
    organizations: [],
    persons: [
      {
        id: "638c9ce0-1a82-4ee7-a851-e48c1d2ea770",
        birthYear: 1980,
        deathYear: null,
        firstName: "Moi",
        lastName: "Même",
        isNew: true,
      },
    ],
    pieces: [
      {
        title: "First piece",
        composerId: "638c9ce0-1a82-4ee7-a851-e48c1d2ea770",
        yearOfComposition: null,
        id: "70249777-764e-44b9-82ea-0ebeac01c6b7",
        isNew: true,
      },
    ],
    pieceVersions: [
      {
        category: "VOCAL",
        movements: [
          {
            id: "22a115a2-f664-4271-b5f4-13a84c82e47d",
            rank: 1,
            key: "F_FLAT_MINOR",
            sections: [
              {
                id: "59417608-9629-4b71-a19f-8f6d759c9eab",
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
        pieceId: "70249777-764e-44b9-82ea-0ebeac01c6b7",
        id: "fdceb470-341b-4e00-a283-206c711ba89d",
        isNew: true,
      },
    ],
    tempoIndications: [
      { id: "0e62caff-00af-499c-9746-00df5387c317", text: "Adagio assai" },
    ],
  };
}
