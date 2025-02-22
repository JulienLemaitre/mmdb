export default function getFeedFormTestState() {
  return {
    formInfo: {
      currentStepRank: 5,
      introDone: true,
      isSourceOnPieceVersionformOpen: false,
      allSourcePieceVersionsDone: true,
    },
    mMSourceDescription: {
      title: "Keyboard Sonata in D minor, K.1",
      year: 1910,
      type: "EDITION",
      link: "https://s9.imslp.org/files/imglnks/usimg/4/40/IMSLP626410-PMLP330125-Sonata_K._1_(as_L._366).pdf",
      comment: "",
      references: [{ type: "PLATE_NUMBER", reference: "E.R. 548" }],
      isNew: true,
    },
    mMSourceContributions: [
      {
        organization: {
          id: "c8c8adb8-fea2-4cf6-9daf-0aab8581280d",
          name: "G. Ricordi & C.",
          isNew: true,
        },
        role: "PUBLISHER",
      },
      {
        person: {
          id: "dce83887-3514-4ec5-8aa0-f6096e642121",
          birthYear: 1864,
          deathYear: 1945,
          firstName: "Alessandro",
          lastName: "Longo",
          isNew: true,
        },
        role: "EDITOR",
      },
      {
        person: {
          id: "dce83887-3514-4ec5-8aa0-f6096e642121",
          birthYear: 1864,
          deathYear: 1945,
          firstName: "Alessandro",
          lastName: "Longo",
          isNew: true,
        },
        role: "MM_PROVIDER",
      },
    ],
    mMSourcePieceVersions: [
      { pieceVersionId: "2ecdc5c5-838b-46f4-b40d-def78f06db77", rank: 1 },
    ],
    collections: [],
    metronomeMarks: [
      {
        sectionId: "dc0bfb56-ab9f-457d-91ca-a030e77f521f",
        bpm: 112,
        beatUnit: "QUARTER",
        noMM: false,
        pieceVersionRank: 1,
        pieceVersionId: "2ecdc5c5-838b-46f4-b40d-def78f06db77",
      },
    ],
    organizations: [
      {
        id: "c8c8adb8-fea2-4cf6-9daf-0aab8581280d",
        name: "G. Ricordi & C.",
        isNew: true,
      },
    ],
    persons: [
      {
        id: "dce83887-3514-4ec5-8aa0-f6096e642121",
        birthYear: 1864,
        deathYear: 1945,
        firstName: "Alessandro",
        lastName: "Longo",
        isNew: true,
      },
      {
        id: "6cdbd9dd-9f3d-4181-87d4-829185229a51",
        firstName: "Domenico",
        lastName: "Scarlatti",
        birthYear: 1685,
        deathYear: 1757,
        isNew: true,
      },
    ],
    pieces: [
      {
        title: "Keyboard Sonata in D minor, K.1",
        yearOfComposition: 1738,
        composerId: "6cdbd9dd-9f3d-4181-87d4-829185229a51",
        id: "e58a6fbb-02f1-476c-afb2-596b5560fd16",
        isNew: true,
      },
    ],
    pieceVersions: [
      {
        category: "KEYBOARD",
        movements: [
          {
            id: "8f6ba760-b429-4e28-9be9-b2e05c63a9b8",
            rank: 1,
            key: "D_MINOR",
            sections: [
              {
                id: "dc0bfb56-ab9f-457d-91ca-a030e77f521f",
                metreNumerator: 4,
                metreDenominator: 4,
                isCommonTime: true,
                isCutTime: false,
                fastestStructuralNotesPerBar: 16,
                isFastestStructuralNoteBelCanto: false,
                fastestStaccatoNotesPerBar: 8,
                fastestRepeatedNotesPerBar: 8,
                fastestOrnamentalNotesPerBar: 32,
                tempoIndication: {
                  id: "9bb1b928-d91c-4621-a5dd-03c1826ea563",
                  text: "Allegro",
                },
                rank: 1,
              },
            ],
          },
        ],
        pieceId: "e58a6fbb-02f1-476c-afb2-596b5560fd16",
        id: "2ecdc5c5-838b-46f4-b40d-def78f06db77",
        isNew: true,
      },
    ],
    tempoIndications: [],
  };
}
