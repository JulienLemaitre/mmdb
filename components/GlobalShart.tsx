"use client";
import { ResponsiveScatterPlot } from "@nivo/scatterplot";
import getNotesPerSecondCollectionFromNotesPerBarCollectionAndMM from "@/utils/getNotesPerSecondCollectionFromNotesPerBarCollectionAndMM";
import { useCallback, useRef, useState } from "react";

export default function GlobalShart({ persons }) {
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  console.log(`[GlobalShart] selectedNode :`, selectedNode);

  const onClick = useCallback((node, event) => {
    setSelectedNode(node);
  }, []);

  let minDate: number = 2000;
  const dataGroupedPerNoteTypeObject = {
    structural: [],
    repeated: [],
    ornamental: [],
    staccato: [],
  };
  const mmList: any[] = [];
  const dataGroupedPerCompositor = persons
    // Sort persons by birth date
    .map((person) => {
      const personDataId = person.firstName + " " + person.lastName;
      const personData: { x: number; y: number; meta?: any }[] = [];
      person.compositions.forEach((piece) => {
        // console.log(`[] piece :`, piece)
        if (piece.yearOfComposition < minDate) {
          minDate = piece.yearOfComposition;
        }
        piece.pieceVersions.forEach((pv) => {
          const hasMultipleMovements = pv.movements.length > 1;
          pv.movements.forEach((mvt) => {
            const hasMultipleSections = mvt.sections.length > 1;
            mvt.sections.forEach((section) => {
              // console.log(`[GlobalShart] section :`, section);

              section?.metronomeMarks?.forEach((MM) => {
                const notesPerSecond =
                  getNotesPerSecondCollectionFromNotesPerBarCollectionAndMM({
                    metronomeMark: MM,
                    section,
                  });
                for (const notesPerSecondElement in notesPerSecond) {
                  const noteType = notesPerSecondElement
                    .replace(/fastest/g, "")
                    .replace(/NotesPerSecond/g, "")
                    .toLowerCase();
                  const mmData: any = { x: mmList.length + 1 };
                  // const mmData: any = { x: piece.yearOfComposition };
                  mmData.y = notesPerSecond[notesPerSecondElement];
                  mmData.meta = {
                    noteType,
                    composer: personDataId,
                    piece: {
                      title: piece.title,
                    },
                    movement: {
                      ...(hasMultipleMovements ? { rank: mvt.rank } : {}),
                    },
                    section: {
                      ...(hasMultipleSections ? { rank: section.rank } : {}),
                      metreNumerator: section.metreNumerator,
                      metreDenominator: section.metreDenominator,
                      isCommonTime: section.isCommonTime,
                      isCutTime: section.isCutTime,
                      comment: section.comment,
                      tempoIndication: section.tempoIndication,
                    },
                    mm: MM,
                  };
                  mmList.push(mmData);
                  dataGroupedPerNoteTypeObject[noteType].push(mmData);
                  personData.push(mmData);
                }
              });
            });
          });
        });
      });

      return {
        id: personDataId,
        data: personData,
      };
    });
  // console.log(
  //   `[GlobalShart] dataGroupedPerCompositor :`,
  //   dataGroupedPerCompositor,
  // );
  const dataGroupedPerNoteType = Object.entries(
    dataGroupedPerNoteTypeObject,
  ).map(([key, value]) => ({
    id: key,
    data: value,
  }));
  // console.log(`[GlobalShart] dataGroupedPerNoteType :`, dataGroupedPerNoteType);
  // console.log(`[GlobalShart] minDate :`, minDate);

  // axis: Partial<{domain: Partial<{line: Partial<Partial<CSSProperties>>}>, ticks: Partial<...>, legend: Partial<...>}
  const theme = {
    text: {
      fill: "#aaaaaa",
    },
    // axis: {
    //   domain: {
    //     line: {
    //       strokeWidth: 1,
    //       stroke: "#aaaaaa",
    //     },
    //   },
    //   ticks: {
    //     line: {
    //       strokeWidth: 1,
    //       stroke: "#aaaaaa",
    //     },
    //     text: {
    //       fill: "#aaaaaa",
    //     },
    //   },
    //   legend: {
    //     text: {
    //       fill: "#aaaaaa",
    //     },
    //   },
    // },
  };

  return (
    <ResponsiveScatterPlot
      data={dataGroupedPerNoteType}
      theme={theme}
      margin={{ top: 60, right: 140, bottom: 70, left: 90 }}
      xScale={{ type: "linear", min: 0, max: "auto" }}
      // xScale={{ type: "linear", min: minDate - 10, max: "auto" }}
      // xFormat=">-.2f"
      yScale={{ type: "linear", min: 0, max: "auto" }}
      yFormat=">-.2r"
      blendMode="soft-light"
      axisTop={null}
      axisRight={null}
      axisBottom={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: "Metronome Marks",
        legendPosition: "middle",
        legendOffset: 46,
        truncateTickAt: 0,
      }}
      axisLeft={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: "nb notes per second",
        legendPosition: "middle",
        legendOffset: -60,
        truncateTickAt: 0,
      }}
      legends={[
        {
          anchor: "bottom-right",
          direction: "column",
          justify: false,
          translateX: 130,
          translateY: 0,
          itemWidth: 100,
          itemHeight: 12,
          itemsSpacing: 5,
          itemDirection: "left-to-right",
          symbolSize: 12,
          symbolShape: "circle",
          effects: [
            {
              on: "hover",
              style: {
                itemOpacity: 1,
              },
            },
          ],
        },
      ]}
      tooltip={Tooltip}
      onClick={onClick}
      motionConfig="stiff"
    />
  );
}

const Tooltip = ({ node: { data } }) => {
  const { meta } = data;
  // console.log(`[Tooltip] meta :`, meta);
  const { noteType, composer, piece, movement, section, mm } = meta;
  const { isCommonTime, isCutTime } = section;
  const { mMSource } = mm;
  const isCommonOrCutTime = isCommonTime || isCutTime;
  // return <div>{JSON.stringify(meta, null, 2)}</div>;
  return (
    <div className="rounded-md bg-gray-300 text-gray-800 dark:bg-gray-900 dark:text-gray-300 p-2 text-sm shadow-md">
      <h2 className="card-title text-sm">{`${data.y.toFixed(2)} - ${noteType}`}</h2>
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
      {mMSource.title && <div className="">{mMSource.mMSource.title}</div>}
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
