"use client";
import ResponsiveScatterPlot from "@/components/ResponsiveScatterPlot";
import React, { useState } from "react";
import { ChartDatum } from "@/types/chartTypes";

type ShartWithNoteTypeFilterProps = {
  chartData: ChartDatum[];
};

export default function ShartWithNoteTypeFilter({
  chartData,
}: ShartWithNoteTypeFilterProps) {
  const [notesToShow, setNotesToShow] = useState({
    structural: true,
    repeated: true,
    ornamental: true,
    staccato: true,
  });

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
