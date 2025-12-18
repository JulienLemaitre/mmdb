import { SinglePieceVersionFormStep } from "@/types/formTypes";
import ComposerSelectOrCreate from "@/features/feed/multiStepSinglePieceVersionForm/stepForms/ComposerSelectOrCreate";
import PieceSelectOrCreate from "@/features/feed/multiStepSinglePieceVersionForm/stepForms/PieceSelectOrCreate";
import PieceVersionSelectOrCreate from "@/features/feed/multiStepSinglePieceVersionForm/stepForms/PieceVersionSelectOrCreate";
import Summary from "@/features/feed/multiStepSinglePieceVersionForm/stepForms/Summary";
import { SinglePieceVersionFormState } from "@/types/singlePieceVersionFormTypes";

export const singlePieceFormSteps: SinglePieceVersionFormStep[] = [
  {
    id: "composer",
    title: "Composer",
    rank: 0,
    isComplete: (state: SinglePieceVersionFormState) => !!state.composer?.id,
    Component: ComposerSelectOrCreate,
    actionTypes: ["composer"],
  },
  {
    id: "piece",
    title: "Piece",
    rank: 1,
    isComplete: (state: SinglePieceVersionFormState) => !!state.piece?.id,
    Component: PieceSelectOrCreate,
    actionTypes: ["piece"],
  },
  {
    id: "pieceVersion",
    title: "Piece Version",
    rank: 2,
    isComplete: (state: SinglePieceVersionFormState) =>
      !!state.pieceVersion?.id,
    Component: PieceVersionSelectOrCreate,
    actionTypes: ["pieceVersion"],
  },
  {
    id: "summary",
    title: "Summary",
    rank: 3,
    isComplete: (state: SinglePieceVersionFormState) => false,
    Component: Summary,
    actionTypes: ["reset", "formInfo"],
  },
];

export function getAllowedActions() {
  const allowedActions = new Set();
  singlePieceFormSteps.forEach((step) =>
    step.actionTypes.forEach((actionType) => allowedActions.add(actionType)),
  );
  return allowedActions;
}

export function getAllStepStatus(state: any) {
  return singlePieceFormSteps.map((step) => step.isComplete(state));
}

export function getStepByRank({
  state,
  rank,
}: {
  state: SinglePieceVersionFormState;
  rank: number;
}): SinglePieceVersionFormStep {
  return (
    singlePieceFormSteps.find((step) => step.rank === rank) ||
    singlePieceFormSteps[0]
  );
}

export function getLastCompletedStep(
  state: SinglePieceVersionFormState,
): SinglePieceVersionFormStep | undefined {
  // traversing the steps array, we return the step before the first incomplete one
  // console.group(`SOPEVF getLastCompletedStep`);
  for (let i = 0; i < singlePieceFormSteps.length; i++) {
    // console.log(`steps[${i}] isComplete :`, steps[i].isComplete(state));
    if (!singlePieceFormSteps[i].isComplete(state)) {
      // console.groupEnd();
      return singlePieceFormSteps[i - 1];
    }
  }
  // console.groupEnd();
  // If none incomplete step found, we return the last step
  return singlePieceFormSteps[singlePieceFormSteps.length - 1];
}
