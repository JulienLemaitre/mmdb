export default function getFeedFormTestState() {
  return {
    formInfo: {
      currentStepRank: 5,
      introDone: true,
      isSourceOnPieceVersionformOpen: false,
      allSourcePieceVersionsDone: true,
    },
    mMSourceDescription: {
      id: undefined,
      title: "",
      year: 1648,
      type: "BOOK",
      link: "https://www.segylo.ca",
      comment: "",
      references: [
        {
          type: "ISMN",
          reference: "rteg-49849",
        },
      ],
      isNew: true,
    },
    mMSourceContributions: [
      {
        organization: {
          id: "448044f4-81cf-467b-880b-caecddc43d7f",
          name: "Authentic Sound",
        },
        role: "EDITOR",
      },
      {
        person: {
          id: "11508dfd-5fef-48ac-ae66-8c2e9e4f0187",
          firstName: "Carl",
          lastName: "Czerny",
          birthYear: 1791,
          deathYear: 1857,
        },
        role: "TRANSLATOR",
      },
    ],
    mMSourcePieceVersions: [
      {
        pieceVersionId: "8181781d-c9a5-46d4-8b7c-b4c975c08607",
        rank: 1,
      },
      {
        pieceVersionId: "98501fe4-f229-406a-ad4c-d654049fd7bf",
        rank: 2,
      },
    ],
    collections: [
      {
        title: "Zou",
        composerId: "5a189e0e-b6f4-45a7-bb4c-00055c04d944",
        id: "d4b3c0d2-4ffb-4768-82c4-c78b35ae9a1d",
        isNew: true,
      },
    ],
    metronomeMarks: [
      {
        sectionId: "8a7e30d7-c05e-4a69-af01-88cfccb57d55",
        bpm: 86,
        comment: undefined,
        beatUnit: "EIGHTH",
        noMM: false,
        pieceVersionRank: 1,
        pieceVersionId: "8181781d-c9a5-46d4-8b7c-b4c975c08607",
      },
      {
        sectionId: "77b74ed7-9299-438f-b300-83da73c8b6e5",
        noMM: true,
        pieceVersionRank: 1,
        pieceVersionId: "8181781d-c9a5-46d4-8b7c-b4c975c08607",
      },
      {
        sectionId: "9e839684-e55d-41bf-88ce-740c6c184021",
        bpm: 128,
        comment: undefined,
        beatUnit: "DOTTED_EIGHTH",
        noMM: false,
        pieceVersionRank: 1,
        pieceVersionId: "8181781d-c9a5-46d4-8b7c-b4c975c08607",
      },
      {
        sectionId: "6c03389c-702c-43e7-b822-c5fad187fe52",
        bpm: 86,
        comment: undefined,
        beatUnit: "WHOLE",
        noMM: false,
        pieceVersionRank: 2,
        pieceVersionId: "98501fe4-f229-406a-ad4c-d654049fd7bf",
      },
    ],
    organizations: [
      {
        id: "448044f4-81cf-467b-880b-caecddc43d7f",
        name: "Authentic Sound",
      },
    ],
    persons: [
      {
        id: "11508dfd-5fef-48ac-ae66-8c2e9e4f0187",
        firstName: "Carl",
        lastName: "Czerny",
        birthYear: 1791,
        deathYear: 1857,
      },
      {
        id: "92b2421b-05dd-4f95-a916-c6581cf8143d",
        firstName: "Napoléon",
        lastName: "Coste",
        birthYear: 1805,
        deathYear: 1883,
      },
      {
        id: "5a189e0e-b6f4-45a7-bb4c-00055c04d944",
        firstName: "oiuhi",
        lastName: "uyzge",
        birthYear: 1945,
        deathYear: null,
        isNew: true,
      },
    ],
    pieces: [
      {
        title: "Zou No.1",
        composerId: "5a189e0e-b6f4-45a7-bb4c-00055c04d944",
        yearOfComposition: null,
        id: "3e870baf-d616-4745-8b00-4fe9664b8fa9",
        isNew: true,
        collectionId: "d4b3c0d2-4ffb-4768-82c4-c78b35ae9a1d",
        collectionRank: 1,
      },
      {
        title: "Zou No.2",
        composerId: "5a189e0e-b6f4-45a7-bb4c-00055c04d944",
        yearOfComposition: null,
        id: "7d93ef20-de65-475a-bc6a-75d690e6ad27",
        isNew: true,
        collectionId: "d4b3c0d2-4ffb-4768-82c4-c78b35ae9a1d",
        collectionRank: 2,
      },
    ],
    pieceVersions: [
      {
        category: "CHAMBER_INSTRUMENTAL",
        movements: [
          {
            id: "5a2eed74-c647-48f9-9e8a-eeef31122f2b",
            rank: 1,
            key: "C_FLAT_MAJOR",
            sections: [
              {
                id: "8a7e30d7-c05e-4a69-af01-88cfccb57d55",
                metreNumerator: 4,
                metreDenominator: 4,
                isCommonTime: true,
                isCutTime: false,
                fastestStructuralNotesPerBar: 10,
                isFastestStructuralNoteBelCanto: false,
                fastestStaccatoNotesPerBar: undefined,
                fastestRepeatedNotesPerBar: undefined,
                fastestOrnamentalNotesPerBar: undefined,
                comment: undefined,
                tempoIndication: {
                  id: "0faa375a-ec8d-4da6-b33c-47041756557d",
                  text: "Adagio Cantabile",
                },
                rank: 1,
              },
            ],
          },
          {
            id: "63ca7901-ca15-4f8f-840d-1bdc872c787c",
            rank: 2,
            key: "D_MINOR",
            sections: [
              {
                id: "77b74ed7-9299-438f-b300-83da73c8b6e5",
                metreNumerator: 2,
                metreDenominator: 2,
                isCommonTime: false,
                isCutTime: true,
                fastestStructuralNotesPerBar: 12,
                isFastestStructuralNoteBelCanto: false,
                fastestStaccatoNotesPerBar: undefined,
                fastestRepeatedNotesPerBar: undefined,
                fastestOrnamentalNotesPerBar: undefined,
                comment: undefined,
                tempoIndication: {
                  id: "0faa375a-ec8d-4da6-b33c-47041756557d",
                  text: "Adagio Cantabile",
                },
                rank: 1,
              },
              {
                id: "9e839684-e55d-41bf-88ce-740c6c184021",
                metreNumerator: 3,
                metreDenominator: 4,
                isCommonTime: false,
                isCutTime: false,
                fastestStructuralNotesPerBar: 14,
                isFastestStructuralNoteBelCanto: false,
                fastestStaccatoNotesPerBar: undefined,
                fastestRepeatedNotesPerBar: undefined,
                fastestOrnamentalNotesPerBar: undefined,
                comment: undefined,
                tempoIndication: {
                  id: "0026bc57-ed45-4fbe-ad7c-1495642541de",
                  text: "Andante moderato",
                },
                rank: 2,
              },
            ],
          },
        ],
        pieceId: "3e870baf-d616-4745-8b00-4fe9664b8fa9",
        id: "8181781d-c9a5-46d4-8b7c-b4c975c08607",
        isNew: true,
      },
      {
        category: "CHAMBER_INSTRUMENTAL",
        movements: [
          {
            id: "b122db88-37ba-43a7-86b0-7bc7eab7b2c8",
            rank: 1,
            key: "A_SHARP_MAJOR",
            sections: [
              {
                id: "6c03389c-702c-43e7-b822-c5fad187fe52",
                metreNumerator: 6,
                metreDenominator: 8,
                isCommonTime: false,
                isCutTime: false,
                fastestStructuralNotesPerBar: 16,
                isFastestStructuralNoteBelCanto: false,
                fastestStaccatoNotesPerBar: undefined,
                fastestRepeatedNotesPerBar: undefined,
                fastestOrnamentalNotesPerBar: undefined,
                comment: undefined,
                tempoIndication: {
                  id: "c08a35bd-dd9e-4748-96b0-017cf13058ca",
                  text: "Adagio",
                },
                rank: 1,
              },
            ],
          },
        ],
        pieceId: "7d93ef20-de65-475a-bc6a-75d690e6ad27",
        id: "98501fe4-f229-406a-ad4c-d654049fd7bf",
        isNew: true,
      },
    ],
    tempoIndications: [],
  };
}
