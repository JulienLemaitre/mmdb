import { v4 as uuidv4 } from "uuid";
import { FeedFormState } from "@/components/context/feedFormContext";

export default function getFeedFormTestState() {
  return {
    formInfo: {
      currentStepRank: 3,
      introDone: true,
      isSourceOnPieceVersionformOpen: true,
    },
    mMSourceDescription: {
      id: undefined,
      title: "",
      year: 1984,
      type: "BOOK",
      link: "https://www.fokiwykymabyp.net",
      comment: "Whouahou !",
      references: [
        {
          type: "ISMN",
          reference: "egrretgre49+8--eg",
        },
      ],
      isNew: true,
    },
    mMSourceContributions: [
      {
        organization: {
          id: "adf0bdbb-eae3-45a5-90bf-6db24733b8f9",
          name: "A. Diabelli et Comp.",
        },
        role: "PUBLISHER",
      },
    ],
    mMSourcePieceVersions: [],
    organizations: [
      {
        id: "adf0bdbb-eae3-45a5-90bf-6db24733b8f9",
        name: "A. Diabelli et Comp.",
      },
    ],
    persons: [],
    pieces: [],
    pieceVersions: [],
    metronomeMarks: [],
    tempoIndications: [],
    collections: [],
  };

  // return {
  //   formInfo: {
  //     currentStepRank: 5,
  //     introDone: true,
  //     isSourceOnPieceVersionformOpen: false,
  //     allSourcePieceVersionsDone: true,
  //   },
  //   mMSourceDescription: {
  //     id: undefined,
  //     title: "Similique do esse do",
  //     year: 2018,
  //     type: "EDITION",
  //     link: "https://www.fiton.org",
  //     comment: "Suscipit minus excep",
  //     references: [],
  //     isNew: true,
  //   },
  //   mMSourceContributions: [
  //     {
  //       organization: {
  //         id: "4772d080-0c14-4a37-8e79-f2d8590a370a",
  //         name: "A. Diabelli et Comp.",
  //       },
  //       role: "PUBLISHER",
  //     },
  //     {
  //       person: {
  //         id: "87170b23-244a-4fcb-9795-0684c61a6f7c",
  //         birthYear: 1980,
  //         firstName: "Moi",
  //         lastName: "Même",
  //         isNew: true,
  //       },
  //       role: "MM_PROVIDER",
  //     },
  //   ],
  //   mMSourcePieceVersions: [
  //     {
  //       pieceVersionId: "5c28c5b4-54d2-43b5-b018-fcb03161837b",
  //       rank: 1,
  //     },
  //     {
  //       pieceVersionId: "a7b8fb74-c1e0-4981-a8fa-47212284c8fa",
  //       rank: 2,
  //     },
  //     {
  //       pieceVersionId: "febe69f0-0980-4a3a-90c1-fb31db1645d5",
  //       rank: 3,
  //     },
  //   ],
  //   organizations: [],
  //   persons: [
  //     {
  //       id: "87170b23-244a-4fcb-9795-0684c61a6f7c",
  //       birthYear: 1980,
  //       firstName: "Moi",
  //       lastName: "Même",
  //       isNew: true,
  //     },
  //     {
  //       firstName: "Elle",
  //       lastName: "Même",
  //       birthYear: 1984,
  //       deathYear: NaN,
  //       id: "84317ceb-4b80-41a9-9f4f-49c0f9d4ee3a",
  //       isNew: true,
  //     },
  //   ],
  //   pieces: [
  //     {
  //       title: "NewOne",
  //       nickname: "New",
  //       yearOfComposition: NaN,
  //       composerId: "84317ceb-4b80-41a9-9f4f-49c0f9d4ee3a",
  //       id: "aa075556-1571-4c8c-97be-2ae7bbeff06b",
  //       isNew: true,
  //     },
  //   ],
  //   pieceVersions: [
  //     {
  //       category: "KEYBOARD",
  //       movements: [
  //         {
  //           id: "cc6db747-29b6-4d4e-9570-4a436937e9d1",
  //           rank: 1,
  //           key: "D_MAJOR",
  //           sections: [
  //             {
  //               id: "481e69a6-f0b6-4217-8a5a-b4c22a780a42",
  //               rank: 1,
  //               metreNumerator: 4,
  //               metreDenominator: 4,
  //               isCommonTime: true,
  //               isCutTime: false,
  //               fastestStructuralNotesPerBar: 10,
  //               isFastestStructuralNoteBelCanto: false,
  //               fastestStaccatoNotesPerBar: NaN,
  //               fastestRepeatedNotesPerBar: NaN,
  //               fastestOrnamentalNotesPerBar: NaN,
  //               comment: "",
  //               tempoIndication: {
  //                 id: "7c555d45-bd87-41f3-93f7-00327bd04873",
  //                 text: "Adagio",
  //               },
  //             },
  //           ],
  //         },
  //       ],
  //       pieceId: "e3aeb877-3f40-49e1-a1e9-d9485bffa9cf",
  //       id: "a7b8fb74-c1e0-4981-a8fa-47212284c8fa",
  //       isNew: true,
  //     },
  //     {
  //       category: "VOCAL",
  //       movements: [
  //         {
  //           id: "b74b33b0-4585-419c-9d32-33f112740e3b",
  //           rank: 1,
  //           key: "D_MINOR",
  //           sections: [
  //             {
  //               id: "2cbcde95-cb6e-4a8b-9ba5-c47bf5113d6a",
  //               rank: 1,
  //               metreNumerator: 4,
  //               metreDenominator: 4,
  //               isCommonTime: true,
  //               isCutTime: false,
  //               fastestStructuralNotesPerBar: 18,
  //               isFastestStructuralNoteBelCanto: false,
  //               fastestStaccatoNotesPerBar: NaN,
  //               fastestRepeatedNotesPerBar: NaN,
  //               fastestOrnamentalNotesPerBar: NaN,
  //               comment: "",
  //               tempoIndication: {
  //                 id: "508b8e26-956e-40e6-9fb5-a7e6090aac5b",
  //                 text: "Adagio assai",
  //               },
  //             },
  //             {
  //               id: "bc9bf1dc-3ff5-41cc-b1ed-b0e83714ad12",
  //               rank: 2,
  //               metreNumerator: 2,
  //               metreDenominator: 2,
  //               isCommonTime: false,
  //               isCutTime: true,
  //               fastestStructuralNotesPerBar: 8,
  //               isFastestStructuralNoteBelCanto: true,
  //               fastestStaccatoNotesPerBar: NaN,
  //               fastestRepeatedNotesPerBar: NaN,
  //               fastestOrnamentalNotesPerBar: NaN,
  //               comment: "",
  //               tempoIndication: {
  //                 id: "4d3b279d-7812-4d6c-a22e-624cd5f38a97",
  //                 text: "Andante",
  //               },
  //             },
  //           ],
  //         },
  //         {
  //           id: "2ae52619-ebf8-4ca7-a161-5da602c9b215",
  //           rank: 2,
  //           key: "C_SHARP_MAJOR",
  //           sections: [
  //             {
  //               id: "462c0b01-b997-4e88-ae6a-adea84dfe1a0",
  //               rank: 1,
  //               metreNumerator: 4,
  //               metreDenominator: 4,
  //               isCommonTime: true,
  //               isCutTime: false,
  //               fastestStructuralNotesPerBar: 14,
  //               isFastestStructuralNoteBelCanto: false,
  //               fastestStaccatoNotesPerBar: NaN,
  //               fastestRepeatedNotesPerBar: NaN,
  //               fastestOrnamentalNotesPerBar: NaN,
  //               comment: "",
  //               tempoIndication: {
  //                 id: "cec820e5-677e-4d7f-925b-8a6de4df5b0f",
  //                 text: "Allegretto scherzando",
  //               },
  //             },
  //             {
  //               id: "1fc056bf-349a-4b99-80d4-87c413cb965d",
  //               rank: 2,
  //               metreNumerator: 6,
  //               metreDenominator: 8,
  //               isCommonTime: false,
  //               isCutTime: false,
  //               fastestStructuralNotesPerBar: 16,
  //               isFastestStructuralNoteBelCanto: false,
  //               fastestStaccatoNotesPerBar: NaN,
  //               fastestRepeatedNotesPerBar: NaN,
  //               fastestOrnamentalNotesPerBar: NaN,
  //               comment: "",
  //               tempoIndication: {
  //                 id: "6a16e457-6aeb-4802-a59e-4ce3b91cafa2",
  //                 text: "-- None --",
  //               },
  //             },
  //           ],
  //         },
  //       ],
  //       pieceId: "aa075556-1571-4c8c-97be-2ae7bbeff06b",
  //       id: "febe69f0-0980-4a3a-90c1-fb31db1645d5",
  //       isNew: true,
  //     },
  //   ],
  //   metronomeMarks: [
  //     {
  //       sectionId: "fd6f53c1-e8b6-4f16-9de4-dddef1ea6281",
  //       bpm: 95,
  //       comment: undefined,
  //       beatUnit: "HALF",
  //       noMM: false,
  //       pieceVersionRank: 1,
  //       pieceVersionId: "5c28c5b4-54d2-43b5-b018-fcb03161837b",
  //     },
  //     {
  //       sectionId: "481e69a6-f0b6-4217-8a5a-b4c22a780a42",
  //       bpm: 68,
  //       comment: undefined,
  //       beatUnit: "EIGHTH",
  //       noMM: false,
  //       pieceVersionRank: 2,
  //       pieceVersionId: "a7b8fb74-c1e0-4981-a8fa-47212284c8fa",
  //     },
  //     {
  //       sectionId: "2cbcde95-cb6e-4a8b-9ba5-c47bf5113d6a",
  //       bpm: 64,
  //       comment: undefined,
  //       beatUnit: "HALF",
  //       noMM: false,
  //       pieceVersionRank: 3,
  //       pieceVersionId: "febe69f0-0980-4a3a-90c1-fb31db1645d5",
  //     },
  //     {
  //       sectionId: "bc9bf1dc-3ff5-41cc-b1ed-b0e83714ad12",
  //       noMM: true,
  //       pieceVersionRank: 3,
  //       pieceVersionId: "febe69f0-0980-4a3a-90c1-fb31db1645d5",
  //     },
  //     {
  //       sectionId: "462c0b01-b997-4e88-ae6a-adea84dfe1a0",
  //       bpm: 82,
  //       comment: undefined,
  //       beatUnit: "EIGHTH",
  //       noMM: false,
  //       pieceVersionRank: 3,
  //       pieceVersionId: "febe69f0-0980-4a3a-90c1-fb31db1645d5",
  //     },
  //     {
  //       sectionId: "1fc056bf-349a-4b99-80d4-87c413cb965d",
  //       bpm: 120,
  //       comment: undefined,
  //       beatUnit: "QUARTER",
  //       noMM: false,
  //       pieceVersionRank: 3,
  //       pieceVersionId: "febe69f0-0980-4a3a-90c1-fb31db1645d5",
  //     },
  //   ],
  //   tempoIndications: [],
  // };

  // If we are server-side, return null
  if (typeof window === "undefined") {
    return null;
  }

  const newOrgId = uuidv4();
  const newPersonId = uuidv4();
  const newPersonId2 = uuidv4();
  const newPieceId = uuidv4();
  const newPieceVersionId = uuidv4();
  const newTempoIndicationId = uuidv4();
  const newTempoIndicationId2 = uuidv4();

  return {
    formInfo: {
      currentStepRank: 5,
      introDone: true,
      isSourceOnPieceVersionformOpen: false,
      allSourcePieceVersionsDone: true,
    },
    mMSourceDescription: {
      id: undefined,
      title: "Top Edition",
      year: 1864,
      type: "EDITION",
      link: "https://super.piece",
      comment: "Wouhaou",
      references: [
        {
          type: "PLATE_NUMBER",
          reference: "484-erfer",
        },
        {
          type: "ISBN",
          reference: "468464-efrerf",
        },
      ],
      isNew: true,
    },
    mMSourceContributions: [
      {
        organization: {
          id: "c6125dab-3957-4b6e-aa43-218538318a4e",
          name: "C.F. Peters",
        },
        role: "EDITOR",
      },
      {
        person: {
          id: newPersonId,
          birthYear: 1945,
          deathYear: 2005,
          firstName: "Incroyable",
          lastName: "Man",
          isNew: true,
        },
        role: "TRANSCRIBER",
      },
      {
        organization: {
          id: newOrgId,
          name: "Smart Society",
          isNew: true,
        },
        role: "PUBLISHER",
      },
    ],
    mMSourcePieceVersions: [
      {
        pieceVersionId: "a264922e-7042-452d-abba-7375c601ad5b",
        rank: 1,
      },
      {
        pieceVersionId: newPieceVersionId,
        rank: 2,
      },
    ],
    organizations: [
      {
        id: newOrgId,
        name: "Smart Society",
        isNew: true,
      },
    ],
    persons: [
      {
        id: newPersonId,
        birthYear: 1945,
        deathYear: 2005,
        firstName: "Incroyable",
        lastName: "Man",
        isNew: true,
      },
      {
        firstName: "Jojo",
        lastName: "LeBon",
        birthYear: 1898,
        deathYear: 1967,
        id: newPersonId2,
        isNew: true,
      },
    ],
    pieces: [
      {
        title: "La First",
        nickname: "First",
        yearOfComposition: 1923,
        composerId: newPersonId2,
        id: newPieceId,
        isNew: true,
      },
    ],
    pieceVersions: [
      {
        category: "KEYBOARD",
        movements: [
          {
            id: "movements[0].id",
            rank: 1,
            key: "G_MAJOR",
            sections: [
              {
                id: "movements[0].sections[0].id",
                rank: 1,
                metreNumerator: 4,
                metreDenominator: 4,
                isCommonTime: true,
                isCutTime: false,
                fastestStructuralNotesPerBar: 32,
                isFastestStructuralNoteBelCanto: false,
                fastestStaccatoNotesPerBar: NaN,
                fastestRepeatedNotesPerBar: NaN,
                fastestOrnamentalNotesPerBar: NaN,
                comment: "",
                tempoIndication: {
                  id: newTempoIndicationId,
                  text: "rapido",
                },
              },
              {
                id: "movements[0].sections[1].id",
                rank: 2,
                metreNumerator: 4,
                metreDenominator: 4,
                isCommonTime: true,
                isCutTime: false,
                fastestStructuralNotesPerBar: 12,
                isFastestStructuralNoteBelCanto: true,
                fastestStaccatoNotesPerBar: 14,
                fastestRepeatedNotesPerBar: 7,
                fastestOrnamentalNotesPerBar: 24,
                comment: "Rapide !",
                tempoIndication: {
                  id: "7c555d45-bd87-41f3-93f7-00327bd04873",
                  text: "Adagio",
                },
              },
            ],
          },
          {
            id: "movements[1].id",
            rank: 2,
            key: "E_FLAT_MAJOR",
            sections: [
              {
                id: "movements[1].sections[0].id",
                rank: 1,
                metreNumerator: 2,
                metreDenominator: 2,
                isCommonTime: false,
                isCutTime: true,
                fastestStructuralNotesPerBar: 18,
                isFastestStructuralNoteBelCanto: false,
                fastestStaccatoNotesPerBar: NaN,
                fastestRepeatedNotesPerBar: NaN,
                fastestOrnamentalNotesPerBar: NaN,
                comment: "",
                tempoIndication: {
                  id: newTempoIndicationId2,
                  text: "top",
                },
              },
            ],
          },
        ],
        pieceId: newPieceId,
        id: newPieceVersionId,
        isNew: true,
      },
    ],
    metronomeMarks: [
      {
        sectionId: "movements[0].sections[0].id",
        bpm: 64,
        comment: "",
        beatUnit: "HALF",
      },
      {
        sectionId: "acb64690-99f7-432d-9e51-425a9d0a2770",
        bpm: 80,
        comment: "",
        beatUnit: "WHOLE",
      },
      {
        sectionId: "movements[0].sections[1].id",
        bpm: 108,
        comment: "",
        beatUnit: "QUARTER",
      },
      {
        sectionId: "movements[1].sections[0].id",
        bpm: 86,
        comment: "Lalala",
        beatUnit: "EIGHTH",
      },
    ],
    tempoIndications: [
      {
        id: newTempoIndicationId,
        text: "rapido",
        isNew: true,
      },
      {
        id: newTempoIndicationId2,
        text: "top",
        isNew: true,
      },
    ],
  } as FeedFormState;
}
