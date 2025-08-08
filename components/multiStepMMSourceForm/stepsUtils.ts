import { FeedFormStep } from "@/types/formTypes";
import Intro from "@/components/multiStepMMSourceForm/stepForms/Intro";
import MMSourceDescription from "@/components/multiStepMMSourceForm/stepForms/MMSourceDescription";
import MMSourceContributions from "@/components/multiStepMMSourceForm/stepForms/MMSourceContributions";
import MMSourcePieceVersions from "@/components/multiStepMMSourceForm/stepForms/MMSourcePieceVersions";
import MetronomeMarks from "@/components/multiStepMMSourceForm/stepForms/MetronomeMarks";
import FeedSummary from "@/components/multiStepMMSourceForm/stepForms/FeedSummary";
import { getSectionList } from "@/utils/getSectionList";
import { areMetronomeMarksCompleteForSections } from "@/utils/metronomeMarks/isComplete";

export const steps: FeedFormStep[] = [
  {
    rank: 0,
    id: "intro",
    actionTypes: ["formInfo"],
    title: "Introduction",
    isComplete: (state) => state?.formInfo?.introDone === true,
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
    actionTypes: ["mMSourceContributions", "formInfo"],
    title: "MM Source contributors",
    isComplete: (state) => (state?.mMSourceContributions?.length || 0) > 0,
    Component: MMSourceContributions,
  },
  {
    rank: 3,
    id: "mMSourcePieceVersions",
    actionTypes: [
      "collections",
      "editedSourceOnPieceVersions",
      "formInfo",
      "mMSourcePieceVersions",
      "organizations",
      "persons",
      "pieces",
      "pieceVersions",
      "tempoIndications",
    ],
    title: "Pieces and Versions",
    isComplete: (state) =>
      (state?.mMSourcePieceVersions?.length || 0) > 0 &&
      !!state?.formInfo?.allSourcePieceVersionsDone,
    Component: MMSourcePieceVersions,
  },
  {
    rank: 4,
    id: "metronomeMarks",
    actionTypes: ["metronomeMarks", "formInfo"],
    title: "Metronome Marks",
    isComplete: (state) => {
      // Need to build the sectionList and validate marks for each section
      if (!state?.mMSourcePieceVersions?.length) return false;

      // Ensure we have all required pieceVersions in state (isComplete must be sync)
      const neededIds = new Set(
        state.mMSourcePieceVersions.map((s) => s.pieceVersionId),
      );
      const inState = (state.pieceVersions || []).filter((pv) =>
        neededIds.has(pv.id),
      );
      if (inState.length !== neededIds.size) {
        // Missing pieceVersions => cannot assert completion synchronously
        return false;
      }

      const sectionList = getSectionList(state, inState);
      return areMetronomeMarksCompleteForSections(state, sectionList);
    },
    Component: MetronomeMarks,
  },
  {
    rank: 5,
    id: "summary",
    actionTypes: ["formInfo"],
    title: "Summary",
    isComplete: () => false,
    Component: FeedSummary,
  },
];

export function getStepById(stepId: string): FeedFormStep {
  return steps.find((step) => step.id === stepId) || steps[0];
}
export function getStepByRank(rank: number): FeedFormStep {
  return steps.find((step) => step.rank === rank) || steps[0];
}
