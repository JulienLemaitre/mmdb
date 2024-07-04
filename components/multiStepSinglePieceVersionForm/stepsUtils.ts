import { SinglePieceVersionFormStep } from "@/types/formTypes";
import ComposerSelectOrCreate from "@/components/multiStepSinglePieceVersionForm/stepForms/ComposerSelectOrCreate";
import { SinglePieceVersionFormState } from "@/components/context/SinglePieceVersionFormContext";
import PieceSelectOrCreate from "@/components/multiStepSinglePieceVersionForm/stepForms/PieceSelectOrCreate";
import PieceVersionSelectOrCreate from "@/components/multiStepSinglePieceVersionForm/stepForms/PieceVersionSelectOrCreate";
import Summary from "@/components/multiStepSinglePieceVersionForm/stepForms/Summary";

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
