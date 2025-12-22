"use client";

import React, { useState } from "react";
import MMSourceDetails from "./MMSourceDetails";
import { displaySourceYear } from "@/utils/displaySourceYear";
import getSourceTypeLabel from "@/utils/getSourceTypeLabel";
import getNotesPerSecondCollectionFromNotesPerBarCollectionAndMM from "@/utils/getNotesPerSecondCollectionFromNotesPerBarCollectionAndMM";

export default function MMSourceSummary({
  mMSource,
  sortBySpeed = false,
}: {
  mMSource: any;
  sortBySpeed?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  // Calculate number of pieces
  const pieceCount = mMSource.pieceVersions.length;

  // Get contributors
  const contributors = mMSource.contributions
    .map((c) => {
      const name = c.person
        ? `${c.person.firstName} ${c.person.lastName}`
        : c.organization?.name;
      return `${c.role}: ${name}`;
    })
    .join(", ");

  // Collect all speed computations for the indicator line
  const speeds: number[] = [];
  mMSource.pieceVersions.forEach((pvs) => {
    pvs.pieceVersion.movements.forEach((mv) => {
      mv.sections.forEach((section) => {
        section.metronomeMarks.forEach((mm) => {
          if (mm.noMM) return;
          try {
            const npsCollection =
              getNotesPerSecondCollectionFromNotesPerBarCollectionAndMM({
                section,
                metronomeMark: mm,
              });
            [
              "fastestStructuralNotesPerSecond",
              "fastestStaccatoNotesPerSecond",
              "fastestOrnamentalNotesPerSecond",
              "fastestRepeatedNotesPerSecond",
            ].forEach((key) => {
              if (npsCollection[key]) {
                speeds.push(npsCollection[key]);
              }
            });
          } catch (e) {
            // Ignore sections without notes per bar data
          }
        });
      });
    });
  });

  // Sort speeds if requested
  const displaySpeeds = sortBySpeed
    ? [...speeds].sort((a, b) => a - b)
    : speeds;

  const getSpeedColor = (speed: number) => {
    if (speed >= 15) return "bg-red-500";
    if (speed >= 11) return "bg-orange-400";
    if (speed >= 8) return "bg-amber-200";
    return "bg-white";
  };

  return (
    <div className="my-4 border border-base-300 rounded-lg overflow-hidden shadow-sm">
      <div
        className="p-4 cursor-pointer hover:bg-base-200 transition-colors flex justify-between items-center bg-base-100"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-lg">
              {displaySourceYear(mMSource)} -{" "}
              {getSourceTypeLabel(mMSource.type)}
            </span>
            {mMSource.title && (
              <span className="text-base-content/70">| {mMSource.title}</span>
            )}
          </div>
          <div className="text-sm flex flex-wrap gap-x-4 gap-y-1">
            {contributors && (
              <span className="text-base-content/80">{contributors}</span>
            )}
            <span className="text-base-content/80">
              Pieces:{" "}
              <span className="font-medium text-base-content">
                {pieceCount}
              </span>
            </span>
            {mMSource.createdAt && (
              <span className="text-base-content/60 italic text-xs">
                Entry: {new Date(mMSource.createdAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            className={`btn btn-ghost btn-sm btn-circle transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m19.5 8.25-7.5 7.5-7.5-7.5"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Speed indicator line */}
      <div className="flex h-1.5 w-full">
        {displaySpeeds.length > 0 ? (
          displaySpeeds.map((speed, i) => (
            <div
              key={i}
              className={`flex-1 h-full ${getSpeedColor(speed)} border-r border-gray-100/20 last:border-0`}
              title={`${Math.round(speed * 100) / 100} notes/s`}
            />
          ))
        ) : (
          <div className="w-full h-full bg-base-200" />
        )}
      </div>

      {/* Expandable details */}
      {isOpen && (
        <div className="p-4 border-t border-base-300 bg-base-50">
          <MMSourceDetails mMSource={mMSource} />
        </div>
      )}
    </div>
  );
}
