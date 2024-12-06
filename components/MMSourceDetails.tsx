import getNotesPerSecondCollectionFromNotesPerBarCollectionAndMM from "@/utils/getNotesPerSecondCollectionFromNotesPerBarCollectionAndMM";
import React, { Fragment } from "react";
import getKeyLabel from "@/utils/getKeyLabel";
import getKeyBaseString from "@/utils/getKeyBaseString";
import { KeyBase } from "@/types/formTypes";

export default function MMSourceDetails({ mMSource }) {
  // Gather collections
  const collectionIds: any[] = [];
  const pieceVersionWithCollectionField = mMSource.pieceVersions
    .sort((a, b) => a.rank - b.rank)
    .map((pvs) => {
      const collection = pvs.pieceVersion.piece.collection;
      const isCollectionAlreadyDisplayed = !!(
        collection && collectionIds.includes(collection.id)
      );
      if (collection && !isCollectionAlreadyDisplayed) {
        collectionIds.push(collection.id);
      }
      return {
        ...pvs,
        ...(!isCollectionAlreadyDisplayed ? { collection } : {}),
      };
    });

  // console.log(`top-${mMSource.id}`);

  return (
    <div className="my-16" key={`top-${mMSource.id}`}>
      {
        // Pieces
        pieceVersionWithCollectionField.map((pvs, index) => {
          // Piece versions
          const pieceVersion = pvs.pieceVersion;
          const piece = pieceVersion.piece;
          const collection = pvs.collection;
          const composerName =
            piece.composer.firstName + " " + piece.composer.lastName;
          // console.log(piece.id + `-pv`);

          if (!pieceVersion) {
            return (
              <div
                key={piece.id + `-pv`}
                className="my-8 border-solid border-l-4 border-l-emerald-500 pl-2"
              >
                <div>{`${composerName}`}</div>
                <h3 className="text-2xl font-bold">{piece.title}</h3>
                <div>{`No Piece version found`}</div>
              </div>
            );
          }

          // console.log(pieceVersion.id + "-nopv");

          return (
            <div className="my-8 flex" key={pieceVersion.id + "-nopv"}>
              <div className="w-1/2">
                {collection ? (
                  <div className="my-8 border-solid border-l-8 border-l-primary pl-2">
                    <h2 className="text-3xl font-bold primary">
                      {collection.title}
                    </h2>
                  </div>
                ) : null}
                <div className="border-solid border-l-4 border-l-emerald-500 pl-2">
                  <div>{`${composerName}`}</div>
                  <h3 className="text-2xl font-bold">{piece.title}</h3>
                  <div className="flex mb-4">
                    <div className="mr-4">
                      yearOfComposition: {piece.yearOfComposition}
                    </div>
                    <div className="mr-4">|</div>
                    <div className="mr-4">
                      category: {pieceVersion?.category}
                    </div>
                  </div>
                  {
                    // Movements
                    pieceVersion.movements
                      .sort((a, b) => a.rank - b.rank)
                      .map((movement) => (
                        <div key={movement.id} className="flex">
                          <h4 className="text-xl my-1 flex-none pr-4">
                            {movement.rank} - {getKeyLabel(movement.key)}
                          </h4>
                          <div className="">
                            {
                              // sections
                              movement.sections
                                .sort((a, b) => a.rank - b.rank)
                                .map((section, _, sectionList) => {
                                  const { isCommonTime, isCutTime } = section;
                                  const isCommonOrCutTime =
                                    isCommonTime || isCutTime;

                                  return (
                                    <div key={section.id}>
                                      <h5 className="text-lg my-1 italic">{`${
                                        sectionList.length > 1
                                          ? `${section.rank} - `
                                          : ""
                                      }${section.tempoIndication?.text}`}</h5>
                                      <div className="border-b-2 border-gray-200">
                                        <div className="">
                                          metre :{" "}
                                          <b>
                                            {isCommonOrCutTime ? (
                                              <>
                                                <span className="common-time align-middle">
                                                  {isCommonTime
                                                    ? `\u{1D134}`
                                                    : `\u{1D135}`}
                                                </span>
                                                {` (${section.metreNumerator}/${section.metreDenominator})`}
                                              </>
                                            ) : (
                                              `${section.metreNumerator}/${section.metreDenominator}`
                                            )}
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
                                          const hasNoMM = !!mm.noMM;

                                          if (hasNoMM) {
                                            return (
                                              <div
                                                key={mm.id}
                                              >{`No Metronome Mark`}</div>
                                            );
                                          }

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
                                              `[] ${composerName}: ${piece.title} - mvt#${movement.rank} - section#${section.rank}`,
                                            );
                                            console.log(
                                              `[] mm`,
                                              JSON.stringify(mm),
                                            );
                                            // notesPerSecondComputed = e?.message
                                          }

                                          return (
                                            <div key={mm.id}>
                                              <div className="mr-4">{`${mm.beatUnit} = ${mm.bpm}`}</div>

                                              {[
                                                "fastestStructuralNotes",
                                                "fastestStaccatoNotes",
                                                "fastestOrnamentalNotes",
                                                "fastestRepeatedNotes",
                                              ].map((keyBase) => {
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
                                                  false;
                                                // const hasDataInconsistency =
                                                //   (originalNotesPerSecond &&
                                                //     !computedNotesPerSecondFromNotesPerBar) ||
                                                //   (!originalNotesPerSecond &&
                                                //     computedNotesPerSecondFromNotesPerBar);

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
                                                        {getKeyBaseString(
                                                          keyBase as KeyBase,
                                                        )}
                                                        :
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
                                                          } px-2 text-black`}
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
              </div>
              {index === 0 ? (
                <div className="w-1/2">
                  <div className="ml-4 border-2 border-gray-300 rounded-2xl p-4">
                    <div className="flex">
                      <div className="mr-4">Source:</div>
                      <div>
                        <div className="">
                          {`${mMSource.year} - ${mMSource.type.toLowerCase()} ${
                            mMSource?.createdAt
                              ? `[
                            created ${mMSource?.createdAt?.toLocaleString()} ]`
                              : ""
                          }
                          `}
                        </div>
                        {mMSource.title && (
                          <div className="">{mMSource.title}</div>
                        )}
                        {mMSource.link && (
                          <div className="break-all">
                            <a href={mMSource.link} target="_blank">
                              {mMSource.link}
                            </a>
                          </div>
                        )}
                        {mMSource.references &&
                          mMSource.references.length > 0 &&
                          mMSource.references.map((refItem) => (
                            <div key={refItem.value} className="break-all">
                              <b>{`${refItem.type}: `}</b>
                              {refItem.reference}
                            </div>
                          ))}
                      </div>
                    </div>
                    {mMSource.contributions.map((contribution) => (
                      <div key={contribution.id} className="flex">
                        <div className="mr-4">
                          {contribution.role.toLowerCase()}:
                        </div>
                        <div className="mr-4">
                          {contribution.person?.firstName
                            ? contribution.person?.firstName +
                              " " +
                              contribution.person?.lastName
                            : contribution.organization?.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })
      }
    </div>
  );
}
