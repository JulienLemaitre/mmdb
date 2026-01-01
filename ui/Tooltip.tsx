import React from "react";
import getSourceTypeLabel from "@/utils/getSourceTypeLabel";
import getRoleLabel from "@/utils/getRoleLabel";
import getNoteValueLabel from "@/utils/getNoteValueLabel";
import SectionMeter from "@/features/section/ui/SectionMeter";
import { displaySourceYear } from "@/utils/displaySourceYear";

const Tooltip = ({
  node,
  left,
  width,
  top,
  bottom,
  opacity,
}: {
  node: any;
  left?: string;
  width?: string;
  bottom?: string;
  top?: string;
  opacity: number;
}) => {
  const { data } = node || {};
  const { meta } = data || {};
  if (!meta) return null;
  const { noteType, composer, piece, movement, section, mm } = meta;
  const { mMSource } = mm;

  return (
    <div
      className={`rounded-md bg-gray-300 text-gray-800 dark:bg-gray-900 dark:text-gray-300 p-2 text-sm shadow-md fixed pointer-events-none transition-all ease-in-out duration-250`}
      style={{ left, top, bottom, width, opacity }}
    >
      <h2 className="card-title text-sm">{`${(data.yVal || data.y).toFixed(2)} - ${noteType}`}</h2>
      <div>{composer}</div>
      <div>{piece?.title}</div>
      <div>{`${movement.rank ? `Mvt ${movement.rank} | ` : ``}${section.rank ? `Section ${section.rank}` : ``} - ${section.tempoIndication?.text}`}</div>
      <div>
        Metre : <SectionMeter section={section} />
      </div>
      <div>{`bpm: ${getNoteValueLabel(mm.beatUnit)} = ${mm.bpm}`}</div>
      <div>
        source: {displaySourceYear(mMSource)} -{" "}
        {getSourceTypeLabel(mMSource.type)}
      </div>
      {mMSource.title && <div className="">{mMSource.title}</div>}
      {mMSource.contributions.map((contribution) => (
        <div key={contribution.id} className="flex">
          <div className="mr-2">{getRoleLabel(contribution.role)}:</div>
          <div className="mr-2">
            {contribution.person?.firstName
              ? contribution.person?.firstName + contribution.person?.lastName
              : contribution.organization?.name}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Tooltip;
