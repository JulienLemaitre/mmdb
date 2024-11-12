"use client";
import ResponsiveScatterPlot from "@/components/ResponsiveScatterPlot";
import getNotesPerSecondCollectionFromNotesPerBarCollectionAndMM from "@/utils/getNotesPerSecondCollectionFromNotesPerBarCollectionAndMM";
import React, { useCallback, useRef, useState } from "react";
// import ScatterPlotChart from "@/components/ScatterPlotChart";

type GlobalShartProps = {
  persons?: any[];
  pieceVersions?: any[];
  // filter?: {
  //   tempoIndicationId?: string;
  // };
  sectionFilterFn?: (section: any) => boolean;
};

export default function GlobalShart({
  persons,
  pieceVersions,
  // filter,
  sectionFilterFn,
}: GlobalShartProps) {
  // console.log(
  //   `[GlobalShart] filter?.tempoIndicationId :`,
  //   filter?.tempoIndicationId,
  // );
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  console.log(`[GlobalShart] selectedNode :`, selectedNode);

  const [notesToShow, setNotesToShow] = useState({
    structural: true,
    repeated: true,
    ornamental: true,
    staccato: true,
  });

  const onClick = useCallback((node, event) => {
    setSelectedNode(node);
  }, []);

  let minDate: number = 2000;
  let maxDate: number = 1000;
  let maxNotesPerSecond: number = 0;
  const chartData: any[] = [];
  const dataGroupedPerNoteTypeObject: {
    structural: any[];
    repeated: any[];
    ornamental: any[];
    staccato: any[];
  } = {
    structural: [],
    repeated: [],
    ornamental: [],
    staccato: [],
  };
  const mmList: any[] = [];
  if (pieceVersions) {
    pieceVersions.forEach((pv) => {
      const piece = pv.piece;
      if (piece.yearOfComposition < minDate) {
        minDate = piece.yearOfComposition;
      }
      if (piece.yearOfComposition > maxDate) {
        maxDate = piece.yearOfComposition;
      }
      const composer = piece.composer;
      const personDataId = composer.firstName + " " + composer.lastName;
      const personData: { xVal: number; yVal: number; meta?: any }[] = [];
      const hasMultipleMovements = pv.movements.length > 1;
      pv.movements.forEach((mvt) => {
        const hasMultipleSections = mvt.sections.length > 1;
        mvt.sections.forEach((section) => {
          if (
            typeof sectionFilterFn === "function" &&
            !sectionFilterFn(section)
            // filter?.tempoIndicationId &&
            // section.tempoIndication.id !== filter.tempoIndicationId
          ) {
            return;
          }
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
              // const mmData: any = { x: mmList.length + 1 };
              const mmData: any = { xVal: piece.yearOfComposition };
              mmData.yVal = notesPerSecond[notesPerSecondElement];
              if (mmData.yVal > maxNotesPerSecond) {
                maxNotesPerSecond = mmData.yVal;
              }

              mmData.meta = {
                noteType,
                composer: personDataId,
                piece: {
                  id: piece.id,
                  collectionId: piece.collectionId,
                  title: piece.title,
                  yearOfComposition: piece.yearOfComposition,
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
              chartData.push({
                noteType,
                ...mmData,
              });
              personData.push(mmData);
            }
          });
        });
      });

      return {
        id: personDataId,
        data: personData,
      };
    });
  }
  if (persons) {
    persons.forEach((person) => {
      const personDataId = person.firstName + " " + person.lastName;
      const personData: { x: number; y: number; meta?: any }[] = [];
      person.compositions.forEach((piece) => {
        // console.log(`[] piece :`, piece)
        if (piece.yearOfComposition < minDate) {
          minDate = piece.yearOfComposition;
        }
        if (piece.yearOfComposition > maxDate) {
          maxDate = piece.yearOfComposition;
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
                  const mmData: any = { xVal: mmList.length + 1 };
                  // const mmData: any = { x: piece.yearOfComposition };
                  mmData.yVal = notesPerSecond[notesPerSecondElement];
                  if (mmData.yVal > maxNotesPerSecond) {
                    maxNotesPerSecond = mmData.yVal;
                  }
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
                  chartData.push({
                    noteType,
                    ...mmData,
                  });
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
  }
  // console.log(
  //   `[GlobalShart] dataGroupedPerCompositor :`,
  //   dataGroupedPerCompositor,
  // );
  const dataGroupedPerNoteType = Object.entries(dataGroupedPerNoteTypeObject)
    .filter((noteType) => notesToShow[noteType[0]])
    .map(([key, value]) => ({
      // noteType: key,
      // ...value,
      id: key,
      data: value,
    }));
  console.log(`[GlobalShart] dataGroupedPerNoteType :`, dataGroupedPerNoteType);
  console.log(`[GlobalShart] chartData :`, chartData);

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
    <>
      <div className="w-full h-[800px] max-h-screen text-slate-900 dark:text-white">
        <ResponsiveScatterPlot
          data={chartData.filter((d) => notesToShow[d.noteType])}
        />
      </div>
      <div className="flex justify-center w-full border-2 border-gray-300 dark:border-gray-900 dark:text-gray-300 px-4 py-2 mt-0 mb-4 gap-3 items-center">
        <div>{`Note types filter :`}</div>
        {["Structural", "Repeated", "Ornamental", "Staccato"].map(
          (noteType) => (
            <div className="form-control" key={noteType}>
              <label className="label cursor-pointer p-0">
                <span className="label-text mr-2">{noteType}</span>
                <input
                  type="checkbox"
                  checked={notesToShow[noteType.toLowerCase()]}
                  className="checkbox checkbox-xs"
                  onChange={(e) => {
                    setNotesToShow((cur) => ({
                      ...cur,
                      [noteType.toLowerCase()]: e.target.checked,
                    }));
                  }}
                />
              </label>
            </div>
          ),
        )}
      </div>
    </>
  );
}
