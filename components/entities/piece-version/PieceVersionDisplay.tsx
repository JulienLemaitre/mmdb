import { PieceVersionState } from "@/types/formTypes";
import formatToPhraseCase from "@/utils/formatToPhraseCase";
import getKeyLabel from "@/utils/getKeyLabel";
import React from "react";
import SectionMeter from "@/components/entities/section/SectionMeter";

type PieceVersionDisplayProps = {
  pieceVersion: PieceVersionState;
};

export default function PieceVersionDisplay({
  pieceVersion,
}: PieceVersionDisplayProps) {
  return (
    <div className="w-full">
      <div className="mb-2 text-sm">
        Category: {formatToPhraseCase(pieceVersion.category)}
      </div>
      <div className="space-y-2 w-full">
        {pieceVersion.movements.map((movement, _, movementList) => (
          <div key={movement.id} className="rounded-lg">
            <div className="px-2 py-1 bg-primary/10 rounded-t-lg">
              <h6 className="text-sm font-bold text-primary">
                {movementList.length > 1 ? `Movement ${movement.rank}` : ""}
                {movementList.length > 1 ? " in " : ""}
                {getKeyLabel(movement.key)}
              </h6>
            </div>

            <div className="space-y-1 mt-1">
              {movement.sections.map((section) => {
                return (
                  <div
                    key={section.id}
                    className="px-3 py-2 border-l-2 border-l-secondary/10 hover:border-l-secondary bg-secondary/5 transition-all duration-150 rounded-r-lg"
                  >
                    <div className="mb-1">
                      <h6 className="text-sm font-bold text-secondary">
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
                    </div>

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
