"use client";
import ResponsiveScatterPlot from "@/components/ResponsiveScatterPlot";
import getNotesPerSecondCollectionFromNotesPerBarCollectionAndMM from "@/utils/getNotesPerSecondCollectionFromNotesPerBarCollectionAndMM";
import React, { useState } from "react";

type GlobalShartProps = {
  pieceVersions?: any[];
  sectionFilterFn?: (section: any) => boolean;
};
type ChartData = {
  noteType: "structural" | "repeated" | "ornamental" | "staccato";
  xVal: number;
  yVal: number;
  meta: {
    noteType: "structural" | "repeated" | "ornamental" | "staccato";
    composer: string;
    piece: {
      id: string;
      collectionId: string;
      title: string;
      yearOfComposition: string;
    };
    movement: {
      rank?: number;
    };
    section: {
      rank?: number;
      metreNumerator: number;
      metreDenominator: number;
      isCommonTime: boolean;
      isCutTime: boolean;
      comment: string;
      tempoIndication: {
        id: string;
        text: string;
      };
    };
    mm: {
      id: string;
      mMSource: {
        id: string;
        title: string;
        type: string;
        link: string;
        year: string;
        references: string;
        contributions: string;
        creator: string;
        creatorId: string;
        comment: string;
        createdAt: string;
        updatedAt: string;
      };
      mMSourceId: string;
      beatUnit: string;
      bpm: number;
      notesPerSecond: number;
      notesPerBar: number;
      createdAt: string;
      updatedAt: string;
      sectionId: string;
      comment: string;
    };
  };
};

export default function GlobalShart({
  pieceVersions,
  sectionFilterFn,
}: GlobalShartProps) {
  const [notesToShow, setNotesToShow] = useState({
    structural: true,
    repeated: true,
    ornamental: true,
    staccato: true,
  });

  let minDate: number = 2000;
  let maxDate: number = 1000;
  let maxNotesPerSecond: number = 0;
  const chartData: ChartData[] = [];
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
      const composerName = composer.firstName + " " + composer.lastName;
      const hasMultipleMovements = pv.movements.length > 1;
      pv.movements.forEach((mvt) => {
        const hasMultipleSections = mvt.sections.length > 1;
        mvt.sections.forEach((section) => {
          if (
            typeof sectionFilterFn === "function" &&
            !sectionFilterFn(section)
          ) {
            return;
          }

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
              const mmData: any = { xVal: piece.yearOfComposition };
              mmData.yVal = notesPerSecond[notesPerSecondElement];
              if (mmData.yVal > maxNotesPerSecond) {
                maxNotesPerSecond = mmData.yVal;
              }

              mmData.meta = {
                noteType,
                composer: composerName,
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
              chartData.push({
                noteType,
                ...mmData,
              });
            }
          });
        });
      });
    });
  }
  console.log(`[GlobalShart] chartData :`, chartData);

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
