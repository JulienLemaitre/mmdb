import { MovementInput } from "@/types/formTypes";
import React from "react";
import getKeyLabel from "@/utils/getKeyLabel";
import SectionOverview from "@/features/section/ui/SectionOverview";

export default function MovementOverview({
  movement,
}: {
  movement: MovementInput;
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
            return (
              <div key={section.id} className="flex gap-2 my-2">
                <b>{`Section ${index + 1} :`}</b>
                <SectionOverview section={section} noPadding />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
