import { FeedStateEntity } from "@/types/editFormTypes";

export const steps: FeedStateEntity[] = [
  {
    rank: 0,
    id: "intro",
    title: "Introduction",
    isComplete: (state) => state?.formInfos?.introDone === true,
  },
  {
    rank: 1,
    id: "mMSource",
    title: "MM Source description",
    isComplete: (state) => !!state?.mMSsourceDescription?.id,
  },
  {
    rank: 2,
    id: "mMSourceContributions",
    title: "MM Source contributors",
    isComplete: (state) => (state?.mMSourceContributions?.length || 0) > 0,
  },
  {
    rank: 3,
    id: "mMSourcePieceVersions",
    title: "Pieces and Versions",
    isComplete: (state) =>
      (state?.mMSourcePieceVersions?.length || 0) > 0 &&
      !!state?.formInfos?.allSourcePieceVersionsDone,
  },
  {
    rank: 4,
    id: "metronomeMarks",
    title: "Metronome Marks",
    isComplete: (state) =>
      (state?.metronomeMarks?.length || 0) > 0 &&
      !!state?.formInfos?.allMetronomeMarksDone,
  },
  {
    rank: 5,
    id: "summary",
    title: "Summary",
    isComplete: () => false,
  },
];
