import getNotesPerSecondCollectionFromNotesPerBarCollectionAndMM from "@/utils/getNotesPerSecondCollectionFromNotesPerBarCollectionAndMM";
import React, { Fragment } from "react";
import getKeyLabel from "@/utils/getKeyLabel";
import getSourceTypeLabel from "@/utils/getSourceTypeLabel";
import getNoteValueLabel from "@/utils/getNoteValueLabel";
import SectionMeter from "@/components/entities/section/SectionMeter";

export default function ComposerPiecesDetais({ person }) {
  return (
    <div key={person.id} className="my-16">
      <h1 className="text-3xl font-bold">{`${person.firstName} ${person.lastName}`}</h1>
      {
        // Pieces
        person.compositions.map((piece) => {
          // Piece versions
          const pieceVersion = piece.pieceVersions[0];
          const pieceSource = pieceVersion?.mMSources[0];

          if (!pieceVersion) {
            return (
              <div
                key={piece.id}
                className="my-8 border-solid border-l-4 border-l-emerald-500 pl-2"
              >
                <h2 className="text-2xl font-bold">{piece.title}</h2>
                <div>{`No Piece version found`}</div>
              </div>
            );
          }
          return (
            <div
              key={pieceVersion.id}
              className="my-8 border-solid border-l-4 border-l-emerald-500 pl-2"
            >
              <h2 className="text-2xl font-bold">{piece.title}</h2>
              <div className="flex mb-4">
                <div className="mr-4">
                  yearOfComposition: {piece.yearOfComposition}
                </div>
                <div className="mr-4">|</div>
                <div className="mr-4">category: {pieceVersion?.category}</div>
              </div>
              <div className="flex mb-4">
                <div className="w-1/2">
                  {
                    // Movements
                    pieceVersion.movements
                      .sort((a, b) => a.rank - b.rank)
                      .map((movement, movementIndex) => (
                        <div key={movement.id} className="flex">
                          <h3 className="text-xl my-1 flex-none pr-4">
                            {movement.rank} - {getKeyLabel(movement.key)}
                          </h3>
                          <div className="">
                            {
                              // sections
                              movement.sections
                                .sort((a, b) => a.rank - b.rank)
                                .map((section, sectionIndex, sectionList) => {
                                  return (
                                    <div key={section.id}>
                                      <h4 className="text-lg my-1 italic">{`${
                                        sectionList.length > 1
                                          ? `${section.rank} - `
                                          : ""
                                      }${section.tempoIndication?.text}`}</h4>
                                      <div className="border-b-2 border-gray-200">
                                        <div className="">
                                          metre :{" "}
                                          <b>
                                            <SectionMeter section={section} />
                                          </b>
                                        </div>
                                        {section.fastestStructuralNotesPerBar && (
                                          <div className="">
                                            fastest structural note per bar:{" "}
                                            <b>
                                              {
                                                section.fastestStructuralNotesPerBar
                                              }
                                            </b>
                                          </div>
                                        )}
                                        {section.fastestRepeatedNotesPerBar && (
                                          <div className="">
                                            fastest repeated note per bar:{" "}
                                            <b>
                                              {
                                                section.fastestRepeatedNotesPerBar
                                              }
                                            </b>
                                          </div>
                                        )}
                                        {section.fastestStaccatoNotesPerBar && (
                                          <div className="">
                                            fastest staccato note per bar:{" "}
                                            <b>
                                              {
                                                section.fastestStaccatoNotesPerBar
                                              }
                                            </b>
                                          </div>
                                        )}
                                        {section.fastestOrnamentalNotesPerBar && (
                                          <div className="">
                                            fastest ornamental note per bar:{" "}
                                            <b>
                                              {
                                                section.fastestOrnamentalNotesPerBar
                                              }
                                            </b>
                                          </div>
                                        )}
                                      </div>

                                      {
                                        // Metronome marks
                                        section.metronomeMarks.map((mm) => {
                                          let notesPerSecondCollectionComputedFromNotesPerBarCollection: any =
                                            null;

                                          try {
                                            // notesPerSecondComputed = getNotesPerSecondsFromNoteValues({metronomeMark: mm})
                                            notesPerSecondCollectionComputedFromNotesPerBarCollection =
                                              getNotesPerSecondCollectionFromNotesPerBarCollectionAndMM(
                                                {
                                                  section,
                                                  metronomeMark: mm,
                                                },
                                              );
                                            // console.log(
                                            //   `[Home] notesPerSecondComputedFromNotesPerBar :`,
                                            //   notesPerSecondCollectionComputedFromNotesPerBarCollection,
                                            // );
                                          } catch (e: any) {
                                            console.log(
                                              `--------------------------------------------------`,
                                            );
                                            console.log(
                                              `[getNotesPerSecondCollectionFromNotesPerBarCollectionAndMM ERROR] mm :`,
                                              e?.message,
                                            );
                                            console.log(
                                              `[] ${person.firstName} ${person.lastName}: ${piece.title} - mvt#${movement.rank} - section#${section.rank}`,
                                            );
                                            console.log(
                                              `[] mm`,
                                              JSON.stringify(mm),
                                            );
                                            // notesPerSecondComputed = e?.message
                                          }

                                          return (
                                            <div key={mm.id}>
                                              <div className="mr-4">{`${getNoteValueLabel(mm.beatUnit)} = ${mm.bpm}`}</div>

                                              {[
                                                "fastestStructuralNotes",
                                                "fastestStaccatoNotes",
                                                "fastestOrnamentalNotes",
                                                "fastestRepeatedNotes",
                                              ].map((keyBase, index) => {
                                                const originalNotesPerSecond =
                                                  mm.notesPerSecond?.[
                                                    keyBase + "PerSecond"
                                                  ];
                                                // const originalNotesPerSecond: any = mm.notesPerSecond
                                                // const computedNotesPerSecond = notesPerSecondComputed?.[keyBase + 'PerSecond'] ? Math.round(notesPerSecondComputed[keyBase + 'PerSecond'] * 100) / 100 : null
                                                // const isNotesPerSecondDiff = computedNotesPerSecond && Math.abs(mm.notesPerSecond?.[keyBase + 'PerSecond'] - computedNotesPerSecond) > 0.01

                                                const computedNotesPerSecondFromNotesPerBar =
                                                  notesPerSecondCollectionComputedFromNotesPerBarCollection?.[
                                                    keyBase + "PerSecond"
                                                  ]
                                                    ? Math.round(
                                                        notesPerSecondCollectionComputedFromNotesPerBarCollection[
                                                          keyBase + "PerSecond"
                                                        ] * 100,
                                                      ) / 100
                                                    : null;
                                                const isOriginalNotesPerSecondAndComputedDiff =
                                                  originalNotesPerSecond &&
                                                  computedNotesPerSecondFromNotesPerBar &&
                                                  Math.abs(
                                                    computedNotesPerSecondFromNotesPerBar -
                                                      originalNotesPerSecond,
                                                  ) > 0.01;
                                                const hasDataInconsistency =
                                                  (originalNotesPerSecond &&
                                                    !computedNotesPerSecondFromNotesPerBar) ||
                                                  (!originalNotesPerSecond &&
                                                    computedNotesPerSecondFromNotesPerBar);

                                                /*if (
                                            isOriginalNotesPerSecondAndComputedDiff
                                          ) {
                                            console.log(
                                              `--------------------------------------------------`,
                                            );
                                            console.group(
                                              `-- HOME ERROR -- ${
                                                isOriginalNotesPerSecondAndComputedDiff
                                                  ? "isOriginalNotesPerSecondAndComputedDiff"
                                                  : "BPM = 108 DEBUG"
                                              } --`,
                                            );
                                            console.log(
                                              `[] ${person.firstName} ${person.lastName}: ${piece.title} - mvt#${movement.rank} - section#${section.rank}`,
                                            );
                                            console.log(
                                              `[] mm.notesPerSecond :`,
                                              mm.notesPerSecond,
                                            );
                                            console.log(
                                              `[] mm.notesPerBar :`,
                                              mm.notesPerBar,
                                            );
                                            console.log(
                                              `[] mm.notesPerSecond?.[${
                                                keyBase +
                                                "PerSecond"
                                              }] (originalNotesPerSecond) :`,
                                              originalNotesPerSecond,
                                            );
                                            console.log(
                                              `[] computedNotesPerSecondFromNotesPerBar :`,
                                              computedNotesPerSecondFromNotesPerBar,
                                            );
                                            console.log(
                                              `[] section`,
                                              JSON.stringify(
                                                section,
                                                null,
                                                2,
                                              ),
                                            );
                                            console.groupEnd();
                                          }*/

                                                return (
                                                  <Fragment
                                                    key={mm.id + keyBase}
                                                  >
                                                    {computedNotesPerSecondFromNotesPerBar && (
                                                      <div className="mr-4">
                                                        {keyBase}:
                                                        <span
                                                          // className={`${isNotesPerSecondFromNotesPerBarDiff ? "bg-red-500 text-white px-2" : ""} ml-1`}>
                                                          className={`${
                                                            computedNotesPerSecondFromNotesPerBar >=
                                                            15
                                                              ? "bg-red-500"
                                                              : computedNotesPerSecondFromNotesPerBar >=
                                                                  11
                                                                ? "bg-orange-400"
                                                                : computedNotesPerSecondFromNotesPerBar >=
                                                                    8
                                                                  ? "bg-amber-200"
                                                                  : "bg-white"
                                                          } px-2`}
                                                        >
                                                          {
                                                            computedNotesPerSecondFromNotesPerBar
                                                          }{" "}
                                                          /s
                                                        </span>
                                                      </div>
                                                    )}
                                                    {hasDataInconsistency && (
                                                      <div className="mr-4 bg-red-500 py-4">
                                                        {`${keyBase}: INCONSISTENCY originalNotesPerSecond: ${JSON.stringify(
                                                          originalNotesPerSecond,
                                                        )} | computedNotesPerSecondFromNotesPerBar: ${JSON.stringify(
                                                          computedNotesPerSecondFromNotesPerBar,
                                                        )}`}
                                                      </div>
                                                    )}
                                                    {hasDataInconsistency ||
                                                    isOriginalNotesPerSecondAndComputedDiff ? (
                                                      <div className="mr-4 text-gray-400">
                                                        ORIGINAL:
                                                        <span
                                                          className={`${
                                                            originalNotesPerSecond >=
                                                            15
                                                              ? "bg-red-500"
                                                              : originalNotesPerSecond >=
                                                                  11
                                                                ? "bg-orange-400"
                                                                : originalNotesPerSecond >=
                                                                    8
                                                                  ? "bg-amber-200"
                                                                  : "bg-white"
                                                          } px-2`}
                                                        >
                                                          {
                                                            mm.notesPerSecond?.[
                                                              keyBase +
                                                                "PerSecond"
                                                            ]
                                                          }
                                                        </span>
                                                        (
                                                        <span
                                                          className={
                                                            !mm.notesPerBar?.[
                                                              keyBase + "PerBar"
                                                            ]
                                                              ? "text-red-500"
                                                              : ""
                                                          }
                                                        >
                                                          {mm.notesPerBar?.[
                                                            keyBase + "PerBar"
                                                          ] ||
                                                            "Unable to find computed note per bar"}
                                                        </span>
                                                        {originalNotesPerSecond && (
                                                          <span className="ml-1">
                                                            Originally{" "}
                                                            <span
                                                              className={`${
                                                                isOriginalNotesPerSecondAndComputedDiff
                                                                  ? "bg-red-500 text-white px-2"
                                                                  : ""
                                                              } ml-1`}
                                                            >
                                                              {
                                                                originalNotesPerSecond
                                                              }
                                                            </span>
                                                          </span>
                                                        )}
                                                        )
                                                      </div>
                                                    ) : null}
                                                  </Fragment>
                                                );
                                              })}
                                            </div>
                                          );
                                        })
                                      }
                                    </div>
                                  );
                                })
                            }
                          </div>
                        </div>
                      ))
                  }
                </div>
                <div className="w-1/2">
                  {pieceSource ? (
                    <div className="ml-4 border-2 border-gray-300 rounded-2xl p-4">
                      <div className="flex">
                        <div className="mr-4">Source:</div>
                        <div>
                          <div className="">
                            {pieceSource.mMSource.year} -{" "}
                            {getSourceTypeLabel(pieceSource.mMSource.type)}
                          </div>
                          {pieceSource.mMSource.title && (
                            <div className="">{pieceSource.mMSource.title}</div>
                          )}
                          {pieceSource.mMSource.link && (
                            <div className=" break-all">
                              <a
                                href={pieceSource.mMSource.link}
                                target="_blank"
                              >
                                {pieceSource.mMSource.link}
                              </a>
                            </div>
                          )}
                          {pieceSource.mMSource.references &&
                            pieceSource.mMSource.references.length > 0 && (
                              <div className="">
                                {JSON.stringify(
                                  pieceSource.mMSource.references,
                                )}
                              </div>
                            )}
                        </div>
                      </div>
                      {pieceSource.mMSource.contributions.map(
                        (contribution) => (
                          <div key={contribution.id} className="flex">
                            <div className="mr-4">
                              {contribution.role.toLowerCase()}:
                            </div>
                            <div className="mr-4">
                              {contribution.person?.firstName
                                ? contribution.person?.firstName +
                                  contribution.person?.lastName
                                : contribution.organization?.name}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  ) : (
                    <div className="ml-4 border-2 border-gray-300 rounded-2xl p-4">
                      <div className="flex">
                        <div className="mr-4">Source:</div>
                        <div>
                          <div className="">No source</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })
      }
    </div>
  );
}
