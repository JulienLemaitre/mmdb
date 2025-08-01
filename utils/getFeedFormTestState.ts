export default function getFeedFormTestState() {
  return {
    formInfo: {
      currentStepRank: 4,
      introDone: true,
      isSourceOnPieceVersionformOpen: false,
      formType: "single",
      allSourcePieceVersionsDone: true,
    },
    mMSourceContributions: [
      {
        organization: {
          id: "d3dc6a44-8319-4d56-a1f1-f63688411a28",
          name: "Breitkopf and Hartel",
        },
        role: "MM_PROVIDER",
      },
    ],
    mMSourcePieceVersions: [
      { pieceVersionId: "e267b0a4-6304-4403-8d88-04442c87cadc", rank: 1 },
      { pieceVersionId: "c8c6274e-0bfc-40d6-86d2-f16b99017663", rank: 2 },
      { pieceVersionId: "69ad3242-01b6-426b-9d92-bdc812f0d6db", rank: 3 },
      { pieceVersionId: "3ad18258-ab2b-4cf5-85a2-b8f77f47901e", rank: 4 },
    ],
    collections: [
      {
        id: "e5af1a98-efe6-466c-bb5e-55338a66ecbf",
        composerId: "6e7d2a3d-73d0-463f-bf56-770ae87a315c",
        title: "New one",
      },
    ],
    metronomeMarks: [
      {
        sectionId: "af756b48-43f1-4891-ae03-1d68417634f8",
        bpm: 86,
        beatUnit: "WHOLE",
        noMM: false,
        pieceVersionRank: 1,
        pieceVersionId: "e267b0a4-6304-4403-8d88-04442c87cadc",
      },
      {
        sectionId: "d6e94a98-a6ec-4635-885f-67bfbd03a0f9",
        bpm: 64,
        comment: "My comment",
        beatUnit: "HALF",
        noMM: false,
        pieceVersionRank: 2,
        pieceVersionId: "c8c6274e-0bfc-40d6-86d2-f16b99017663",
      },
      {
        sectionId: "2217ce3a-812c-4d31-997e-41d62ffe9d60",
        bpm: 68,
        beatUnit: "QUARTER",
        noMM: false,
        pieceVersionRank: 4,
        pieceVersionId: "3ad18258-ab2b-4cf5-85a2-b8f77f47901e",
      },
    ],
    organizations: [
      {
        id: "d3dc6a44-8319-4d56-a1f1-f63688411a28",
        name: "Breitkopf and Hartel",
      },
    ],
    persons: [
      {
        id: "c7e5984a-1e0d-454a-b3f7-c17f69d05138",
        firstName: "Carl",
        lastName: "Czerny",
        birthYear: 1791,
        deathYear: 1857,
      },
      {
        id: "9899a0fd-547a-4991-af89-48ccc01ac8b9",
        firstName: "Robert",
        lastName: "Schumann",
        birthYear: 1810,
        deathYear: 1856,
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
        id: "90e164d8-60ac-420a-8f42-37469b8ef639",
        title: "The School of Velocity, Op.299 No.5",
        yearOfComposition: 1833,
        collectionId: "4862672a-7810-471d-8bd4-ff40566363a8",
        collectionRank: 5,
        composerId: "c7e5984a-1e0d-454a-b3f7-c17f69d05138",
      },
      {
        id: "43ae321d-da12-4d85-9c56-993535061f64",
        title: "Kinderszenen, Op.15 No.4",
        yearOfComposition: 1838,
        collectionId: "6851732a-964f-4d9d-afe0-69702ea3ba2f",
        collectionRank: 4,
        composerId: "9899a0fd-547a-4991-af89-48ccc01ac8b9",
      },
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
      {
        category: "VOCAL",
        movements: [
          {
            id: "557a1624-5a5a-45ad-81a1-e49d084f4b2d",
            rank: 1,
            key: "B_FLAT_MINOR",
            sections: [
              {
                id: "2217ce3a-812c-4d31-997e-41d62ffe9d60",
                metreNumerator: 4,
                metreDenominator: 4,
                isCommonTime: true,
                isCutTime: false,
                fastestStructuralNotesPerBar: 12,
                isFastestStructuralNoteBelCanto: false,
                tempoIndication: {
                  id: "90c1e12b-5ed7-47fe-a2cd-41197a598ad6",
                  text: "Adagio Cantabile",
                },
                rank: 1,
              },
            ],
          },
        ],
        pieceId: "43ae321d-da12-4d85-9c56-993535061f64",
        id: "3ad18258-ab2b-4cf5-85a2-b8f77f47901e",
        isNew: true,
      },
      {
        category: "ORCHESTRAL",
        movements: [
          {
            id: "71c835bb-32a8-45e5-825b-df3961057249",
            rank: 1,
            key: "A_MINOR",
            sections: [
              {
                id: "dfcb65fe-c9a4-430b-8e2d-47b4cda497fa",
                metreNumerator: 4,
                metreDenominator: 4,
                isCommonTime: true,
                isCutTime: false,
                fastestStructuralNotesPerBar: 12,
                isFastestStructuralNoteBelCanto: false,
                tempoIndication: {
                  id: "1cdbcecb-8b02-4472-aca5-65635374a222",
                  text: "Adagio affettuoso ed appassionato",
                },
                rank: 1,
              },
              {
                id: "ccaafa07-e4a0-464a-9a15-6708fd5e8522",
                metreNumerator: 2,
                metreDenominator: 2,
                isCommonTime: false,
                isCutTime: true,
                fastestStructuralNotesPerBar: 10,
                isFastestStructuralNoteBelCanto: false,
                tempoIndication: {
                  id: "0a39bd17-b29a-4cd9-8f22-f2045f3604c1",
                  text: "Andante cantabile",
                },
                rank: 2,
              },
            ],
          },
          {
            id: "3e5c8ac3-3b9b-4c1a-b017-d39bba23759b",
            rank: 2,
            key: "E_FLAT_MAJOR",
            sections: [
              {
                id: "859fe394-ecc0-444d-97f6-90bdf2de0d6d",
                metreNumerator: 4,
                metreDenominator: 4,
                isCommonTime: true,
                isCutTime: false,
                fastestStructuralNotesPerBar: 8,
                isFastestStructuralNoteBelCanto: false,
                tempoIndication: {
                  id: "90c1e12b-5ed7-47fe-a2cd-41197a598ad6",
                  text: "Adagio Cantabile",
                },
                rank: 1,
              },
              {
                id: "21109b6c-2779-48ab-9859-b28f91e12c89",
                metreNumerator: 3,
                metreDenominator: 4,
                isCommonTime: false,
                isCutTime: false,
                fastestStructuralNotesPerBar: 14,
                isFastestStructuralNoteBelCanto: false,
                tempoIndication: {
                  id: "155b610b-ea86-4327-9854-5714f1b73e4b",
                  text: "Molto Allegro e veloce",
                },
                rank: 2,
              },
              {
                id: "6fbc5101-d66d-4aa2-89c1-f44b65f706a8",
                metreNumerator: 4,
                metreDenominator: 4,
                isCommonTime: true,
                isCutTime: false,
                fastestStructuralNotesPerBar: 10,
                isFastestStructuralNoteBelCanto: false,
                tempoIndication: {
                  id: "56979cbc-265f-4380-a67f-d62086b813d0",
                  text: "Poco Adagio",
                },
                rank: 3,
              },
            ],
          },
        ],
        pieceId: "90e164d8-60ac-420a-8f42-37469b8ef639",
        id: "69ad3242-01b6-426b-9d92-bdc812f0d6db",
        isNew: true,
      },
    ],
    tempoIndications: [],
    mMSourceDescription: {
      title: "In enim laboris plac",
      year: 2017,
      type: "EDITION",
      link: "https://www.qerocedehuzuvi.net",
      comment: "Eligendi iusto alias",
      references: [],
      isNew: true,
    },
  };
}
