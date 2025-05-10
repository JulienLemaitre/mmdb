export default function getFeedFormTestState() {
  return {
    formInfo: {
      currentStepRank: 5,
      introDone: true,
      isSourceOnPieceVersionformOpen: false,
      allSourcePieceVersionsDone: true,
    },
    mMSourceDescription: {
      title: "Deserunt non irure c",
      year: 1971,
      type: "EDITION",
      link: "https://www.tykedebahuc.org.uk",
      comment: "Deserunt quis facili",
      references: [],
      isNew: true,
    },
    mMSourceContributions: [
      {
        person: {
          id: "805543b9-cdc3-488b-8624-cdf7ca86dc2d",
          firstName: "Albert",
          lastName: "Sanna",
          birthYear: 1899,
          deathYear: null,
        },
        role: "EDITOR",
      },
    ],
    mMSourcePieceVersions: [
      {
        pieceVersionId: "de8f8af7-5dbc-49e1-b640-8cb7ab7c4913",
        rank: 1,
      },
      { pieceVersionId: "31cdffd9-8de9-437e-8a7b-ffb9c071bbe1", rank: 2 },
    ],
    collections: [],
    metronomeMarks: [
      {
        sectionId: "026be759-8796-4129-ade1-c48e7b3d4bfd",
        bpm: 64,
        beatUnit: "EIGHTH",
        noMM: false,
        pieceVersionRank: 1,
        pieceVersionId: "de8f8af7-5dbc-49e1-b640-8cb7ab7c4913",
      },
      {
        sectionId: "d865ddee-3d3e-4057-8f5f-5cee1728f462",
        bpm: 64,
        beatUnit: "EIGHTH",
        noMM: false,
        pieceVersionRank: 2,
        pieceVersionId: "31cdffd9-8de9-437e-8a7b-ffb9c071bbe1",
      },
      {
        sectionId: "57bbb58e-391d-4dde-93d1-dc80ab509ffe",
        noMM: true,
        pieceVersionRank: 2,
        pieceVersionId: "31cdffd9-8de9-437e-8a7b-ffb9c071bbe1",
      },
    ],
    organizations: [],
    persons: [
      {
        id: "805543b9-cdc3-488b-8624-cdf7ca86dc2d",
        firstName: "Albert",
        lastName: "Sanna",
        birthYear: 1899,
        deathYear: null,
      },
      {
        id: "2073c597-f1c6-445c-9f14-f8d0066684cc",
        firstName: "Moi",
        lastName: "Même",
        birthYear: 1980,
        deathYear: null,
      },
    ],
    pieces: [
      {
        id: "fa89141c-05dd-4a40-905d-3683bccb04df",
        title: "Lalala",
        nickname: "",
        yearOfComposition: 1994,
        composerId: "2073c597-f1c6-445c-9f14-f8d0066684cc",
      },
      {
        id: "7e2c7c50-043c-467d-ad9d-158824ef7087",
        title: "Zouzou",
        yearOfComposition: 1880,
        composerId: "2073c597-f1c6-445c-9f14-f8d0066684cc",
      },
    ],
    pieceVersions: [
      {
        id: "de8f8af7-5dbc-49e1-b640-8cb7ab7c4913",
        category: "KEYBOARD",
        pieceId: "fa89141c-05dd-4a40-905d-3683bccb04df",
        movements: [
          {
            id: "1361e0c2-c378-4178-83b0-ff66ddca14b0",
            rank: 1,
            key: "A_FLAT_MINOR",
            sections: [
              {
                id: "026be759-8796-4129-ade1-c48e7b3d4bfd",
                rank: 1,
                metreNumerator: 4,
                metreDenominator: 4,
                isCommonTime: true,
                isCutTime: false,
                tempoIndication: {
                  id: "6a16e457-6aeb-4802-a59e-4ce3b91cafa2",
                  text: "-- None --",
                },
                fastestStructuralNotesPerBar: 10,
                isFastestStructuralNoteBelCanto: false,
              },
            ],
          },
        ],
      },
      {
        category: "KEYBOARD",
        movements: [
          {
            id: "d68b5e99-d219-4d46-a83d-d5c48778fd4d",
            rank: 1,
            key: "G_FLAT_MINOR",
            sections: [
              {
                id: "d865ddee-3d3e-4057-8f5f-5cee1728f462",
                metreNumerator: 2,
                metreDenominator: 2,
                isCommonTime: false,
                isCutTime: true,
                fastestStructuralNotesPerBar: 45,
                isFastestStructuralNoteBelCanto: false,
                tempoIndication: {
                  id: "1a595af4-92e6-4484-a725-319cd547bd4a",
                  text: "Adagio cantabile",
                },
                rank: 1,
              },
              {
                id: "57bbb58e-391d-4dde-93d1-dc80ab509ffe",
                metreNumerator: 4,
                metreDenominator: 4,
                isCommonTime: true,
                isCutTime: false,
                fastestStructuralNotesPerBar: 16,
                isFastestStructuralNoteBelCanto: false,
                tempoIndication: {
                  id: "97c42854-28f8-44fa-946d-e73589a2d87f",
                  text: "Adagio ma non troppo ma divoto",
                },
                rank: 2,
              },
            ],
          },
        ],
        pieceId: "7e2c7c50-043c-467d-ad9d-158824ef7087",
        id: "31cdffd9-8de9-437e-8a7b-ffb9c071bbe1",
        isNew: true,
      },
    ],
    tempoIndications: [],
  };
}
