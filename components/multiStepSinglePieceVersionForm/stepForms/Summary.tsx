import React from "react";
import { getEntityByIdOrKey } from "@/components/context/feedFormContext";
import { FeedFormState } from "@/types/feedFormTypes";
import formatToPhraseCase from "@/utils/formatToPhraseCase";
import getKeyLabel from "@/utils/getKeyLabel";
import { SectionDetail } from "@/components/entities/section/SectionDetail";

type SummaryProps = {
  feedFormState: FeedFormState;
  onSubmitSourceOnPieceVersions: () => void;
  selectedComposerId: string;
  selectedPieceId: string;
  selectedPieceVersionId: string;
  isUpdateMode?: boolean;
};

function Summary({
  feedFormState,
  onSubmitSourceOnPieceVersions,
  selectedComposerId,
  selectedPieceId,
  selectedPieceVersionId,
  isUpdateMode,
}: SummaryProps) {
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
  const movementCount = pieceVersion.movements?.length || 0;
  const isMonoMovementPiece = movementCount === 1;

  return (
    <>
      <div className="border border-base-300 rounded-lg border-l-2 border-l-accent/10 hover:border-l-accent hover:border-base-400 hover:shadow-md hover:bg-primary/5 transition-all duration-150">
        {/* Piece Header */}
        <div className="px-4 py-3 bg-accent/10 border-b border-accent/20">
          <h4 className="text-lg font-bold text-accent">
            {piece?.title}
            {isMonoMovementPiece &&
              pieceVersion.movements?.[0] &&
              ` in ${getKeyLabel(pieceVersion.movements[0].key)}`}
          </h4>
          <div className="text-sm text-accent/70 font-medium">
            {piece?.yearOfComposition ? (
              `Year of Composition: ${piece.yearOfComposition}`
            ) : (
              <span className="italic">No year of composition provided</span>
            )}
            {pieceVersion?.category &&
              `\u2002•\u2002Category: ${formatToPhraseCase(pieceVersion.category)}`}
          </div>
        </div>

        {/* Content */}
        {/* Movements and Sections */}
        <div className="py-2">
          {pieceVersion.movements &&
            pieceVersion.movements.map((movement: any, mvtIndex: number) => (
              <div
                key={`mvt-${mvtIndex}`}
                className={
                  isMonoMovementPiece
                    ? ""
                    : `ml-2 rounded-tl-lg border-l-2 border-l-primary/10 hover:border-l-primary transition-all duration-150`
                }
              >
                {!isMonoMovementPiece && (
                  <div
                    className={`px-4 py-2 ${mvtIndex > 0 ? "mt-3" : ""} bg-primary/5`}
                  >
                    <h5 className="text-sm font-bold text-primary">
                      Movement {movement.rank} in {getKeyLabel(movement.key)}
                    </h5>
                  </div>
                )}

                <div
                  className={`ml-2 ${isMonoMovementPiece ? "" : "pt-2"} grid-cols-1 space-y-1`}
                >
                  {movement.sections &&
                    movement.sections.map((section: any) => (
                      <SectionDetail key={section.id} section={section} />
                    ))}
                </div>
              </div>
            ))}
        </div>
      </div>
      <button
        onClick={onSubmitSourceOnPieceVersions}
        className="btn btn-primary mt-6 w-full"
      >
        {`Confirm ${isUpdateMode ? `your changes` : `adding this piece`}`}
      </button>
    </>
  );
}

export default Summary;
