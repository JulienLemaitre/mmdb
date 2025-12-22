"use client";

import React, { useState } from "react";
import MMSourceDetailsCompact from "./MMSourceDetailsCompact";
import { displaySourceYear } from "@/utils/displaySourceYear";
import getSourceTypeLabel from "@/utils/getSourceTypeLabel";
import getReferenceTypeLabel from "@/utils/getReferenceTypeLabel";
import getIMSLPPermaLink from "@/utils/getIMSLPPermaLink";
import getRoleLabel from "@/utils/getRoleLabel";
import getNotesPerSecondCollectionFromNotesPerBarCollectionAndMM from "@/utils/getNotesPerSecondCollectionFromNotesPerBarCollectionAndMM";

export default function MMSourceSummary({
  mMSource,
  sortBySpeed = false,
  tempoIndicationIds = [],
}: {
  mMSource: any;
  sortBySpeed?: boolean;
  tempoIndicationIds?: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  // Calculate number of pieces
  const pieceCount = mMSource.pieceVersions.length;

  // Identify collection or pieces for display
  const allCollections = mMSource.pieceVersions
    .map((pvs: any) => pvs.pieceVersion?.piece?.collection)
    .filter((c: any) => c !== null);

  const uniqueCollectionIds = new Set(allCollections.map((c: any) => c.id));
  const isCompleteCollection =
    uniqueCollectionIds.size === 1 &&
    allCollections.length === mMSource.pieceVersions.length;

  const collectionName = isCompleteCollection ? allCollections[0].title : null;
  const pieceTitles = !isCompleteCollection
    ? Array.from(
        new Set(
          mMSource.pieceVersions.map(
            (pvs: any) => pvs.pieceVersion?.piece?.title,
          ),
        ),
      ).join(", ")
    : null;

  // Collect all speed computations for the indicator line
  const speeds: number[] = [];
  mMSource.pieceVersions.forEach((pvs) => {
    pvs.pieceVersion.movements.forEach((mv) => {
      mv.sections.forEach((section) => {
        // Filter by tempo indication if provided
        if (
          tempoIndicationIds.length > 0 &&
          !tempoIndicationIds.includes(section?.tempoIndication?.id)
        ) {
          return;
        }

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
    <div className="my-4 border border-base-300 rounded-lg overflow-hidden shadow-sm transition-all duration-200">
      <div
        className="cursor-pointer hover:bg-base-200 transition-colors bg-base-100"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="p-4 border-l-2 border-l-info/10 hover:border-l-info transition-all duration-150">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="mb-1">
                <span className="text-lg font-semibold text-info">
                  {collectionName || pieceTitles}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-lg text-info">
                  {displaySourceYear(mMSource)} -{" "}
                  {getSourceTypeLabel(mMSource.type)}
                </span>
                {mMSource.title && (
                  <span className="text-info font-medium">
                    | {mMSource.title}
                  </span>
                )}
              </div>

              <div className="text-xs text-base-content/70 flex flex-wrap gap-x-4 gap-y-1 mb-2">
                {mMSource.createdAt && (
                  <span>
                    Entry: {new Date(mMSource.createdAt).toLocaleDateString()}
                    {mMSource.creator?.name && ` by ${mMSource.creator.name}`}
                  </span>
                )}
                <span>
                  Pieces: <span className="font-bold">{pieceCount}</span>
                </span>
              </div>

              {mMSource.link && (
                <div className="mb-2 text-xs">
                  <span className="font-semibold">Link: </span>
                  <a
                    href={getIMSLPPermaLink(mMSource.link)}
                    target="_blank"
                    rel="noreferrer"
                    className="link link-primary break-all"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {mMSource.link}
                  </a>
                </div>
              )}

              {mMSource.references && mMSource.references.length > 0 && (
                <div className="mb-1 text-xs flex flex-wrap items-baseline gap-x-2">
                  <span className="uppercase text-[10px] text-info font-bold shrink-0">
                    References:
                  </span>
                  <div className="flex flex-wrap gap-x-2">
                    {mMSource.references.map((ref: any, idx: number) => (
                      <span key={idx}>
                        <span className="font-medium">
                          {getReferenceTypeLabel(ref.type)}:{" "}
                        </span>
                        {ref.reference}
                        {idx < mMSource.references.length - 1 && (
                          <span className="ml-2 text-base-content/30">/</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {mMSource.contributions && mMSource.contributions.length > 0 && (
                <div className="text-xs flex flex-wrap items-baseline gap-x-2">
                  <span className="uppercase text-[10px] text-info font-bold shrink-0">
                    Contributors:
                  </span>
                  <div className="flex flex-wrap gap-x-2">
                    {mMSource.contributions.map(
                      (contribution: any, idx: number) => (
                        <span key={idx}>
                          <span className="font-medium">
                            {getRoleLabel(contribution.role)}:{" "}
                          </span>
                          {contribution.person
                            ? `${contribution.person.firstName} ${contribution.person.lastName}`
                            : contribution.organization?.name}
                          {idx < mMSource.contributions.length - 1 && (
                            <span className="ml-2 text-base-content/30">/</span>
                          )}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="ml-4">
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
        <div className="p-2 sm:p-4 border-t border-base-300 bg-base-100">
          <MMSourceDetailsCompact
            mMSource={mMSource}
            tempoIndicationIds={tempoIndicationIds}
          />
        </div>
      )}
    </div>
  );
}
