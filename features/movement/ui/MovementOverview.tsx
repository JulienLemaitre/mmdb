import { MovementInput, TempoIndicationState } from "@/types/formTypes";
import React from "react";
import getKeyLabel from "@/utils/getKeyLabel";
import SectionOverview from "@/features/section/ui/SectionOverview";
import { prodLog } from "@/utils/debugLogger";

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
            const tempoIndication = tempoIndicationList.find(
              (tempoIndication) =>
                tempoIndication.id === section.tempoIndication.value,
            );
            const sectionInfo = {
              ...section,
              tempoIndicationId: section.tempoIndication.value,
            };

            if (!tempoIndication) {
              prodLog.error("Tempo indication not found for section", section);
              return null;
            }

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
