export default function getFeedFormTestState() {
  return {
    formInfo: {
      currentStepRank: 3,
      introDone: true,
      isSourceOnPieceVersionformOpen: false,
      formType: "collection",
    },
    mMSourceDescription: {
      title: "In dolorem proident",
      year: 1996,
      type: "EDITION",
      link: "https://www.wyriwykywewi.org.uk",
      comment: "Voluptate dolor eaqu",
      references: [],
      isNew: true,
    },
    mMSourceContributions: [
      {
        person: {
          id: "c7e5984a-1e0d-454a-b3f7-c17f69d05138",
          firstName: "Carl",
          lastName: "Czerny",
          birthYear: 1791,
          deathYear: 1857,
        },
        role: "MM_PROVIDER",
      },
    ],
    mMSourcePieceVersions: [
      { pieceVersionId: "e267b0a4-6304-4403-8d88-04442c87cadc", rank: 1 },
      { pieceVersionId: "c8c6274e-0bfc-40d6-86d2-f16b99017663", rank: 2 },
    ],
    collections: [
      {
        id: "e5af1a98-efe6-466c-bb5e-55338a66ecbf",
        composerId: "6e7d2a3d-73d0-463f-bf56-770ae87a315c",
        title: "New one",
      },
    ],
    metronomeMarks: [],
    organizations: [],
    persons: [
      {
        id: "c7e5984a-1e0d-454a-b3f7-c17f69d05138",
        firstName: "Carl",
        lastName: "Czerny",
        birthYear: 1791,
        deathYear: 1857,
      },
      {
        id: "6e7d2a3d-73d0-463f-bf56-770ae87a315c",
        firstName: "Moi",
        lastName: "Même",
        birthYear: 1984,
        deathYear: null,
      },
    ],
    pieces: [
      {
        id: "696606c0-b63c-427a-90ab-ae365e1ef30b",
        title: "New one No.1",
        collectionId: "e5af1a98-efe6-466c-bb5e-55338a66ecbf",
        collectionRank: 1,
        composerId: "6e7d2a3d-73d0-463f-bf56-770ae87a315c",
      },
      {
        id: "452c15d0-4d2a-4174-8fb8-da4f200ac793",
        title: "New one No.2",
        collectionId: "e5af1a98-efe6-466c-bb5e-55338a66ecbf",
        collectionRank: 2,
        composerId: "6e7d2a3d-73d0-463f-bf56-770ae87a315c",
      },
    ],
    pieceVersions: [
      {
        id: "e267b0a4-6304-4403-8d88-04442c87cadc",
        category: "OTHER",
        pieceId: "696606c0-b63c-427a-90ab-ae365e1ef30b",
        movements: [
          {
            id: "d4230ef9-9a5f-4c5d-9a2b-33c089a5d002",
            rank: 1,
            key: "B_FLAT_MAJOR",
            sections: [
              {
                id: "d6e94a98-a6ec-4635-885f-67bfbd03a0f9",
                rank: 1,
                metreNumerator: 4,
                metreDenominator: 4,
                isCommonTime: true,
                isCutTime: false,
                tempoIndication: {
                  id: "126eba39-435a-4488-b420-6a8587a7349e",
                  text: "Adagio cantabile",
                },
                fastestStructuralNotesPerBar: 5,
                isFastestStructuralNoteBelCanto: false,
              },
            ],
          },
        ],
      },
      {
        id: "c8c6274e-0bfc-40d6-86d2-f16b99017663",
        category: "ORCHESTRAL",
        pieceId: "452c15d0-4d2a-4174-8fb8-da4f200ac793",
        movements: [
          {
            id: "54c865ec-6cd6-4e0a-a974-2a52642bb9f3",
            rank: 1,
            key: "A_SHARP_MAJOR",
            sections: [
              {
                id: "bfea19e5-6be7-446b-8b9e-55f106950b38",
                rank: 1,
                metreNumerator: 2,
                metreDenominator: 2,
                isCommonTime: false,
                isCutTime: true,
                tempoIndication: {
                  id: "126eba39-435a-4488-b420-6a8587a7349e",
                  text: "Adagio cantabile",
                },
                fastestStructuralNotesPerBar: 8,
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
