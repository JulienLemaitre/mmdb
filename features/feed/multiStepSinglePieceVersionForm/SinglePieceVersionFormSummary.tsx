import React from "react";
import { useSinglePieceVersionForm } from "@/context/singlePieceVersionFormContext";
import { getSinglePieceFormStepByRank } from "@/features/feed/multiStepSinglePieceVersionForm/stepsUtils";

type SinglePieceVersionFormSummaryProps = {
  isCollectionMode?: boolean;
};

function SinglePieceVersionFormSummary({
  isCollectionMode,
}: SinglePieceVersionFormSummaryProps) {
  const { state, currentStepRank } = useSinglePieceVersionForm();
  const composer = state.composer;
  const composerName = composer?.firstName + " " + composer?.lastName;
  const piece = state.piece;
  const currentStep = getSinglePieceFormStepByRank(currentStepRank);
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
          <div className="text-sm">{`Title: ${piece?.title}`}</div>
          <div className="text-sm">{`Year of composition: ${piece?.yearOfComposition || "no date"}`}</div>
        </>
      )}
    </div>
  );
}

export default SinglePieceVersionFormSummary;
