import { SectionState, TempoIndicationState } from "@/types/formTypes";
import SectionMeter from "@/features/section/ui/SectionMeter";
import React from "react";
import { MakeOptional } from "@/types/typescriptUtils";

export default function SectionOverview({
  section,
  tempoIndication,
  isSummaryView = false,
  noPadding = false,
}: {
  section: MakeOptional<SectionState, "id" | "rank">;
  tempoIndication?: TempoIndicationState;
  isSummaryView?: boolean;
  noPadding?: boolean;
}) {
  const missingMeter = !section.metreNumerator || !section.metreDenominator;

  return (
    <div
      className={`text-xs italic font-normal ${isSummaryView || noPadding ? "" : "pl-12"}`}
    >
      <div className={isSummaryView ? "hidden" : ""}>
        {missingMeter ? (
          <span className="text-warning">
            <b>Time Signature</b> missing
          </span>
        ) : (
          <SectionMeter section={section} />
        )}
        {tempoIndication?.text ? (
          <span>{`\u2002-\u2002${tempoIndication.text}`}</span>
        ) : (
          <span className="text-warning">
            {`\u2002-\u2002`}
            <b>Tempo indication</b> missing
          </span>
        )}
      </div>
      {section.comment && (
        <div>
          <b>Comment</b>: {section.comment}
        </div>
      )}
      {section.commentForReview && (
        <div>
          <b>Review note</b>: {section.commentForReview}
        </div>
      )}
      <div className="flex gap-2">
        <b>Fastest</b>
        <div className="flex">
          {[
            "fastestStructuralNotesPerBar",
            "fastestBelCantoNotesPerBar",
            "fastestStaccatoNotesPerBar",
            "fastestRepeatedNotesPerBar",
            "fastestOrnamentalNotesPerBar",
          ]
            .filter(
              (key) => key === "fastestStructuralNotesPerBar" || section[key],
            )
            .map((key, index) => {
              const keyName = key
                .replace("fastest", "")
                .replace("NotesPerBar", "");

              if (key === "fastestStructuralNotesPerBar" && !section[key]) {
                return (
                  <div key={key} className="text-xs italic">
                    <span className="text-warning">
                      <b>{keyName}</b>: Missing
                    </span>
                  </div>
                );
              }

              return (
                <div key={key} className="text-xs italic">
                  {index > 0 ? `\u2002-\u2002` : ""}
                  <b>{keyName}</b>: {section[key]}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
