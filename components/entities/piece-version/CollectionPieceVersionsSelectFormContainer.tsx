import React, { useState } from "react";
import { PieceState } from "@/types/formTypes";
import PieceVersionSelectOrCreate from "@/components/multiStepSinglePieceVersionForm/stepForms/PieceVersionSelectOrCreate";
import { useCollectionPieceVersionsForm } from "@/components/context/CollectionPieceVersionsFormContext";
import {
  FeedFormState,
  getEntityByIdOrKey,
} from "@/components/context/feedFormContext";
import Badge from "@/components/Badge";

type CollectionPieceVersionsSelectFormContainer = {
  feedFormState: FeedFormState;
  pieces: PieceState[];
};

/**
 * This container component handle the process of going piece by piece in the received pieces array
 * - Propose to select an existing pieceVersion or Create a new one
 * - Store the result and iterate to the next piece until all pieces' pieceVersions are defined.
 * @param feedFormState
 * @param pieces
 * @constructor
 */
export default function CollectionPieceVersionsSelectFormContainer({
  feedFormState,
  pieces,
}: CollectionPieceVersionsSelectFormContainer) {
  const piecesCount = pieces.length;
  const [piecePieceVersions, setPiecePieceVersions] = useState<
    { pieceId: string; pieceVersionId: string }[]
  >([]);
  const [currentPieceIndex, setCurrentPieceIndex] = React.useState(0);

  const areAllPieceVersionDefined = piecePieceVersions.length === piecesCount;

  const onPieceVersionCreated = (pieceVersion) => {
    setPiecePieceVersions([
      ...piecePieceVersions,
      {
        pieceId: pieces[currentPieceIndex].id,
        pieceVersionId: pieceVersion.id,
      },
    ]);
    setCurrentPieceIndex(currentPieceIndex + 1);
  };
  const onPieceVersionSelect = (pieceVersionId) => {
    setPiecePieceVersions([
      ...piecePieceVersions,
      { pieceId: pieces[currentPieceIndex].id, pieceVersionId },
    ]);
    setCurrentPieceIndex(currentPieceIndex + 1);
  };

  return (
    <div>
      {piecePieceVersions.map((ppv) => {
        const piece = pieces.find((p) => p.id === ppv.pieceId);
        // const piece = getEntityByIdOrKey(feedFormState, "pieces", ppv.pieceId);
        return (
          <div key={ppv.pieceId}>
            {`${piece?.title}`}
            <Badge text="Done" styles="ml-3" />
          </div>
        );
      })}
      {areAllPieceVersionDefined ? (
        <div>{`All pieces' piece versions are defined.`}</div>
      ) : (
        <>
          <h2 className="text-2xl text-primary font-bold mb-4">
            {`#${currentPieceIndex + 1}. ${pieces[currentPieceIndex].title}`}
          </h2>
          <PieceVersionSelectOrCreate
            selectedPieceId={pieces[currentPieceIndex]?.id}
            feedFormState={feedFormState}
            onPieceVersionCreated={onPieceVersionCreated}
            onPieceVersionSelect={onPieceVersionSelect}
          />
        </>
      )}
    </div>
  );
}
