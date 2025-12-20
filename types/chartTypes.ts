export type ChartDatum = {
  noteType: "structural" | "repeated" | "ornamental" | "staccato";
  xVal: number;
  yVal: number;
  meta: {
    noteType: "structural" | "repeated" | "ornamental" | "staccato";
    composer: string;
    piece: {
      id: string;
      collectionId: string;
      title: string;
      yearOfComposition: string;
    };
    movement: {
      rank?: number;
    };
    section: {
      rank?: number;
      metreNumerator: number;
      metreDenominator: number;
      isCommonTime: boolean;
      isCutTime: boolean;
      comment: string;
      tempoIndication: {
        id: string;
        text: string;
      };
    };
    mm: {
      id: string;
      mMSource: {
        id: string;
        title: string;
        type: string;
        link: string;
        year: string;
        isYearEstimated: boolean;
        references: string;
        contributions: string;
        creator: string;
        creatorId: string;
        comment: string;
        createdAt: string;
        updatedAt: string;
      };
      mMSourceId: string;
      beatUnit: string;
      bpm: number;
      notesPerSecond: number;
      notesPerBar: number;
      createdAt: string;
      updatedAt: string;
      sectionId: string;
      comment: string;
    };
  };
};
