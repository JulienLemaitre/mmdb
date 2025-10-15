import ComposerSelectOrCreate from "@/features/feed/multiStepSinglePieceVersionForm/stepForms/ComposerSelectOrCreate";
import { CollectionPieceVersionsFormStep } from "@/types/formTypes";
import CollectionSelectOrCreate from "@/features/feed/multiStepCollectionPieceVersionsForm/stepForms/CollectionSelectOrCreate";
import CollectionPieceVersionSelectOrCreate from "@/features/feed/multiStepCollectionPieceVersionsForm/stepForms/CollectionPieceVersionSelectOrCreate";
import { CollectionPieceVersionsFormState } from "@/types/collectionPieceVersionFormTypes";

export const collectionFormSteps: CollectionPieceVersionsFormStep[] = [
  {
    id: "composer",
    title: "Composer",
    rank: 0,
    isComplete: (state: CollectionPieceVersionsFormState) =>
      !!state.collection?.composerId,
    Component: ComposerSelectOrCreate,
    actionTypes: ["composer"],
  },
  {
    id: "collection",
    title: "Collection title",
    rank: 1,
    isComplete: (state: CollectionPieceVersionsFormState) =>
      !!state.collection?.title,
    Component: CollectionSelectOrCreate,
    actionTypes: ["collection"],
  },
  {
    id: "collectionPieceVersions",
    title: "Pieces and Versions",
    rank: 2,
    isComplete: (state) =>
      (state?.mMSourcePieceVersions?.length || 0) > 0 &&
      !!state?.formInfo?.allSourcePieceVersionsDone,
    Component: CollectionPieceVersionSelectOrCreate,
    actionTypes: [
      "mMSourcePieceVersions",
      "formInfo",
      "editedSourceOnPieceVersions",
      "organizations",
      "persons",
      "pieces",
      "pieceVersions",
      "tempoIndications",
    ],
  },
];

export function getAllowedActions(state) {
  const allowedActions = new Set();
  collectionFormSteps.forEach((step) =>
    step.actionTypes.forEach((actionType) => allowedActions.add(actionType)),
  );
  return allowedActions;
}

export function getAllStepStatus(state: any) {
  return collectionFormSteps.map((step) => step.isComplete(state));
}

// export function getStepById(stepId: string): SourceOnPieceVersionsFormStep {
//   return steps.find((step) => step.id === stepId) || steps[0];
// }
export function getStepByRank({
  rank,
}: {
  state: CollectionPieceVersionsFormState;
  rank: number;
}): CollectionPieceVersionsFormStep {
  return (
    collectionFormSteps.find((step) => step.rank === rank) ||
    collectionFormSteps[0]
  );
}
