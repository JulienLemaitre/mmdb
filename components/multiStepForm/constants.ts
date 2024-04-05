import { FeedStateEntity } from "@/types/editFormTypes";
import Intro from "@/components/multiStepForm/stepForms/Intro";
import MMSourceDescription from "@/components/multiStepForm/stepForms/MMSourceDescription";
import MMSourceContributions from "@/components/multiStepForm/stepForms/MMSourceContributions";
import MMSourcePieceVersions from "@/components/multiStepForm/stepForms/MMSourcePieceVersions";

export const steps: FeedStateEntity[] = [
  {
    rank: 0,
    id: "intro",
    actionTypes: ["formInfos"],
    title: "Introduction",
    isComplete: (state) => state?.formInfos?.introDone === true,
    Component: Intro,
  },
  {
    rank: 1,
    id: "mMSourceDescription",
    actionTypes: ["mMSourceDescription"],
    title: "MM Source description",
    isComplete: (state) => !!state?.mMSourceDescription,
    Component: MMSourceDescription,
  },
  {
    rank: 2,
    id: "mMSourceContributions",
    actionTypes: ["mMSourceContributions", "formInfos"],
    title: "MM Source contributors",
    isComplete: (state) =>
      (state?.mMSourceContributions?.selectedContributions?.length || 0) > 0,
    Component: MMSourceContributions,
  },
  {
    rank: 3,
    id: "mMSourcePieceVersions",
    actionTypes: ["mMSourcePieceVersions", "formInfos"],
    title: "Pieces and Versions",
    isComplete: (state) =>
      (state?.mMSourcePieceVersions?.length || 0) > 0 &&
      !!state?.formInfos?.allSourcePieceVersionsDone,
    Component: MMSourcePieceVersions,
  },
  {
    rank: 4,
    id: "metronomeMarks",
    actionTypes: ["metronomeMarks", "formInfos"],
    title: "Metronome Marks",
    isComplete: (state) =>
      (state?.metronomeMarks?.length || 0) > 0 &&
      !!state?.formInfos?.allMetronomeMarksDone,
  },
  {
    rank: 5,
    id: "summary",
    actionTypes: ["formInfos"],
    title: "Summary",
    isComplete: () => false,
  },
];

export function getStepById(stepId: string): FeedStateEntity {
  return steps.find((step) => step.id === stepId) || steps[0];
}
export function getStepByRank(rank: number): FeedStateEntity {
  return steps.find((step) => step.rank === rank) || steps[0];
}
