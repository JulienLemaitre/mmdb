export default function getFeedFormTestState() {
  return {
    formInfo: {
      currentStepRank: 3,
      introDone: true,
      isSourceOnPieceVersionformOpen: false,
    },
    mMSourceDescription: {
      title: "Qui est voluptatem",
      year: 2017,
      type: "EDITION",
      link: "https://www.nenerelorir.net",
      comment: "Doloremque consequun",
      references: [],
      isNew: true,
    },
    mMSourceContributions: [
      {
        organization: {
          id: "d3dc6a44-8319-4d56-a1f1-f63688411a28",
          name: "Breitkopf and Hartel",
        },
        role: "PUBLISHER",
      },
    ],
    mMSourcePieceVersions: [
      { pieceVersionId: "413035a6-73b9-48bb-a0ef-19806a0cc86c", rank: 1 },
      { pieceVersionId: "4de35fb3-95ac-4243-9e9e-7a758c898d94", rank: 2 },
      { pieceVersionId: "5e306467-1037-4a88-a08c-3029c63e2a21", rank: 3 },
      { pieceVersionId: "1220d9d3-7b14-4499-8711-dd1bf26ca90b", rank: 4 },
      { pieceVersionId: "d1812738-76b4-4608-b023-3fd4abfae9d6", rank: 5 },
      { pieceVersionId: "4f2dc1d4-b85c-4dba-8f82-6234b5785219", rank: 6 },
    ],
    collections: [
      {
        title: "First Col",
        composerId: "82c80bdc-5ef3-4eb9-b79e-297e7829cdef",
        id: "9ef9ae16-0b99-49fa-87ac-8d550826964a",
        isNew: true,
      },
      {
        title: "Crazy Collection",
        composerId: "7f9c6d20-3aae-477b-affb-b4893ab3b433",
        id: "72c985e1-c481-4195-b184-858baf897a26",
        isNew: true,
      },
    ],
    metronomeMarks: [],
    organizations: [
      {
        id: "d3dc6a44-8319-4d56-a1f1-f63688411a28",
        name: "Breitkopf and Hartel",
      },
    ],
    persons: [
      {
        id: "26571a52-cd4d-4bba-9bba-55c960009990",
        firstName: "Ludwig van",
        lastName: "Beethoven",
        birthYear: 1770,
        deathYear: 1827,
      },
      {
        id: "82c80bdc-5ef3-4eb9-b79e-297e7829cdef",
        firstName: "Moi",
        lastName: "Même",
        birthYear: 1980,
        deathYear: null,
        isNew: true,
      },
      {
        id: "7aea3c59-db47-4693-bfd1-4daa3e94abc5",
        firstName: "Johannes",
        lastName: "Brahms",
        birthYear: 1833,
        deathYear: 1897,
      },
      {
        id: "7f9c6d20-3aae-477b-affb-b4893ab3b433",
        firstName: "Toi",
        lastName: "Aussi",
        birthYear: 1984,
        deathYear: null,
        isNew: true,
      },
    ],
    pieces: [
      {
        id: "1c9dbe7c-ecd1-4d90-9115-ad8cb9eb45a4",
        title: "Fugue in D Major, Op. 137",
        yearOfComposition: 1817,
        composerId: "26571a52-cd4d-4bba-9bba-55c960009990",
      },
      {
        title: "First Col No.1",
        composerId: "82c80bdc-5ef3-4eb9-b79e-297e7829cdef",
        yearOfComposition: null,
        id: "f6a962b4-1482-4b3c-a0b1-e67457a44bdd",
        isNew: true,
        collectionId: "9ef9ae16-0b99-49fa-87ac-8d550826964a",
        collectionRank: 1,
      },
      {
        title: "First Col No.2",
        composerId: "82c80bdc-5ef3-4eb9-b79e-297e7829cdef",
        yearOfComposition: null,
        id: "aa71549a-c03b-48e2-a238-6895f059beed",
        isNew: true,
        collectionId: "9ef9ae16-0b99-49fa-87ac-8d550826964a",
        collectionRank: 2,
      },
      {
        id: "3289d371-fb10-4408-8a3c-248d93bc3f97",
        title: "Nänie, Op.82",
        yearOfComposition: 1881,
        composerId: "7aea3c59-db47-4693-bfd1-4daa3e94abc5",
      },
      {
        title: "Crazy Collection No.1",
        composerId: "7f9c6d20-3aae-477b-affb-b4893ab3b433",
        yearOfComposition: null,
        id: "3241a777-a561-40f4-b55c-b02079c3a936",
        isNew: true,
        collectionId: "72c985e1-c481-4195-b184-858baf897a26",
        collectionRank: 1,
      },
      {
        title: "Crazy Collection No.2",
        composerId: "7f9c6d20-3aae-477b-affb-b4893ab3b433",
        yearOfComposition: null,
        id: "592a9c61-61eb-4e01-901e-49baa32efd12",
        isNew: true,
        collectionId: "72c985e1-c481-4195-b184-858baf897a26",
        collectionRank: 2,
      },
    ],
    pieceVersions: [
      {
        id: "413035a6-73b9-48bb-a0ef-19806a0cc86c",
        category: "CHAMBER_INSTRUMENTAL",
        pieceId: "1c9dbe7c-ecd1-4d90-9115-ad8cb9eb45a4",
        movements: [
          {
            id: "f845c726-35e3-44b6-b5b7-c558ccc15eb4",
            rank: 1,
            key: "D_MAJOR",
            sections: [
              {
                id: "0e10422c-b9e6-4ce2-b501-0eb94d28ffa5",
                rank: 1,
                metreNumerator: 3,
                metreDenominator: 8,
                isCommonTime: false,
                isCutTime: false,
                tempoIndication: {
                  id: "9d7e2787-384e-4ca2-bda9-79fa9e5c34e7",
                  text: "Allegretto",
                },
                comment: "Fugue",
                fastestStaccatoNotesPerBar: 6,
                fastestStructuralNotesPerBar: 6,
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
            id: "6ebf9573-a2aa-4e70-afff-3b26b0a3ed5a",
            rank: 1,
            key: "D_MINOR",
            sections: [
              {
                id: "4d4f4bcc-4127-4a59-9ece-1abf380fdf42",
                metreNumerator: 4,
                metreDenominator: 4,
                isCommonTime: true,
                isCutTime: false,
                fastestStructuralNotesPerBar: 10,
                isFastestStructuralNoteBelCanto: false,
                tempoIndication: {
                  id: "49bb8d0c-75ee-4bac-aa87-c681128d657f",
                  text: "Adagio ma non troppo",
                },
                rank: 1,
              },
            ],
          },
        ],
        pieceId: "f6a962b4-1482-4b3c-a0b1-e67457a44bdd",
        id: "4de35fb3-95ac-4243-9e9e-7a758c898d94",
        isNew: true,
      },
      {
        category: "KEYBOARD",
        movements: [
          {
            id: "45ee195c-168e-4604-9037-c6c616854158",
            rank: 1,
            key: "D_MAJOR",
            sections: [
              {
                id: "0ac89e8d-2a8e-4b9f-b1ce-b3dcb79c9fb8",
                metreNumerator: 2,
                metreDenominator: 2,
                isCommonTime: false,
                isCutTime: true,
                fastestStructuralNotesPerBar: 8,
                isFastestStructuralNoteBelCanto: false,
                tempoIndication: {
                  id: "3f3db474-ec98-4eb7-afa4-8448154b7f80",
                  text: "Adagio lamentoso",
                },
                rank: 1,
              },
            ],
          },
        ],
        pieceId: "aa71549a-c03b-48e2-a238-6895f059beed",
        id: "5e306467-1037-4a88-a08c-3029c63e2a21",
        isNew: true,
      },
      {
        id: "1220d9d3-7b14-4499-8711-dd1bf26ca90b",
        category: "VOCAL",
        pieceId: "3289d371-fb10-4408-8a3c-248d93bc3f97",
        movements: [
          {
            id: "cd4c4a06-8613-4df7-984a-990280489863",
            rank: 1,
            key: "D_MAJOR",
            sections: [
              {
                id: "4bfd044a-fb74-4f4e-b549-d826a8c692a3",
                rank: 1,
                metreNumerator: 6,
                metreDenominator: 4,
                isCommonTime: false,
                isCutTime: false,
                tempoIndication: {
                  id: "d55aab25-1a39-483d-b766-5034f6331f6b",
                  text: "Andante",
                },
                fastestStructuralNotesPerBar: 12,
                isFastestStructuralNoteBelCanto: false,
              },
              {
                id: "50eab335-78dc-4917-8234-3b9fcb41ae89",
                rank: 2,
                metreNumerator: 4,
                metreDenominator: 4,
                isCommonTime: true,
                isCutTime: false,
                tempoIndication: {
                  id: "68cbb285-bc3b-42e5-a178-2515b48a7a83",
                  text: "Piu sostenuto",
                },
                fastestStructuralNotesPerBar: 12,
                isFastestStructuralNoteBelCanto: false,
              },
            ],
          },
        ],
      },
      {
        category: "CHAMBER_INSTRUMENTAL",
        movements: [
          {
            id: "9c6b1409-17d6-4e18-bcf9-23a8590eb53c",
            rank: 1,
            key: "G_FLAT_MAJOR",
            sections: [
              {
                id: "def37a55-0763-4b94-b060-d5b26e8c8f7e",
                metreNumerator: 4,
                metreDenominator: 4,
                isCommonTime: true,
                isCutTime: false,
                fastestStructuralNotesPerBar: 12,
                isFastestStructuralNoteBelCanto: false,
                tempoIndication: {
                  id: "b12835c3-eb84-444b-aa14-4b45ec612a87",
                  text: "Andante con moto e poco agitato",
                },
                rank: 1,
              },
            ],
          },
        ],
        pieceId: "3241a777-a561-40f4-b55c-b02079c3a936",
        id: "d1812738-76b4-4608-b023-3fd4abfae9d6",
        isNew: true,
      },
      {
        category: "CHAMBER_INSTRUMENTAL",
        movements: [
          {
            id: "ee9a27a8-cda8-4b0a-9b4c-cccc2a8fc9b9",
            rank: 1,
            key: "F_MAJOR",
            sections: [
              {
                id: "891df8e7-9a5a-400c-ac47-8cf57d5c252d",
                metreNumerator: 2,
                metreDenominator: 2,
                isCommonTime: false,
                isCutTime: true,
                fastestStructuralNotesPerBar: 14,
                isFastestStructuralNoteBelCanto: false,
                tempoIndication: {
                  id: "7eb504f7-f383-45e5-9d17-8a2f5bb11d00",
                  text: "Andante mosso",
                },
                rank: 1,
              },
            ],
          },
        ],
        pieceId: "592a9c61-61eb-4e01-901e-49baa32efd12",
        id: "4f2dc1d4-b85c-4dba-8f82-6234b5785219",
        isNew: true,
      },
    ],
    tempoIndications: [],
  };
}
