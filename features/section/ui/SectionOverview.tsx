import { SectionInput } from "@/types/formTypes";
import SectionMeter from "@/features/section/ui/SectionMeter";
import React from "react";

export default function SectionOverview({
  section,
}: {
  section: SectionInput;
}) {
  console.log(`[SectionOverview] section :`, section);

  return (
    <div className="text-xs italic font-normal pl-12">
      <SectionMeter section={section} />
      <span>
        {section?.tempoIndication?.label &&
          `\u2002-\u2002${section.tempoIndication.label}`}
      </span>
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
        <b>Fastest Notes per Bar</b>
        <div className="flex gap-2">
          {[
            "fastestStructuralNotesPerBar",
            "fastestBelCantoNotesPerBar",
            "fastestStaccatoNotesPerBar",
            "fastestRepeatedNotesPerBar",
            "fastestOrnamentalNotesPerBar",
          ]
            .filter((key) => section[key])
            .map((key) => {
              const keyName = key
                .replace("fastest", "")
                .replace("NotesPerBar", "");
              return (
                <div key={key} className="text-xs italic">
                  <b>{keyName}</b>: {section[key]}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
