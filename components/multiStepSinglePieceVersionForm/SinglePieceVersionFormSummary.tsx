import React from "react";
import {
  getEntityByIdOrKey,
  useFeedForm,
} from "@/components/context/feedFormContext";
import { useSinglePieceVersionForm } from "@/components/context/SinglePieceVersionFormContext";
import { getStepByRank } from "@/components/multiStepSinglePieceVersionForm/stepsUtils";

type SinglePieceVersionFormSummaryProps = {
  isCollectionMode?: boolean;
};

function SinglePieceVersionFormSummary({
  isCollectionMode,
}: SinglePieceVersionFormSummaryProps) {
  const { state: feedFormState } = useFeedForm();
  const { state, currentStepRank } = useSinglePieceVersionForm();
  const composer =
    state.composer?.id &&
    getEntityByIdOrKey(feedFormState, "persons", state.composer.id);
  const composerName = composer?.firstName + " " + composer?.lastName;
  const piece =
    state.piece?.id &&
    getEntityByIdOrKey(feedFormState, "pieces", state.piece.id);
  const currentStep = getStepByRank({ state, rank: currentStepRank });
  const displayComposerInfo =
    !isCollectionMode && ["piece", "pieceVersion"].includes(currentStep.id);
  const displayPieceInfo = ["pieceVersion"].includes(currentStep.id);
  return (
    <div className="mb-6">
      {displayComposerInfo && (
        <div className="text-sm mb-0">{`Composer: ${composerName}`}</div>
      )}
      {displayPieceInfo && (
        <h3 className="text-sm">{`Piece: ${piece.title} (${piece.yearOfComposition || "no date"})`}</h3>
      )}
    </div>
  );
}

export default SinglePieceVersionFormSummary;
