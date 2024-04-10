import { EditedSourceOnPieceVersionsState } from "@/components/context/feedFormContext";
import { SourceOnPieceVersionFormStep } from "@/types/editFormTypes";
import ComposerSelectOrCreate from "@/components/multiStepSourcePieceVersionsForm/stepForms/ComposerSelectOrCreate";

export const steps: SourceOnPieceVersionFormStep[] = [
  {
    id: "composer",
    name: "Composer",
    rank: 0,
    isComplete: (
      editedSourceOnPieceVersions: EditedSourceOnPieceVersionsState,
    ) => !!editedSourceOnPieceVersions.composerId,
    Component: ComposerSelectOrCreate,
  },
];

export function getCompletedSteps(state: any) {
  const completedSteps = [
    (editedSourceOnPieceVersions: EditedSourceOnPieceVersionsState) =>
      !!editedSourceOnPieceVersions.composerId,
    (editedSourceOnPieceVersions: EditedSourceOnPieceVersionsState) =>
      !!editedSourceOnPieceVersions.isCollection,
  ].map((isStepCompleted) =>
    isStepCompleted(state.editedSourceOnPieceVersions || {}),
  );

  return completedSteps;
}

export function getStepById(stepId: string): SourceOnPieceVersionFormStep {
  return steps.find((step) => step.id === stepId) || steps[0];
}
export function getStepByRank(rank: number): SourceOnPieceVersionFormStep {
  return steps.find((step) => step.rank === rank) || steps[0];
}
