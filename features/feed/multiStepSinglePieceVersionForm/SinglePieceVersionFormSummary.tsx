import React from "react";
import { useFeedForm } from "@/context/feedFormContext";
import { getEntityByIdOrKey } from "@/utils/getEntityByIdOrKey";
import { useSinglePieceVersionForm } from "@/context/singlePieceVersionFormContext";
import { getStepByRank } from "@/features/feed/multiStepSinglePieceVersionForm/stepsUtils";

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
      {displayComposerInfo || displayPieceInfo ? (
        <div className="text-sm primary text-primary">{`Piece context`}</div>
      ) : null}
      {displayComposerInfo && (
        <div className="text-sm">{`Composer: ${composerName}`}</div>
      )}
      {displayPieceInfo && (
        <>
          <div className="text-sm">{`Title: ${piece.title}`}</div>
          <div className="text-sm">{`Year of composition: ${piece.yearOfComposition || "no date"}`}</div>
        </>
      )}
    </div>
  );
}

export default SinglePieceVersionFormSummary;
