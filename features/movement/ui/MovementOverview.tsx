import { MovementInput, TempoIndicationState } from "@/types/formTypes";
import React from "react";
import getKeyLabel from "@/utils/getKeyLabel";
import SectionOverview from "@/features/section/ui/SectionOverview";

export default function MovementOverview({
  movement,
  tempoIndicationList,
}: {
  movement: MovementInput;
  tempoIndicationList: TempoIndicationState[];
}) {
  const missingKey = !movement.key;
  return (
    <div className="text-xs italic font-normal pl-12">
      <div>
        <b>Key</b>:{" "}
        {missingKey ? (
          <span className="text-warning">Missing</span>
        ) : (
          getKeyLabel(movement.key.value)
        )}
      </div>
      {movement.sections.length > 0 && (
        <div className={"mt-2"}>
          {movement.sections.map((section, index) => {
            const tempoIndicationId = section.tempoIndication?.value;
            const tempoIndication = tempoIndicationList.find(
              (tempoIndication) => tempoIndication.id === tempoIndicationId,
            );
            const sectionInfo = {
              ...section,
              tempoIndicationId,
            };

            return (
              <div key={section.id} className="flex gap-2 my-2">
                <b>{`Section ${index + 1} :`}</b>
                <SectionOverview
                  section={sectionInfo}
                  tempoIndication={tempoIndication}
                  noPadding
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
