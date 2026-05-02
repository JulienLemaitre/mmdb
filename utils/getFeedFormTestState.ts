export default function getFeedFormTestState() {
  return {
    formInfo: {
      currentStepRank: 3,
      introDone: true,
      isSourceOnPieceVersionformOpen: false,
      formType: "collection",
    },
    mMSourceDescription: {
      title: "Quis consequatur Re",
      year: 2019,
      isYearEstimated: false,
      type: "EDITION",
      link: "https://www.xipyrymadahaq.mobi",
      comment: "Ut ut dolore fuga V",
      references: [],
      isNew: true,
    },
    mMSourceContributions: [
      {
        organization: {
          id: "4b3d83b5-d853-4c89-8f87-2ca00c94e809",
          name: "Breitkopf and Hartel",
        },
        role: "PUBLISHER",
      },
    ],
    mMSourceOnPieceVersions: [
      { pieceVersionId: "fd361046-9d05-4764-878f-b0d4a4225f07", rank: 1 },
      { pieceVersionId: "b003ceea-3774-491f-94c4-46a7323d268b", rank: 2 },
      { pieceVersionId: "2e9291d5-9461-49e9-a199-0bbf8af8ea09", rank: 3 },
      { pieceVersionId: "c5511aa9-cae9-4d1e-bf69-7fcfe0f0dce3", rank: 4 },
    ],
    collections: [
      {
        id: "6837a020-fa38-45ef-bcae-8faba4336865",
        composerId: "7676f865-128e-4219-96e1-e748afb017dc",
        isComposerNew: true,
        title: "Ma première",
        isNew: true,
        pieceCount: 2,
      },
    ],
    metronomeMarks: [],
    organizations: [
      {
        id: "4b3d83b5-d853-4c89-8f87-2ca00c94e809",
        name: "Breitkopf and Hartel",
      },
    ],
    persons: [
      {
        id: "9cc30bcf-33dc-4a39-8067-dd100af3f43d",
        firstName: "Carl",
        lastName: "Czerny",
        birthYear: 1791,
        deathYear: 1857,
      },
      {
        id: "dd2abb04-4981-431c-be28-f0fc6f858c23",
        firstName: "J.S",
        lastName: "Bach",
        birthYear: 1685,
        deathYear: 1750,
      },
      { id: "7676f865-128e-4219-96e1-e748afb017dc" },
    ],
    pieces: [
      {
        id: "e75fe5c0-4165-4884-a95f-636058ffacbc",
        title: "The School of Velocity, Op.299 No.4",
        yearOfComposition: 1833,
        collectionId: "46e28e48-8c53-440f-a31b-2140ac5f2f31",
        collectionRank: 4,
        composerId: "9cc30bcf-33dc-4a39-8067-dd100af3f43d",
      },
      {
        id: "89c693ff-1f94-4981-b1ff-07d1fe43b5e0",
        title: "Invention in C minor, BWV 773",
        yearOfComposition: 1723,
        composerId: "dd2abb04-4981-431c-be28-f0fc6f858c23",
      },
      {
        title: "Ma première No.1",
        composerId: "7676f865-128e-4219-96e1-e748afb017dc",
        yearOfComposition: null,
        id: "98f128a6-21a2-480b-b620-fc55dff7fa35",
        isNew: true,
        collectionId: "6837a020-fa38-45ef-bcae-8faba4336865",
        collectionRank: 1,
      },
      {
        title: "Ma première No.2",
        composerId: "7676f865-128e-4219-96e1-e748afb017dc",
        yearOfComposition: null,
        id: "f96a788a-7226-4369-a36b-2aa7836aa984",
        isNew: true,
        collectionId: "6837a020-fa38-45ef-bcae-8faba4336865",
        collectionRank: 2,
      },
    ],
    pieceVersions: [
      {
        category: "VOCAL",
        movements: [
          {
            id: "cc4ae6f4-01b7-4b58-88b5-2f55270941ef",
            rank: 1,
            key: "A_FLAT_MAJOR",
            sections: [
              {
                id: "4aeb9aa7-d290-479f-9dfc-91001e1ffd6e",
                metreNumerator: 6,
                metreDenominator: 4,
                isCommonTime: false,
                isCutTime: false,
                fastestStructuralNotesPerBar: 10,
                isFastestStructuralNoteBelCanto: false,
                tempoIndication: {
                  id: "8ca65711-d727-4e85-965e-b2eefb75adf3",
                  text: "Adagio lamentoso",
                },
                rank: 1,
              },
            ],
          },
        ],
        pieceId: "e75fe5c0-4165-4884-a95f-636058ffacbc",
        id: "fd361046-9d05-4764-878f-b0d4a4225f07",
        isNew: true,
      },
      {
        category: "KEYBOARD",
        movements: [
          {
            id: "7860ae76-660a-4dbd-b3a3-7019c7c6a214",
            rank: 1,
            key: "G_FLAT_MINOR",
            sections: [
              {
                id: "774edc40-6519-40ec-b7c4-635044bb07be",
                metreNumerator: 4,
                metreDenominator: 4,
                isCommonTime: true,
                isCutTime: false,
                fastestStructuralNotesPerBar: 8,
                isFastestStructuralNoteBelCanto: false,
                tempoIndication: {
                  id: "55115345-0afe-4623-96d6-8b0858848d91",
                  text: "Piu animato",
                },
                rank: 1,
              },
            ],
          },
        ],
        pieceId: "89c693ff-1f94-4981-b1ff-07d1fe43b5e0",
        id: "b003ceea-3774-491f-94c4-46a7323d268b",
        isNew: true,
      },
      {
        category: "KEYBOARD",
        movements: [
          {
            id: "3b1b138c-e174-4a4c-b40c-71b37f80c184",
            rank: 1,
            key: "A_FLAT_MINOR",
            sections: [
              {
                id: "4a4b1603-c9ef-4a4d-963a-5de936d7e0ac",
                metreNumerator: 4,
                metreDenominator: 4,
                isCommonTime: true,
                isCutTime: false,
                fastestStructuralNotesPerBar: 8,
                isFastestStructuralNoteBelCanto: false,
                tempoIndication: {
                  id: "f7f58770-2a4f-498a-9eb5-965f08ca1c33",
                  text: "Adagio ma non troppo",
                },
                rank: 1,
              },
            ],
          },
        ],
        pieceId: "98f128a6-21a2-480b-b620-fc55dff7fa35",
        id: "2e9291d5-9461-49e9-a199-0bbf8af8ea09",
        isNew: true,
      },
      {
        category: "KEYBOARD",
        movements: [
          {
            id: "685b4693-ce36-4877-bcbe-7b6be21fd9fd",
            rank: 1,
            key: "G_MINOR",
            sections: [
              {
                id: "134ab84f-b7f8-46ab-86ca-268c059caae4",
                metreNumerator: 3,
                metreDenominator: 2,
                isCommonTime: false,
                isCutTime: false,
                fastestStructuralNotesPerBar: 13,
                isFastestStructuralNoteBelCanto: false,
                tempoIndication: {
                  id: "3f688811-f5f1-4e6a-a570-de98ab0ddb1a",
                  text: "Molto Allegro e veloce",
                },
                rank: 1,
              },
            ],
          },
        ],
        pieceId: "f96a788a-7226-4369-a36b-2aa7836aa984",
        id: "c5511aa9-cae9-4d1e-bf69-7fcfe0f0dce3",
        isNew: true,
      },
    ],
    tempoIndications: [
      { id: "8ca65711-d727-4e85-965e-b2eefb75adf3", text: "Adagio lamentoso" },
      { id: "55115345-0afe-4623-96d6-8b0858848d91", text: "Piu animato" },
      {
        id: "f7f58770-2a4f-498a-9eb5-965f08ca1c33",
        text: "Adagio ma non troppo",
      },
      {
        id: "3f688811-f5f1-4e6a-a570-de98ab0ddb1a",
        text: "Molto Allegro e veloce",
      },
    ],
  };
}
