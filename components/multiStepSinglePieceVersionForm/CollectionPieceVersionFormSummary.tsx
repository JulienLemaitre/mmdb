import React from "react";
import {
  getEntityByIdOrKey,
  useFeedForm,
} from "@/components/context/feedFormContext";
import { getStepByRank } from "@/components/multiStepSinglePieceVersionForm/stepsUtils";
import { useCollectionPieceVersionsForm } from "@/components/context/CollectionPieceVersionsFormContext";

function CollectionPieceVersionFormSummary() {
  const { state: feedFormState } = useFeedForm();
  const { state, currentStepRank } = useCollectionPieceVersionsForm();
  const composer =
    state.collection?.composerId &&
    getEntityByIdOrKey(feedFormState, "persons", state.collection?.composerId);
  const composerName = composer?.firstName + " " + composer?.lastName;
  const collectionTitle = state.collection?.title;
  const currentStep = getStepByRank({ state, rank: currentStepRank });
  const displayComposerInfo = ["piece", "pieceVersion"].includes(
    currentStep.id,
  );
  return (
    <div className="mb-6">
      {displayComposerInfo || collectionTitle ? (
        <div className="text-sm primary text-primary">{`Collection context`}</div>
      ) : null}
      {displayComposerInfo && (
        <div className="text-sm">{`Composer: ${composerName}`}</div>
      )}

      {collectionTitle && (
        <h3 className="text-sm">{`Collection: ${collectionTitle}`}</h3>
      )}
    </div>
  );
}

export default CollectionPieceVersionFormSummary;
