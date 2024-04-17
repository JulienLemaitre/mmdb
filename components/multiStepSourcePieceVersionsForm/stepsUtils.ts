import { SourceOnPieceVersionsFormStep } from "@/types/formTypes";
import ComposerSelectOrCreate from "@/components/multiStepSourcePieceVersionsForm/stepForms/ComposerSelectOrCreate";
import { SourceOnPieceVersionsFormState } from "@/components/context/SourceOnPieceVersionFormContext";
import SinglePieceOrCollectionSelect from "@/components/multiStepSourcePieceVersionsForm/stepForms/SinglePieceOrCollectionSelect";

export const steps: SourceOnPieceVersionsFormStep[] = [
  {
    id: "composer",
    name: "Composer",
    rank: 0,
    isComplete: (state: SourceOnPieceVersionsFormState) => !!state.composerId,
    Component: ComposerSelectOrCreate,
    actionTypes: ["composerId", "formInfo"],
  },
  {
    id: "singlePieceOrCollection",
    name: "Single Piece or Collection",
    rank: 1,
    isComplete: (state: SourceOnPieceVersionsFormState) =>
      typeof state.isCollection === "boolean",
    Component: SinglePieceOrCollectionSelect,
    actionTypes: ["formInfo"],
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
