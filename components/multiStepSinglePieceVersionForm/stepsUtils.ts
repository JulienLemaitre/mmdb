import { SourceOnPieceVersionsFormStep } from "@/types/formTypes";
import ComposerSelectOrCreate from "@/components/multiStepSinglePieceVersionForm/stepForms/ComposerSelectOrCreate";
import { SourceOnPieceVersionsFormState } from "@/components/context/SourceOnPieceVersionFormContext";
import PieceSelectOrCreate from "@/components/multiStepSinglePieceVersionForm/stepForms/PieceSelectOrCreate";
import PieceVersionSelectOrCreate from "@/components/multiStepSinglePieceVersionForm/stepForms/PieceVersionSelectOrCreate";
import Summary from "@/components/multiStepSinglePieceVersionForm/stepForms/Summary";

export const singleSteps: SourceOnPieceVersionsFormStep[] = [
  {
    id: "composer",
    title: "Composer",
    rank: 0,
    isComplete: (state: SourceOnPieceVersionsFormState) => !!state.composer?.id,
    Component: ComposerSelectOrCreate,
    actionTypes: ["composer"],
  },
  {
    id: "piece",
    title: "Piece",
    rank: 1,
    isComplete: (state: SourceOnPieceVersionsFormState) => !!state.piece?.id,
    Component: PieceSelectOrCreate,
    actionTypes: ["piece"],
  },
  {
    id: "pieceVersion",
    title: "Piece Version",
    rank: 2,
    isComplete: (state: SourceOnPieceVersionsFormState) =>
      !!state.pieceVersion?.id,
    Component: PieceVersionSelectOrCreate,
    actionTypes: ["pieceVersion"],
  },
  {
    id: "summary",
    title: "Summary",
    rank: 3,
    isComplete: (state: SourceOnPieceVersionsFormState) => false,
    Component: Summary,
    actionTypes: ["reset", "formInfo"],
  },
];

// export const collectionSteps: SourceOnPieceVersionsFormStep[] = [
//   {
//     id: "composer",
//     title: "Composer",
//     rank: 0,
//     isComplete: (state: SourceOnPieceVersionsFormState) => !!state.composer?.id,
//     Component: ComposerSelectOrCreate,
//     actionTypes: ["composer"],
//   },
//   {
//     id: "piece",
//     title: "Piece",
//     rank: 1,
//     isComplete: (state: SourceOnPieceVersionsFormState) => !!state.piece?.id,
//     Component: PieceSelectOrCreate,
//     actionTypes: ["piece"],
//   },
//   {
//     id: "pieceVersion",
//     title: "Piece Version",
//     rank: 2,
//     isComplete: (state: SourceOnPieceVersionsFormState) =>
//       !!state.pieceVersion?.id,
//     Component: PieceVersionSelectOrCreate,
//     actionTypes: ["pieceVersion"],
//   },
//   {
//     id: "summary",
//     title: "Summary",
//     rank: 3,
//     isComplete: (state: SourceOnPieceVersionsFormState) => false,
//     Component: Summary,
//     actionTypes: ["reset", "formInfo"],
//   },
// ];

export const steps = {
  single: singleSteps,
  // collection: collectionSteps,
};

export function getAllowedActions(state) {
  const formType = state.formInfo.formType;
  const allowedActions = new Set();
  steps[formType].forEach((step) =>
    step.actionTypes.forEach((actionType) => allowedActions.add(actionType)),
  );
  return allowedActions;
}

export function getAllStepStatus(state: any) {
  const formType = state.formInfo.formType;
  return steps[formType].map((step) => step.isComplete(state));
}

// export function getStepById(stepId: string): SourceOnPieceVersionsFormStep {
//   return steps.find((step) => step.id === stepId) || steps[0];
// }
export function getStepByRank({
  state,
  rank,
}: {
  state: SourceOnPieceVersionsFormState;
  rank: number;
}): SourceOnPieceVersionsFormStep {
  const formType = state.formInfo.formType;
  return steps[formType].find((step) => step.rank === rank) || steps[0];
}
