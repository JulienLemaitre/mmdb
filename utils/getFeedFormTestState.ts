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
      title: "Sint ipsam facilis r",
      year: 1994,
      type: "EDITION",
      link: "https://www.xyreq.org.uk",
      comment: "Quo eligendi archite",

      references: [
        {
          type: "ISBN",
          reference: "zretg9e84",
        },
      ],
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
      {
        person: {
          id: "805543b9-cdc3-488b-8624-cdf7ca86dc2d",
          firstName: "Albert",
          lastName: "Sanna",
          birthYear: 1899,
          deathYear: null,
        },
        role: "MM_PROVIDER",
      },
    ],
    mMSourcePieceVersions: [
      {
        pieceVersionId: "6ee09a43-f741-47d1-aa6a-946b1a37b2c1",
        rank: 1,
      },
    ],
    collections: [],
    metronomeMarks: [
      {
        sectionId: "60196476-3ce5-406b-9ea5-40620ae2593f",
        bpm: 64,
        comment: undefined,
        beatUnit: "DOTTED_HALF",
        noMM: false,
        pieceVersionRank: 1,
        pieceVersionId: "6ee09a43-f741-47d1-aa6a-946b1a37b2c1",
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
        id: "8b0a9010-3f31-46c8-9933-3112d765ae72",
        firstName: "J.S",
        lastName: "Bach",
        birthYear: 1685,
        deathYear: 1750,
      },
    ],
    pieces: [
      {
        id: "d8b070c7-d2f3-4845-8198-7cabf2e0bd87",
        title: "Invention in C major, BWV 772",
        yearOfComposition: 1723,
        composerId: "8b0a9010-3f31-46c8-9933-3112d765ae72",
      },
    ],
    pieceVersions: [
      {
        id: "6ee09a43-f741-47d1-aa6a-946b1a37b2c1",
        category: "KEYBOARD",
        pieceId: "d8b070c7-d2f3-4845-8198-7cabf2e0bd87",

        movements: [],
      },
    ],
    tempoIndications: [],
  };

  // return {
  //   formInfo: {
  //     currentStepRank: 5,
  //     introDone: true,
  //     isSourceOnPieceVersionformOpen: false,
  //     allSourcePieceVersionsDone: true,
  //   },
  //   mMSourceDescription: {
  //     title: "First Edition",
  //     year: 1833,
  //     type: "EDITION",
  //     link: "https://s9.imslp.org/files/imglnks/usimg/9/91/IMSLP86550-PMLP02312-Chopin_Nocturnes_Op_9_Kistner_995_First_Edition_1832.pdf",
  //     comment: "",
  //     references: [
  //       {
  //         type: "PLATE_NUMBER",
  //         reference: "995",
  //       },
  //     ],
  //     isNew: true,
  //   },
  //   mMSourceContributions: [
  //     {
  //       person: {
  //         id: "5444b82e-11cb-47b5-83a5-4777fdf8cead",
  //         birthYear: 1810,
  //         deathYear: 1849,
  //         firstName: "Frédéric",
  //         lastName: "Chopin",
  //         isNew: true,
  //       },
  //       role: "MM_PROVIDER",
  //     },
  //     {
  //       person: {
  //         id: "ed57254c-4275-409f-b64e-6703d46aad4f",
  //         birthYear: 1797,
  //         deathYear: 1844,
  //         firstName: "Eduard",
  //         lastName: "Kistner",
  //         isNew: true,
  //       },
  //       role: "PUBLISHER",
  //     },
  //   ],
  //   mMSourcePieceVersions: [
  //     {
  //       pieceVersionId: "04c918ae-6eba-48f8-835a-02fe6bba321a",
  //       rank: 1,
  //     },
  //     {
  //       pieceVersionId: "2dde17ee-1cb5-499f-adbc-1479396eb447",
  //       rank: 2,
  //     },
  //     {
  //       pieceVersionId: "1b2fd1c2-b226-4cb1-a2a8-d3c06f6a3108",
  //       rank: 3,
  //     },
  //   ],
  //   collections: [
  //     {
  //       title: "Nocturnes, Op.9",
  //       composerId: "5444b82e-11cb-47b5-83a5-4777fdf8cead",
  //       id: "cbadafd7-537d-4531-93b3-f7d47c1df25c",
  //       isNew: true,
  //     },
  //   ],
  //   metronomeMarks: [
  //     {
  //       sectionId: "c762b2b9-8d1c-440f-b603-21a53f3c8b4a",
  //       bpm: 116,
  //       beatUnit: "QUARTER",
  //       noMM: false,
  //       pieceVersionRank: 1,
  //       pieceVersionId: "04c918ae-6eba-48f8-835a-02fe6bba321a",
  //     },
  //     {
  //       sectionId: "9e1fffbe-445b-46bd-ad2e-48e9148e1a03",
  //       bpm: 132,
  //       beatUnit: "QUARTER",
  //       noMM: false,
  //       pieceVersionRank: 2,
  //       pieceVersionId: "2dde17ee-1cb5-499f-adbc-1479396eb447",
  //     },
  //     {
  //       sectionId: "67a60854-bb57-4c45-a481-8e9dd83568ae",
  //       bpm: 66,
  //       beatUnit: "QUARTER",
  //       noMM: false,
  //       pieceVersionRank: 3,
  //       pieceVersionId: "1b2fd1c2-b226-4cb1-a2a8-d3c06f6a3108",
  //     },
  //     {
  //       sectionId: "217a2d03-bcfc-428c-82a9-b022da22cff7",
  //       noMM: true,
  //       pieceVersionRank: 3,
  //       pieceVersionId: "1b2fd1c2-b226-4cb1-a2a8-d3c06f6a3108",
  //     },
  //   ],
  //   organizations: [],
  //   persons: [
  //     {
  //       id: "5444b82e-11cb-47b5-83a5-4777fdf8cead",
  //       birthYear: 1810,
  //       deathYear: 1849,
  //       firstName: "Frédéric",
  //       lastName: "Chopin",
  //       isNew: true,
  //     },
  //     {
  //       id: "ed57254c-4275-409f-b64e-6703d46aad4f",
  //       birthYear: 1797,
  //       deathYear: 1844,
  //       firstName: "Eduard",
  //       lastName: "Kistner",
  //       isNew: true,
  //     },
  //   ],
  //   pieces: [
  //     {
  //       title: "Nocturnes, Op.9 No.1",
  //       yearOfComposition: 1830,
  //       composerId: "5444b82e-11cb-47b5-83a5-4777fdf8cead",
  //       id: "0743fa7d-2d78-4069-991c-634cfa12a853",
  //       isNew: true,
  //       collectionId: "cbadafd7-537d-4531-93b3-f7d47c1df25c",
  //       collectionRank: 1,
  //     },
  //     {
  //       title: "Nocturnes, Op.9 No.2",
  //       yearOfComposition: 1830,
  //       composerId: "5444b82e-11cb-47b5-83a5-4777fdf8cead",
  //       id: "7355847f-5e50-4d31-9eff-2c0b1731fb17",
  //       isNew: true,
  //       collectionId: "cbadafd7-537d-4531-93b3-f7d47c1df25c",
  //       collectionRank: 2,
  //     },
  //     {
  //       title: "Nocturnes, Op.9 No.3",
  //       yearOfComposition: 1830,
  //       composerId: "5444b82e-11cb-47b5-83a5-4777fdf8cead",
  //       id: "8115361f-404f-459e-9724-68c4cdb335c0",
  //       isNew: true,
  //       collectionId: "cbadafd7-537d-4531-93b3-f7d47c1df25c",
  //       collectionRank: 3,
  //     },
  //   ],
  //   pieceVersions: [
  //     {
  //       category: "KEYBOARD",
  //       movements: [
  //         {
  //           id: "b232c2e5-570c-4c40-97ec-61f70728cc61",
  //           rank: 1,
  //           key: "B_FLAT_MINOR",
  //           sections: [
  //             {
  //               id: "c762b2b9-8d1c-440f-b603-21a53f3c8b4a",
  //               metreNumerator: 6,
  //               metreDenominator: 4,
  //               isCommonTime: false,
  //               isCutTime: false,
  //               fastestStructuralNotesPerBar: 40,
  //               isFastestStructuralNoteBelCanto: true,
  //               fastestRepeatedNotesPerBar: 12,
  //               tempoIndication: {
  //                 id: "05a0cb9a-49fd-46d5-8f6c-b6752dc37e7f",
  //                 text: "Larghetto",
  //               },
  //               rank: 1,
  //             },
  //           ],
  //         },
  //       ],
  //       pieceId: "0743fa7d-2d78-4069-991c-634cfa12a853",
  //       id: "04c918ae-6eba-48f8-835a-02fe6bba321a",
  //       isNew: true,
  //     },
  //     {
  //       category: "KEYBOARD",
  //       movements: [
  //         {
  //           id: "f997d04c-3945-4553-9a5d-cd3ab32de87a",
  //           rank: 1,
  //           key: "E_FLAT_MAJOR",
  //           sections: [
  //             {
  //               id: "9e1fffbe-445b-46bd-ad2e-48e9148e1a03",
  //               metreNumerator: 12,
  //               metreDenominator: 8,
  //               isCommonTime: false,
  //               isCutTime: false,
  //               fastestStructuralNotesPerBar: 48,
  //               isFastestStructuralNoteBelCanto: true,
  //               fastestOrnamentalNotesPerBar: 72,
  //               tempoIndication: {
  //                 id: "79277b3a-8ce4-4066-965e-416b5581ccd8",
  //                 text: "Andante",
  //               },
  //               rank: 1,
  //             },
  //           ],
  //         },
  //       ],
  //       pieceId: "7355847f-5e50-4d31-9eff-2c0b1731fb17",
  //       id: "2dde17ee-1cb5-499f-adbc-1479396eb447",
  //       isNew: true,
  //     },
  //     {
  //       category: "KEYBOARD",
  //       movements: [
  //         {
  //           id: "375fb541-4e35-499e-96b4-a99bf9edea04",
  //           rank: 1,
  //           key: "B_MAJOR",
  //           sections: [
  //             {
  //               id: "67a60854-bb57-4c45-a481-8e9dd83568ae",
  //               metreNumerator: 6,
  //               metreDenominator: 8,
  //               isCommonTime: false,
  //               isCutTime: false,
  //               fastestStructuralNotesPerBar: 30,
  //               isFastestStructuralNoteBelCanto: true,
  //               fastestStaccatoNotesPerBar: 24,
  //               tempoIndication: {
  //                 id: "b1136290-812c-4ed8-9487-ec7d2ba92499",
  //                 text: "Allegretto",
  //               },
  //               rank: 1,
  //             },
  //             {
  //               id: "217a2d03-bcfc-428c-82a9-b022da22cff7",
  //               metreNumerator: 2,
  //               metreDenominator: 2,
  //               isCommonTime: false,
  //               isCutTime: true,
  //               fastestStructuralNotesPerBar: 12,
  //               isFastestStructuralNoteBelCanto: false,
  //               tempoIndication: {
  //                 id: "2723fad8-b08a-4e28-8e1a-03c3b260eea8",
  //                 text: "Agitato",
  //               },
  //               rank: 2,
  //             },
  //           ],
  //         },
  //       ],
  //       pieceId: "8115361f-404f-459e-9724-68c4cdb335c0",
  //       id: "1b2fd1c2-b226-4cb1-a2a8-d3c06f6a3108",
  //       isNew: true,
  //     },
  //   ],
  //   tempoIndications: [],
  // };
}
