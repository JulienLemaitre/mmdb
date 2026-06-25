import { PieceVersionState, TempoIndicationState } from "@/types/formTypes";
import formatToPhraseCase from "@/utils/formatToPhraseCase";
import getKeyLabel from "@/utils/getKeyLabel";
import React from "react";
import SectionMeter from "@/features/section/ui/SectionMeter";
import SectionOverview from "@/features/section/ui/SectionOverview";
import { prodLog } from "@/utils/debugLogger";

type PieceVersionDisplayProps = {
  pieceVersion: PieceVersionState;
  tempoIndicationList: TempoIndicationState[];
};

export default function PieceVersionDisplay({
  pieceVersion,
  tempoIndicationList,
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
            <div className="px-4 py-2 bg-primary/5">
              <h6 className="text-sm font-semibold text-primary">
                {isMonoMovementPiece ? "Piece" : `Movement ${movement.rank}`}
                {" in "}
                {getKeyLabel(movement.key)}
              </h6>
            </div>

            {/* Sections */}
            <div className={`ml-2 pt-1 grid-cols-1 space-y-1`}>
              {movement.sections.map((section) => {
                const tempoIndication = tempoIndicationList.find(
                  (ti) => ti.id === section.tempoIndicationId,
                );
                if (!tempoIndication) {
                  prodLog.error(
                    "Tempo indication not found for section",
                    section,
                  );
                  return null;
                }

                return (
                  <div
                    key={section.id}
                    className="px-3 py-1 border-l-2 border-l-secondary/10 hover:border-l-secondary bg-secondary/5 transition-all duration-150"
                  >
                    <h6 className="text-sm font-semibold text-secondary">
                      {`Section ${section.rank}\u2002-\u2002`}
                      <SectionMeter section={section} />
                      {tempoIndication && (
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
  );
}
