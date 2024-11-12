import React from "react";

const Tooltip = ({
  node,
  left,
  width,
  top,
  opacity,
}: {
  node: any;
  left?: string;
  width?: string;
  top: string;
  opacity: number;
}) => {
  const { data } = node || {};
  const { meta } = data || {};
  if (!meta) return null;
  const { noteType, composer, piece, movement, section, mm } = meta;
  const { isCommonTime, isCutTime } = section;
  const { mMSource } = mm;
  const isCommonOrCutTime = isCommonTime || isCutTime;

  return (
    <div
      className={`rounded-md bg-gray-300 text-gray-800 dark:bg-gray-900 dark:text-gray-300 p-2 text-sm shadow-md absolute pointer-events-none transition-all ease-in-out duration-250`}
      style={{ left, top, width, opacity }}
    >
      <h2 className="card-title text-sm">{`${(data.yVal || data.y).toFixed(2)} - ${noteType}`}</h2>
      <div>{composer}</div>
      <div>{piece?.title}</div>
      <div>{`${movement.rank ? `Mvt ${movement.rank} | ` : ``}${section.rank ? `Section ${section.rank}` : ``} - ${section.tempoIndication?.text}`}</div>
      <div>
        metre:{" "}
        <b>
          {isCommonOrCutTime ? (
            <>
              <span className="common-time align-middle">
                {isCommonTime ? `\u{1D134}` : `\u{1D135}`}
              </span>
              {` (${section.metreNumerator}/${section.metreDenominator})`}
            </>
          ) : (
            `${section.metreNumerator}/${section.metreDenominator}`
          )}
        </b>
      </div>
      <div>{`bpm: ${mm.beatUnit} = ${mm.bpm}`}</div>
      <div>
        source: {mMSource.year} - {mMSource.type.toLowerCase()}
      </div>
      {mMSource.title && <div className="">{mMSource.title}</div>}
      {mMSource.contributions.map((contribution) => (
        <div key={contribution.id} className="flex">
          <div className="mr-2">{contribution.role.toLowerCase()}:</div>
          <div className="mr-2">
            {contribution.person?.firstName
              ? contribution.person?.firstName + contribution.person?.lastName
              : contribution.organization?.name}
          </div>
        </div>
      ))}
      {/*<div className="text-xs">{JSON.stringify(data, null, 2)}</div>*/}
    </div>
  );
};

export default Tooltip;
