import { MovementInput } from "@/types/formTypes";
import React from "react";
import getKeyLabel from "@/utils/getKeyLabel";
import SectionMeter from "@/features/section/ui/SectionMeter";

export default function MovementOverview({
  movement,
}: {
  movement: MovementInput;
}) {
  return (
    <div className="text-xs italic font-normal pl-12">
      <div>
        <b>Key</b>: {getKeyLabel(movement.key.value)}
      </div>
      {movement.sections.length > 0 && (
        <div className={"mt-2"}>
          {movement.sections.map((section, index) => {
            return (
              <div key={section.id}>
                <b>{`Section ${index + 1}`}</b>:{" "}
                <span className="ml-1">
                  <SectionMeter section={section} />
                  <span>
                    {section?.tempoIndication?.label &&
                      `\u2002-\u2002${section.tempoIndication.label}`}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
