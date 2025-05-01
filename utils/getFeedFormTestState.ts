export default function getFeedFormTestState() {
  return {
    formInfo: {
      currentStepRank: 4,
      introDone: true,
      isSourceOnPieceVersionformOpen: false,
      allSourcePieceVersionsDone: true,
    },
    mMSourceDescription: {
      id: undefined,
      title: "Possimus sunt dolor",
      year: 2016,
      type: "EDITION",
      link: "https://www.gejukejapu.cc",
      comment: "Eligendi duis ea del",
      references: [],
      isNew: true,
    },
    mMSourceContributions: [
      {
        organization: {
          id: "8c0553ad-ca51-4fd5-8ae4-15e910880ad6",
          name: "Artaria",
        },
        role: "EDITOR",
      },
    ],
    mMSourcePieceVersions: [
      {
        pieceVersionId: "9d82fdd7-b766-41cf-9e4e-bbe920456ee9",
        rank: 1,
      },
    ],
    collections: [],
    metronomeMarks: [],
    organizations: [
      {
        id: "8c0553ad-ca51-4fd5-8ae4-15e910880ad6",
        name: "Artaria",
      },
    ],
    persons: [
      {
        id: "16ff0135-775d-4fde-8b3b-24c5a375b369",
        firstName: "Ludwig van",
        lastName: "Beethoven",
        birthYear: 1770,
        deathYear: 1827,
      },
    ],
    pieces: [
      {
        id: "30148fab-35f1-48e9-9ab3-b023c484b5de",
        title: "String Quartet No.1, Op.18 No.1",
        yearOfComposition: 1799,
        collectionId: "85a3a023-f816-487e-9a73-bd428ef32f7d",
        collectionRank: 1,
        composerId: "16ff0135-775d-4fde-8b3b-24c5a375b369",
      },
    ],
    pieceVersions: [
      {
        id: "9d82fdd7-b766-41cf-9e4e-bbe920456ee9",
        category: "CHAMBER_INSTRUMENTAL",
        pieceId: "30148fab-35f1-48e9-9ab3-b023c484b5de",

        movements: [
          {
            id: "7d8800b2-cb1c-49a9-aa10-fb2b17c30806",
            rank: 1,
            key: "F_MAJOR",

            sections: [
              {
                id: "425a05d2-2f0b-4e10-9364-dd107d56ba9f",
                rank: 1,
                metreNumerator: 3,
                metreDenominator: 4,
                isCommonTime: false,
                isCutTime: false,

                tempoIndication: {
                  id: "8842abbe-f70c-47e4-8968-a8eb451b840e",
                  text: "Allegro con brio",
                },
                fastestStaccatoNotesPerBar: 12,
                fastestStructuralNotesPerBar: 12,
                fastestOrnamentalNotesPerBar: 12,
                isFastestStructuralNoteBelCanto: false,
              },
            ],
          },
          {
            id: "38882194-26b3-4b8b-b73a-63efbda95cd6",
            rank: 2,
            key: "D_MINOR",

            sections: [
              {
                id: "8e831e8a-9c5a-4176-a998-033c4e0a4195",
                rank: 1,
                metreNumerator: 9,
                metreDenominator: 8,
                isCommonTime: false,
                isCutTime: false,

                tempoIndication: {
                  id: "1b721f96-1768-447b-8cbf-23c73f014464",
                  text: "Adagio affettuoso ed appassionato",
                },
                fastestStructuralNotesPerBar: 18,
                fastestOrnamentalNotesPerBar: 126,
                isFastestStructuralNoteBelCanto: false,
              },
            ],
          },
          {
            id: "b15bc395-70e3-40f3-b9f0-a33a5394df94",
            rank: 3,
            key: "F_MAJOR",

            sections: [
              {
                id: "e9ac4028-b572-4217-807e-a2c390510ef9",
                rank: 1,
                metreNumerator: 3,
                metreDenominator: 4,
                isCommonTime: false,
                isCutTime: false,

                tempoIndication: {
                  id: "5dc61449-5c62-4572-baed-e26dbc63c776",
                  text: "Allegro molto",
                },
                comment: "Scherzo",
                fastestStaccatoNotesPerBar: 3,
                fastestStructuralNotesPerBar: 6,
                fastestOrnamentalNotesPerBar: 12,
                isFastestStructuralNoteBelCanto: false,
              },
            ],
          },
          {
            id: "d6ade62a-1e52-4999-87d3-07e055b4a383",
            rank: 4,
            key: "F_MAJOR",

            sections: [
              {
                id: "cd792c0d-a15a-4393-951b-5d77ad768ff3",
                rank: 1,
                metreNumerator: 2,
                metreDenominator: 4,
                isCommonTime: false,
                isCutTime: false,

                tempoIndication: {
                  id: "9bb1b928-d91c-4621-a5dd-03c1826ea563",
                  text: "Allegro",
                },
                fastestStaccatoNotesPerBar: 4,
                fastestStructuralNotesPerBar: 12,
                fastestOrnamentalNotesPerBar: 24,
                isFastestStructuralNoteBelCanto: false,
              },
            ],
          },
        ],
      },
    ],
    tempoIndications: [],
  };
}
