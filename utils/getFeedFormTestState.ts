export default function getFeedFormTestState() {
  return {
    formInfo: {
      currentStepRank: 3,
      introDone: true,
    },
    mMSourceDescription: {
      id: undefined,
      title: "Excepteur voluptatum",
      year: 2003,
      type: "EDITION",
      link: "https://www.fegyzavyxoqacy.net",
      comment: "Voluptate qui optio",
      references: [],
      isNew: true,
    },
    mMSourceContributions: [
      {
        person: {
          id: "2b91fee8-2a4e-49ca-bcd9-bec36807a640",
          firstName: "Antonín",
          lastName: "Dvořák",
          birthYear: 1841,
          deathYear: 1904,
        },
        role: "MM_PROVIDER",
      },
    ],
    mMSourcePieceVersions: [],
    collections: [],
    metronomeMarks: [],
    organizations: [],
    persons: [
      {
        id: "2b91fee8-2a4e-49ca-bcd9-bec36807a640",
        firstName: "Antonín",
        lastName: "Dvořák",
        birthYear: 1841,
        deathYear: 1904,
      },
    ],
    pieces: [],
    pieceVersions: [],
    tempoIndications: [],
  };
}
