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
    persons: [
      {
        id: "16ff0135-775d-4fde-8b3b-24c5a375b369",
        firstName: "Ludwig van",
        lastName: "Beethoven",
        birthYear: 1770,
        deathYear: 1827,
      },
    ],
    pieces: [],
    pieceVersions: [],
    metronomeMarks: [],
    tempoIndications: [],
    collections: [
      {
        id: "85a3a023-f816-487e-9a73-bd428ef32f7d",
        title: "Op.18",
        pieces: [
          {
            id: "30148fab-35f1-48e9-9ab3-b023c484b5de",
          },
          {
            id: "939b01af-9b53-4af1-86a7-978a060c2879",
          },
          {
            id: "31608288-e188-45d3-967e-aa82041de543",
          },
          {
            id: "154f942f-4cf2-4933-a7f5-b2211f384aa5",
          },
          {
            id: "51ed6729-41ec-4b13-ae6b-2149e208acd4",
          },
          {
            id: "b3db24c2-32a9-4d40-b265-cd441f9a0573",
          },
        ],
      },
    ],
  };

  // return {
  //   formInfo: {
  //     currentStepRank: 3,
  //     introDone: true,
  //     isSourceOnPieceVersionformOpen: false,
  //   },
  //   mMSourceDescription: {
  //     id: undefined,
  //     title: "",
  //     year: 1984,
  //     type: "BOOK",
  //     link: "https://www.fokiwykymabyp.net",
  //     comment: "Whouahou !",
  //     references: [
  //       {
  //         type: "ISMN",
  //         reference: "egrretgre49+8--eg",
  //       },
  //     ],
  //     isNew: true,
  //   },
  //   mMSourceContributions: [
  //     {
  //       organization: {
  //         id: "adf0bdbb-eae3-45a5-90bf-6db24733b8f9",
  //         name: "A. Diabelli et Comp.",
  //       },
  //       role: "PUBLISHER",
  //     },
  //   ],
  //   mMSourcePieceVersions: [],
  //   organizations: [
  //     {
  //       id: "adf0bdbb-eae3-45a5-90bf-6db24733b8f9",
  //       name: "A. Diabelli et Comp.",
  //     },
  //   ],
  //   persons: [
  //     {
  //       id: "16ff0135-775d-4fde-8b3b-24c5a375b369",
  //       firstName: "Ludwig van",
  //       lastName: "Beethoven",
  //       birthYear: 1770,
  //       deathYear: 1827,
  //     },
  //   ],
  //   pieces: [],
  //   pieceVersions: [],
  //   metronomeMarks: [],
  //   tempoIndications: [],
  //   collections: [
  //     {
  //       id: "85a3a023-f816-487e-9a73-bd428ef32f7d",
  //       title: "Op.18",
  //       pieces: [
  //         {
  //           id: "30148fab-35f1-48e9-9ab3-b023c484b5de",
  //         },
  //         {
  //           id: "939b01af-9b53-4af1-86a7-978a060c2879",
  //         },
  //         {
  //           id: "31608288-e188-45d3-967e-aa82041de543",
  //         },
  //         {
  //           id: "154f942f-4cf2-4933-a7f5-b2211f384aa5",
  //         },
  //         {
  //           id: "51ed6729-41ec-4b13-ae6b-2149e208acd4",
  //         },
  //         {
  //           id: "b3db24c2-32a9-4d40-b265-cd441f9a0573",
  //         },
  //       ],
  //     },
  //   ],
  // };

  // as FeedFormState;
}
