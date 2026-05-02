export default function getFeedFormTestState() {
  return {
    formInfo: { currentStepRank: 3, introDone: true },
    mMSourceDescription: {
      title: "Ipsum reprehenderit",
      year: 2011,
      isYearEstimated: true,
      type: "EDITION",
      link: "https://www.topepiqozikopy.info",
      comment: "Adipisicing culpa eo",
      references: [{ type: "PLATE_NUMBER", reference: "015-fr-258" }],
      isNew: true,
    },
    mMSourceContributions: [
      {
        person: {
          id: "1887cdff-3e51-427c-9c5b-26aadb077002",
          firstName: "Antonín",
          lastName: "Dvořák",
          birthYear: 1841,
          deathYear: 1904,
        },
        role: "MM_PROVIDER",
      },
    ],
    mMSourceOnPieceVersions: [],
    collections: [],
    metronomeMarks: [],
    organizations: [],
    persons: [
      {
        id: "1887cdff-3e51-427c-9c5b-26aadb077002",
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
