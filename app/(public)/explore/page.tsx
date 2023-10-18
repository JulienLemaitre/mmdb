import { Fragment } from "react";
// import { Inter } from 'next/font/google'
import { db } from "@/utils/db";
import getNotesPerSecondCollectionFromNotesPerBarCollectionAndMM from "@/utils/getNotesPerSecondCollectionFromNotesPerBarCollectionAndMM";

// const inter = Inter({ subsets: ['latin'] })

const getData = async () => {
  const persons = await db.person.findMany({
    include: {
      compositions: {
        include: {
          pieceVersions: {
            include: {
              movements: {
                include: {
                  sections: {
                    include: {
                      tempoIndication: true,
                      metronomeMarks: {
                        include: {
                          source: true,
                        },
                      },
                    },
                  },
                },
              },
              sources: {
                include: {
                  contributions: {
                    include: {
                      person: true,
                      organization: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
  return { persons };
};

export default async function Page() {
  const { persons } = await getData();

  return (
    <main className="p-8">
      {
        // Persons
        persons.map((person) => (
          <div key={person.id} className="my-16">
            <h1 className="text-3xl font-bold">{`${person.firstName} ${person.lastName}`}</h1>
            {
              // Pieces
              person.compositions.map((piece) => {
                // Piece versions
                const pieceVersion = piece.pieceVersions[0];
                const pieceSource = pieceVersion.sources[0];
                return (
                  <div
                    key={pieceVersion.id}
                    className="my-8 border-solid border-l-4 border-l-emerald-500 pl-2"
                  >
                    <h2 className="text-2xl font-bold">{piece.title}</h2>
                    <div className="flex mb-4">
                      {["yearOfComposition", "category"].map(
                        (key, index, array) => (
                          <Fragment key={key}>
                            <div className="mr-4">
                              {key}: {pieceVersion[key]}
                            </div>
                            {
                              // Add separator if not last item
                              index !== Object.keys(array).length - 1 && (
                                <div className="mr-4">|</div>
                              )
                            }
                          </Fragment>
                        ),
                      )}
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
                                  {movement.rank} -{" "}
                                  {movement.key
                                    .replaceAll("_FLAT", "b")
                                    .replaceAll("_SHARP", "#")
                                    .split("_")
                                    .map(
                                      (w) =>
                                        w.charAt(0) +
                                        w.substring(1).toLowerCase(),
                                    )
                                    .join(" ")}
                                </h3>
                                <div className="">
                                  {
                                    // sections
                                    movement.sections
                                      .sort((a, b) => a.rank - b.rank)
                                      .map(
                                        (
                                          section,
                                          sectionIndex,
                                          sectionList,
                                        ) => {
                                          const { isCommonTime, isCutTime } =
                                            section;
                                          const isCommonOrCutTime =
                                            isCommonTime || isCutTime;
                                          return (
                                            <div key={section.id}>
                                              <h4 className="text-lg my-1 italic">{`${
                                                sectionList.length > 1
                                                  ? `${section.rank} - `
                                                  : ""
                                              }${section.tempoIndication
                                                ?.text}`}</h4>
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
                                                    fastest structural note per
                                                    bar:{" "}
                                                    <b>
                                                      {
                                                        section.fastestStructuralNotesPerBar
                                                      }
                                                    </b>
                                                  </div>
                                                )}
                                                {section.fastestRepeatedNotesPerBar && (
                                                  <div className="">
                                                    fastest repeated note per
                                                    bar:{" "}
                                                    <b>
                                                      {
                                                        section.fastestRepeatedNotesPerBar
                                                      }
                                                    </b>
                                                  </div>
                                                )}
                                                {section.fastestStaccatoNotesPerBar && (
                                                  <div className="">
                                                    fastest staccato note per
                                                    bar:{" "}
                                                    <b>
                                                      {
                                                        section.fastestStaccatoNotesPerBar
                                                      }
                                                    </b>
                                                  </div>
                                                )}
                                                {section.fastestOrnamentalNotesPerBar && (
                                                  <div className="">
                                                    fastest ornamental note per
                                                    bar:{" "}
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
                                                section.metronomeMarks.map(
                                                  (mm) => {
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
                                                      console.log(
                                                        `[Home] notesPerSecondComputedFromNotesPerBar :`,
                                                        notesPerSecondCollectionComputedFromNotesPerBarCollection,
                                                      );
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
                                                        <div className="mr-4">{`${mm.beatUnit} = ${mm.bpm}`}</div>

                                                        {[
                                                          "fastestStructuralNotes",
                                                          "fastestStaccatoNotes",
                                                          "fastestOrnamentalNotes",
                                                          "fastestRepeatedNotes",
                                                        ].map(
                                                          (keyBase, index) => {
                                                            const originalNotesPerSecond =
                                                              mm
                                                                .notesPerSecond?.[
                                                                keyBase +
                                                                  "PerSecond"
                                                              ];
                                                            // const originalNotesPerSecond: any = mm.notesPerSecond
                                                            // const computedNotesPerSecond = notesPerSecondComputed?.[keyBase + 'PerSecond'] ? Math.round(notesPerSecondComputed[keyBase + 'PerSecond'] * 100) / 100 : null
                                                            // const isNotesPerSecondDiff = computedNotesPerSecond && Math.abs(mm.notesPerSecond?.[keyBase + 'PerSecond'] - computedNotesPerSecond) > 0.01

                                                            const computedNotesPerSecondFromNotesPerBar =
                                                              notesPerSecondCollectionComputedFromNotesPerBarCollection?.[
                                                                keyBase +
                                                                  "PerSecond"
                                                              ]
                                                                ? Math.round(
                                                                    notesPerSecondCollectionComputedFromNotesPerBarCollection[
                                                                      keyBase +
                                                                        "PerSecond"
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

                                                            if (
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
                                                            }

                                                            return (
                                                              <Fragment
                                                                key={mm.id}
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
                                                                        mm
                                                                          .notesPerSecond?.[
                                                                          keyBase +
                                                                            "PerSecond"
                                                                        ]
                                                                      }
                                                                    </span>
                                                                    (
                                                                    <span
                                                                      className={
                                                                        !mm
                                                                          .notesPerBar?.[
                                                                          keyBase +
                                                                            "PerBar"
                                                                        ]
                                                                          ? "text-red-500"
                                                                          : ""
                                                                      }
                                                                    >
                                                                      {mm
                                                                        .notesPerBar?.[
                                                                        keyBase +
                                                                          "PerBar"
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
                                                          },
                                                        )}
                                                      </div>
                                                    );
                                                  },
                                                )
                                              }
                                            </div>
                                          );
                                        },
                                      )
                                  }
                                </div>
                              </div>
                            ))
                        }
                      </div>
                      <div className="w-1/2">
                        <div className="ml-4 border-2 border-gray-300 rounded-2xl p-4">
                          <div className="flex">
                            <div className="mr-4">Source:</div>
                            <div>
                              <div className="text-gray-700">
                                {pieceSource.year} -{" "}
                                {pieceSource.type.toLowerCase()}
                              </div>
                              {pieceSource.title && (
                                <div className="text-gray-700">
                                  {pieceSource.title}
                                </div>
                              )}
                              {pieceSource.link && (
                                <div className="text-gray-700">
                                  <a href={pieceSource.link} target="_blank">
                                    {pieceSource.link}
                                  </a>
                                </div>
                              )}
                              {pieceSource.references && (
                                <div className="text-gray-700">
                                  {JSON.stringify(pieceSource.references)}
                                </div>
                              )}
                            </div>
                          </div>
                          {pieceSource.contributions.map((contribution) => (
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
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            }
          </div>
        ))
      }
    </main>
  );
}
