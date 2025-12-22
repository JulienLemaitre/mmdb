"use client";

import React from "react";
import getKeyLabel from "@/utils/getKeyLabel";
import formatToPhraseCase from "@/utils/formatToPhraseCase";
import { SectionDetail } from "@/features/section/ui/SectionDetail";

export default function MMSourceDetailsCompact({
  mMSource,
}: {
  mMSource: any;
}) {
  // Utility function to organize piece versions into groups by collection
  // Adapted from FeedSummary.tsx
  function processPieceVersionsForDisplay(pieceVersions: any[]) {
    const processedGroups: Array<{
      type: "collection" | "single";
      collection?: any;
      pieces: Array<{
        pieceVersion: any;
        piece: any;
        composer: any;
      }>;
    }> = [];

    let currentGroup: (typeof processedGroups)[0] | null = null;

    // Sort by rank if available, otherwise keep original order
    const sortedPvs = [...pieceVersions].sort(
      (a, b) => (a.rank || 0) - (b.rank || 0),
    );

    sortedPvs.forEach((pvs: any) => {
      const pieceVersion = pvs.pieceVersion;
      if (!pieceVersion) return;

      const piece = pieceVersion?.piece;
      const collection = piece?.collection;
      const composer = piece?.composer;

      // Determine if we need a new group
      const needNewGroup =
        !currentGroup ||
        (collection &&
          (currentGroup.type !== "collection" ||
            currentGroup.collection?.id !== collection.id)) ||
        (!collection &&
          (currentGroup.type !== "single" ||
            currentGroup.pieces.some((p) => p.piece.id !== piece.id)));

      if (needNewGroup) {
        currentGroup = {
          type: collection ? "collection" : "single",
          collection,
          pieces: [],
        };
        processedGroups.push(currentGroup);
      }

      // Add piece to current group
      currentGroup?.pieces.push({
        pieceVersion,
        piece,
        composer,
      });
    });

    return processedGroups;
  }

  const organizedData = processPieceVersionsForDisplay(mMSource.pieceVersions);

  const getPersonName = (person: any) => {
    return person ? `${person.firstName} ${person.lastName}` : "";
  };

  return (
    <div className="space-y-4">
      <ul className="space-y-4">
        {organizedData.map((group, groupIndex) => {
          if (group.type === "collection") {
            const composer = group.pieces[0]?.composer;

            return (
              <li key={`collection-${group.collection.id}-${groupIndex}`}>
                <div className="border-l-2 border-l-warning/10 hover:border-l-warning rounded-lg transition-all duration-150 bg-warning/5 overflow-hidden">
                  {/* Collection Header */}
                  <div className="px-3 py-2 bg-warning/10 border-b border-warning/20">
                    <div className="flex flex-wrap gap-2 items-baseline">
                      <h3 className="text-md font-bold text-warning">
                        {group.collection.title}
                      </h3>
                      <span className="text-sm text-warning/80">
                        {composer && ` - ${getPersonName(composer)}`}
                      </span>
                      <div className="text-xs text-warning/60 font-medium ml-auto">
                        {`Collection\u2002•\u2002${group.pieces.length} piece${group.pieces.length > 1 ? "s" : ""}`}
                      </div>
                    </div>
                  </div>

                  {/* Collection Pieces */}
                  <div className="p-2 space-y-3">
                    {group.pieces.map((pieceGroup) => {
                      const { pieceVersion, piece } = pieceGroup;
                      const movementCount = pieceVersion.movements?.length || 0;
                      const isMonoMovementPiece = movementCount === 1;

                      return (
                        <div
                          key={`${piece.id}-${pieceVersion.id}`}
                          className="border border-base-300 rounded-lg border-l-2 border-l-accent/10 hover:border-l-accent transition-all duration-150 bg-base-100 overflow-hidden"
                        >
                          {/* Piece Header */}
                          <div className="px-3 py-2 bg-accent/10 border-b border-accent/20">
                            <h4 className="text-sm font-bold text-accent">
                              {piece?.title}
                              {isMonoMovementPiece &&
                                pieceVersion.movements?.[0] &&
                                ` in ${getKeyLabel(pieceVersion.movements[0].key)}`}
                            </h4>
                            <div className="text-[10px] text-accent/70 font-medium flex gap-2">
                              {piece?.yearOfComposition && (
                                <span>Comp: {piece.yearOfComposition}</span>
                              )}
                              {pieceVersion?.category && (
                                <span>
                                  • {formatToPhraseCase(pieceVersion.category)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Movements and Sections */}
                          <div className="py-1">
                            {pieceVersion.movements?.map(
                              (movement: any, mvtIndex: number) => (
                                <div
                                  key={`mvt-${mvtIndex}`}
                                  className={
                                    isMonoMovementPiece
                                      ? ""
                                      : `ml-2 border-l-2 border-l-primary/10 hover:border-l-primary transition-all duration-150`
                                  }
                                >
                                  {!isMonoMovementPiece && (
                                    <div className="px-3 py-1 bg-primary/5">
                                      <h5 className="text-[11px] font-bold text-primary">
                                        Mvt {movement.rank}:{" "}
                                        {getKeyLabel(movement.key)}
                                      </h5>
                                    </div>
                                  )}

                                  <div className="ml-1 space-y-1 py-1">
                                    {movement.sections?.map((section: any) => (
                                      <SectionDetail
                                        key={section.id}
                                        section={section}
                                      />
                                    ))}
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </li>
            );
          } else {
            // Single piece
            const pieceGroup = group.pieces[0];
            const { pieceVersion, piece, composer } = pieceGroup;
            const movementCount = pieceVersion.movements?.length || 0;
            const isMonoMovementPiece = movementCount === 1;

            return (
              <li key={`single-${piece.id}-${pieceVersion.id}`}>
                <div className="border border-base-300 rounded-lg border-l-2 border-l-accent/10 hover:border-l-accent transition-all duration-150 bg-base-100 overflow-hidden">
                  {/* Single Piece Header */}
                  <div className="px-3 py-2 bg-accent/10 border-b border-accent/20">
                    <div className="flex flex-wrap gap-2 items-baseline">
                      <h3 className="text-md font-bold text-accent">
                        {piece?.title}
                        {isMonoMovementPiece &&
                          pieceVersion.movements?.[0] &&
                          ` in ${getKeyLabel(pieceVersion.movements[0].key)}`}
                      </h3>
                      <span className="text-sm text-accent/80">
                        {composer && ` - ${getPersonName(composer)}`}
                      </span>
                    </div>
                    <div className="text-[10px] text-accent/70 font-medium flex gap-2">
                      {piece?.yearOfComposition && (
                        <span>Comp: {piece.yearOfComposition}</span>
                      )}
                      {pieceVersion?.category && (
                        <span>
                          • {formatToPhraseCase(pieceVersion.category)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Movements and Sections */}
                  <div className="py-1">
                    {pieceVersion.movements?.map(
                      (movement: any, mvtIndex: number) => (
                        <div
                          key={`mvt-${mvtIndex}`}
                          className={
                            isMonoMovementPiece
                              ? ""
                              : `ml-2 border-l-2 border-l-primary/10 hover:border-l-primary transition-all duration-150`
                          }
                        >
                          {!isMonoMovementPiece && (
                            <div className="px-3 py-1 bg-primary/5">
                              <h5 className="text-[11px] font-bold text-primary">
                                Mvt {movement.rank}: {getKeyLabel(movement.key)}
                              </h5>
                            </div>
                          )}

                          <div className="ml-1 space-y-1 py-1">
                            {movement.sections?.map((section: any) => (
                              <SectionDetail
                                key={section.id}
                                section={section}
                              />
                            ))}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </li>
            );
          }
        })}
      </ul>
    </div>
  );
}
