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
      (state?.mMSourceOnPieceVersions?.length || 0) > 0 &&
      !!state?.formInfo?.allSourceOnPieceVersionsDone,
    Component: CollectionPieceVersionSelectOrCreate,
    actionTypes: [
      "mMSourceOnPieceVersions",
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

export function getLastCompletedStep(
  state: CollectionPieceVersionsFormState,
): CollectionPieceVersionsFormStep | undefined {
  // traversing the steps array, we return the step before the first incomplete one id
  for (let i = 0; i < collectionFormSteps.length; i++) {
    if (!collectionFormSteps[i].isComplete(state)) {
      return collectionFormSteps[i - 1];
    }
  }
  // If none incomplete step found, we return the last step id
  return collectionFormSteps[collectionFormSteps.length - 1];
}

export function getCollectionFormStepByRank(
  rank: number,
): CollectionPieceVersionsFormStep {
  return (
    collectionFormSteps.find((step) => step.rank === rank) ||
    collectionFormSteps[0]
  );
}
