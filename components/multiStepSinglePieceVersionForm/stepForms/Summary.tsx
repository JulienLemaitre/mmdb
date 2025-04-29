import React from "react";
import { getEntityByIdOrKey } from "@/components/context/feedFormContext";
import PieceVersionDisplay from "@/components/entities/piece-version/PieceVersionDisplay";
import getPersonName from "@/components/entities/person/utils/getPersonName";
import { FeedFormState } from "@/types/feedFormTypes";

type SummaryProps = {
  feedFormState: FeedFormState;
  onAddSourceOnPieceVersions: () => void;
  selectedComposerId: string;
  selectedPieceId: string;
  selectedPieceVersionId: string;
};

function Summary({
  feedFormState,
  onAddSourceOnPieceVersions,
  selectedComposerId,
  selectedPieceId,
  selectedPieceVersionId,
}: SummaryProps) {
  console.log({ selectedComposerId, selectedPieceId, selectedPieceVersionId });
  const composer = getEntityByIdOrKey(
    feedFormState,
    "persons",
    selectedComposerId,
  );
  const piece = getEntityByIdOrKey(feedFormState, "pieces", selectedPieceId);
  const pieceVersion = getEntityByIdOrKey(
    feedFormState,
    "pieceVersions",
    selectedPieceVersionId,
  );

  return (
    <div>
      {composer ? (
        <div className="h3 mb-3">{`Composer: ${getPersonName(composer)}`}</div>
      ) : (
        <div className="h3 mb-3">{`- Composer not found -`}</div>
      )}
      {piece ? (
        <div className="h3 mb-3">{`Piece: ${piece.title}`}</div>
      ) : (
        <div className="h3 mb-3">{`- Piece not found -`}</div>
      )}
      {pieceVersion ? (
        <PieceVersionDisplay pieceVersion={pieceVersion} />
      ) : (
        <div className="h3 mb-3">{`- Piece Version not found -`}</div>
      )}
      <button
        onClick={onAddSourceOnPieceVersions}
        className="btn btn-primary mt-4"
      >
        Confirm adding this piece
      </button>
    </div>
  );
}

export default Summary;
