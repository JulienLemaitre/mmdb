import { SourceOnPieceVersionsFormStep } from "@/types/formTypes";
import ComposerSelectOrCreate from "@/components/multiStepSourcePieceVersionsForm/stepForms/ComposerSelectOrCreate";
import { SourceOnPieceVersionsFormState } from "@/components/context/SourceOnPieceVersionFormContext";
import SinglePieceOrCollectionSelect from "@/components/multiStepSourcePieceVersionsForm/stepForms/SinglePieceOrCollectionSelect";
import PieceSelectOrCreate from "@/components/multiStepSourcePieceVersionsForm/stepForms/PieceSelectOrCreate";

export const steps: SourceOnPieceVersionsFormStep[] = [
  {
    id: "composer",
    title: "Composer",
    rank: 0,
    isComplete: (state: SourceOnPieceVersionsFormState) => !!state.composer?.id,
    Component: ComposerSelectOrCreate,
    actionTypes: ["composer"],
  },
  {
    id: "singlePieceOrCollection",
    title: "Single Piece or Collection",
    rank: 1,
    isComplete: (state: SourceOnPieceVersionsFormState) =>
      typeof state.formInfo?.isCollection === "boolean",
    Component: SinglePieceOrCollectionSelect,
    actionTypes: ["formInfo"],
  },
  {
    id: "piece",
    title: "Piece Description",
    rank: 2,
    isComplete: (state: SourceOnPieceVersionsFormState) =>
      typeof state.formInfo?.isCollection === "boolean",
    Component: PieceSelectOrCreate,
    actionTypes: ["formInfo", "piece"],
  },
];

export function getAllowedActions() {
  const allowedActions = new Set();
  steps.forEach((step) =>
    step.actionTypes.forEach((actionType) => allowedActions.add(actionType)),
  );
  return allowedActions;
}

export function getAllStepStatus(state: any) {
  return steps.map((step) => step.isComplete(state));
}

export function getStepById(stepId: string): SourceOnPieceVersionsFormStep {
  return steps.find((step) => step.id === stepId) || steps[0];
}
export function getStepByRank(rank: number): SourceOnPieceVersionsFormStep {
  return steps.find((step) => step.rank === rank) || steps[0];
}
