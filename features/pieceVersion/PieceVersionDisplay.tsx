import { PieceVersionState } from "@/types/formTypes";
import formatToPhraseCase from "@/utils/formatToPhraseCase";
import getKeyLabel from "@/utils/getKeyLabel";
import React from "react";
import SectionMeter from "@/features/section/ui/SectionMeter";

type PieceVersionDisplayProps = {
  pieceVersion: PieceVersionState;
};

export default function PieceVersionDisplay({
  pieceVersion,
}: PieceVersionDisplayProps) {
  const movementCount = pieceVersion.movements.length;
  const isMonoMovementPiece = movementCount === 1;

  return (
    <div className="w-full">
      <div className="mb-2 text-sm">
        Category: {formatToPhraseCase(pieceVersion.category)}
      </div>

      {/* Movements */}
      <div className="space-y-2 w-full">
        {pieceVersion.movements.map((movement) => (
          <div
            key={movement.id}
            className="rounded-tl-lg border-l-2 border-l-primary/10 hover:border-l-primary transition-all duration-150"
          >
            <div className="px-2 py-1 bg-primary/5">
              <h6 className="text-sm font-semibold text-primary">
                {isMonoMovementPiece ? "Piece" : `Movement ${movement.rank}`}
                {" in "}
                {getKeyLabel(movement.key)}
              </h6>
            </div>

            {/* Sections */}
            <div className={`ml-2 pt-1 grid-cols-1 space-y-1`}>
              {movement.sections.map((section) => {
                return (
                  <div
                    key={section.id}
                    className="px-3 py-1 border-l-2 border-l-secondary/10 hover:border-l-secondary bg-secondary/5 transition-all duration-150 rounded-r-lg"
                  >
                    <h6 className="text-sm font-semibold text-secondary">
                      {`Section ${section.rank}\u2002-\u2002`}
                      <SectionMeter section={section} />
                      <span className="italic">
                        {section?.tempoIndication?.text &&
                          `\u2002-\u2002${section.tempoIndication.text}`}
                      </span>
                      <span className="font-normal italic text-neutral-content">
                        {section.comment && `\u2002-\u2002${section.comment}`}
                      </span>
                    </h6>

                    {section.commentForReview && (
                      <div className="text-xs italic px-2 py-1 bg-warning/10 rounded mt-1">
                        Review note: {section.commentForReview}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
