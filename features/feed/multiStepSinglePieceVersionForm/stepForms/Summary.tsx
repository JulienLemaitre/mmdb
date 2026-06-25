import React from "react";
import formatToPhraseCase from "@/utils/formatToPhraseCase";
import getKeyLabel from "@/utils/getKeyLabel";
import { PieceVersionState } from "@/types/formTypes";
import { SinglePieceVersionFormState } from "@/types/singlePieceVersionFormTypes";
import SectionOverview from "@/features/section/ui/SectionOverview";
import SectionMeter from "@/features/section/ui/SectionMeter";
import getPersonName from "@/utils/getPersonName";
import { prodLog } from "@/utils/debugLogger";

type SummaryProps = {
  singlePieceVersionFormState: SinglePieceVersionFormState;
  onSubmitSourceOnPieceVersions: () => void;
  isUpdateMode?: boolean;
};

function Summary({
  singlePieceVersionFormState,
  onSubmitSourceOnPieceVersions,
  isUpdateMode,
}: SummaryProps) {
  const piece = singlePieceVersionFormState.piece;
  const pieceVersion =
    singlePieceVersionFormState.pieceVersion as PieceVersionState;
  const composer = singlePieceVersionFormState.composer;
  const tempoIndicationList =
    singlePieceVersionFormState.tempoIndications || [];
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
            <span className="text-base font-normal">
              {composer && ` - ${getPersonName(composer)}`}
            </span>
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

        {/* Movements */}
        <div className="py-2">
          {pieceVersion?.movements.map((movement: any, mvtIndex: number) => (
            <div
              key={`mvt-${movement.id}`}
              className={
                isMonoMovementPiece
                  ? ""
                  : `ml-2 ${mvtIndex > 0 ? "mt-2" : ""} rounded-tl-lg border-l-2 border-l-primary/10 hover:border-l-primary transition-all duration-150`
              }
            >
              {!isMonoMovementPiece && (
                <div className={`px-4 py-2 bg-primary/5`}>
                  <h5 className="text-sm font-semibold text-primary">
                    Movement {movement.rank} in {getKeyLabel(movement.key)}
                  </h5>
                </div>
              )}

              {/* Sections */}
              <div
                className={`ml-2 ${isMonoMovementPiece ? "" : "pt-1"} grid-cols-1 space-y-1`}
              >
                {movement?.sections.map((section: any, sectionIndex) => {
                  const tempoIndication = tempoIndicationList.find(
                    ({ id }) => id === section.tempoIndicationId,
                  );

                  if (!tempoIndication) {
                    prodLog.error(
                      `Tempo indication not found for section`,
                      section,
                    );
                    return null;
                  }

                  return (
                    <div
                      key={section.id}
                      className={`px-3 py-1 ${sectionIndex > 0 ? "mt-2" : ""} border-l-2 border-l-secondary/10 hover:border-l-secondary bg-secondary/5 transition-all duration-150`}
                    >
                      <h6 className="text-sm font-semibold text-secondary">
                        {`Section ${section.rank}\u2002-\u2002`}
                        <SectionMeter section={section} />
                        {tempoIndication?.text && (
                          <span className="italic">
                            {`\u2002-\u2002${tempoIndication.text}`}
                          </span>
                        )}
                      </h6>
                      <SectionOverview
                        section={section}
                        tempoIndication={tempoIndication}
                        isSummaryView
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <button
        onClick={onSubmitSourceOnPieceVersions}
        className="btn btn-primary mt-6 w-full"
      >
        {`Confirm ${isUpdateMode ? "your changes" : "adding this piece"}`}
      </button>
    </>
  );
}

export default Summary;
