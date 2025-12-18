"use client";

import React, { Fragment, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import preventEnterKeySubmission from "@/utils/preventEnterKeySubmission";
import { FormInput } from "@/ui/form/FormInput";
import {
  PersonState,
  SearchFormInput,
  TempoIndicationState,
} from "@/types/formTypes";
import getTempoIndicationSelectList from "@/utils/getTempoIndicationSelectList";
import ControlledSelect from "@/ui/form/ControlledSelect";
import getAllComposers from "@/utils/getAllComposers";
import getPersonName from "@/utils/getPersonName";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { zodOption, zodYear } from "@/types/zodTypes";
import getKeyLabel from "@/utils/getKeyLabel";
import getNotesPerSecondCollectionFromNotesPerBarCollectionAndMM from "@/utils/getNotesPerSecondCollectionFromNotesPerBarCollectionAndMM";
import getIMSLPPermaLink from "@/utils/getIMSLPPermaLink";
import ShartWithNoteTypeFilter from "@/features/explore/ShartWithNoteTypeFilter";
import Link from "next/link";
import TempoIndicationSearch from "@/features/explore/TempoIndicationSearch";
import { ChartDatum } from "@/types/chartTypes";
import GetChartDataFromPieceVersions from "@/utils/getChartDataFromPieceVersions";
import getSourceTypeLabel from "@/utils/getSourceTypeLabel";
import getNoteValueLabel from "@/utils/getNoteValueLabel";
import SectionMeter from "@/features/section/ui/SectionMeter";

// TODO: What do we want in addition to what is already there:
//  1. Show all mms that result in speeds of more / less than X notes per second with a selection of note type (strutural, repeated etc.) e.g. show me all Sources that have MMs that result in more than 15 nps (structural)
//  2. Selection by source contribution and role (e.g. give me all MMs for which Czerny has been the MM provider)
//  3. Select for piece / collection give me all MMs for Beethoven's Sonata Op. 10 No. 1
//  4. Select for Category of piece e.g. show me all MMs for vocal pieces
//  5. Key Signature, metre

// zod schema for the search form
const searchFormSchema = z.object({
  startYear: zodYear,
  endYear: zodYear,
  tempoIndicationIds: z.array(z.string()),
  composer: zodOption,
});

function SearchPage() {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(searchFormSchema),
    // defaultValues: {
    //   startYear: 1800,
    //   endYear: 1850,
    //   tempoIndicationIds: undefined,
    // },
  });

  const [tempoIndications, setTempoIndications] = useState<
    TempoIndicationState[]
  >([]);
  const [lastSearch, setLastSearch] = useState<SearchFormInput>();
  const [composers, setComposers] = useState<PersonState[]>([]);
  const [pieceVersionResults, setPieceVersionResults] = useState<any[]>([]);
  const [chartData, setChartData] = useState<ChartDatum[]>([]);
  const [selectedTempoIndications, setSelectedTempoIndications] = useState<
    { id: string; text: string }[]
  >([]);

  const handleTempoIndicationSelect = (
    selected: { id: string; text: string }[],
  ) => {
    setSelectedTempoIndications(selected);
  };

  const handleDeselectAll = (e) => {
    e.preventDefault();
    setSelectedTempoIndications([]);
  };

  // Fetch tempoIndicationSelectList from API
  useEffect(() => {
    getTempoIndicationSelectList()
      .then((data) => {
        setTempoIndications(data);
      })
      .catch((err) => {
        console.log(`[getTempoIndicationSelectList] err :`, err);
      });
  }, []);

  // Fetch composersSelectList from API
  useEffect(() => {
    getAllComposers()
      .then((data) => {
        setComposers(data?.composers);
      })
      .catch((err) => {
        console.log(`[getAllComposers] err :`, err);
      });
  }, []);

  const onSubmit = async (data: SearchFormInput) => {
    const selectedTempoIndicationIds = selectedTempoIndications.map(
      (indication) => indication.id,
    );
    const requestData = {
      ...data,
      tempoIndicationIds: selectedTempoIndicationIds,
    };
    setLastSearch(requestData);
    const searchVariables = {
      method: "POST",
      body: JSON.stringify(requestData),
    };
    console.log(`[onSubmit api/search] searchVariables :`, searchVariables);
    await fetch("/api/search", searchVariables)
      .then((res) => res.json())
      .then((res) => {
        console.log(`[onSubmit api/search] res :`, res);
        setPieceVersionResults(res);
        setChartData(
          GetChartDataFromPieceVersions({
            pieceVersions: res,
            sectionFilterFn: (section: any) =>
              selectedTempoIndications.length === 0 ||
              selectedTempoIndications.some(
                (tempoIndication) =>
                  tempoIndication.id === section?.tempoIndication?.id,
              ),
          }),
        );
      })
      .catch((error) => {
        console.error(`[onSubmit api/search] error :`, error.message);
      });
  };

  return (
    <div className="w-full p-8">
      <div className="flex gap-4">
        <h1 className="flex-1 mb-4 text-4xl font-bold">{`Search for scores`}</h1>
        <Link href="/explore/allBySource/30" className={`link link-primary`}>
          See latest data in the database
        </Link>
      </div>
      <form
        className="flex"
        onSubmit={handleSubmit(onSubmit)}
        onKeyDown={preventEnterKeySubmission}
      >
        <div className="w-1/3">
          <FormInput
            name="startYear"
            label="Start Date of composition"
            inputMode="numeric"
            isRequired
            {...{ control, errors, register }}
          />
          <FormInput
            name="endYear"
            label="End Date of composition"
            inputMode="numeric"
            isRequired
            {...{ control, errors, register }}
          />
          <ControlledSelect
            name={`composer` as const}
            label={`Composer`}
            id={`composer` as const}
            control={control}
            options={composers.map((composer) => ({
              value: composer.id,
              label: getPersonName(composer),
            }))}
            isRequired={false}
            fieldError={errors?.composer}
          />
          <button
            className="btn btn-primary mt-6 w-full max-w-xs"
            type="submit"
            disabled={isSubmitting}
          >
            Submit
            {isSubmitting && (
              <span className="loading loading-spinner loading-md"></span>
            )}
          </button>
        </div>
        <div className="w-2/3">
          <TempoIndicationSearch
            tempoIndications={tempoIndications}
            selectedTempoIndications={selectedTempoIndications}
            onSelect={handleTempoIndicationSelect}
          />
          {selectedTempoIndications.length > 0 ? (
            <div className="w-full border-t-2 border-gray-300 dark:border-gray-900 dark:text-gray-300 py-1 mt-2">
              <div className="flex items-center gap-4 my-1">
                <label className="text-sm text-gray-600 dark:text-gray-400">
                  {`Currently selected tempo indications :`}
                </label>
                <button
                  onClick={handleDeselectAll}
                  className="btn btn-accent btn-xs"
                >
                  Deselect All
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {selectedTempoIndications.map((tempoIndication) => (
                  <div
                    key={tempoIndication.id}
                    className="flex items-center badge badge-neutral pr-0"
                  >
                    <span>{tempoIndication.text}</span>
                    <button
                      className="btn btn-circle btn-ghost h-[1.2rem] min-h-[1.2rem] w-[1.2rem] min-w-[1.2rem] ml-2"
                      onClick={() => {
                        setSelectedTempoIndications((cur) =>
                          cur.filter((ti) => ti.id !== tempoIndication.id),
                        );
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </form>

      {lastSearch ? <ShartWithNoteTypeFilter chartData={chartData} /> : null}

      <div>
        {pieceVersionResults.length > 0 && (
          <div>
            <h2 className="mb-4 text-2xl font-bold">Search Results:</h2>
            <ul>
              {pieceVersionResults.map((pieceVersion) => {
                const piece = pieceVersion.piece;
                const composer = piece.composer;
                const mMSource = pieceVersion.mMSources[0].mMSource;
                const scoreLink = getIMSLPPermaLink(mMSource.link);

                return (
                  <li
                    key={pieceVersion.id}
                    className="my-8 border-solid border-l-4 border-l-emerald-500 pl-2 flex"
                  >
                    <div className="w-1/2">
                      <div>{`${composer.firstName} ${composer.lastName}`}</div>
                      <h2 className="text-2xl font-bold">{piece.title}</h2>
                      <div className="flex mb-4">
                        <div className="mr-4">
                          yearOfComposition: {piece.yearOfComposition}
                        </div>
                        <div className="mr-4">|</div>
                        <div className="mr-4">
                          category: {pieceVersion?.category}
                        </div>
                      </div>
                      <div className="flex mb-4">
                        <div>
                          {
                            // Movements
                            pieceVersion.movements
                              .filter(
                                (mvt: any) =>
                                  selectedTempoIndications.length === 0 ||
                                  mvt.sections.some((section) =>
                                    selectedTempoIndications.some(
                                      (tempoIndication) =>
                                        tempoIndication.id ===
                                        section?.tempoIndication?.id,
                                    ),
                                  ),
                              )
                              .sort((a, b) => a.rank - b.rank)
                              .map((movement, movementIndex: number) => (
                                <div key={movement.id} className="flex">
                                  <h3 className="text-xl my-1 flex-none pr-4">
                                    {movement.rank} -{" "}
                                    {getKeyLabel(movement.key)}
                                  </h3>
                                  <div className="">
                                    {
                                      // sections
                                      movement.sections
                                        .filter(
                                          (section: any) =>
                                            selectedTempoIndications.length ===
                                              0 ||
                                            selectedTempoIndications.some(
                                              (tempoIndication) =>
                                                tempoIndication.id ===
                                                section?.tempoIndication?.id,
                                            ),
                                        )
                                        .sort((a, b) => a.rank - b.rank)
                                        .map(
                                          (
                                            section,
                                            sectionIndex,
                                            sectionList,
                                          ) => {
                                            return (
                                              <div key={section.id}>
                                                <h4 className="text-lg my-1 italic">{`${
                                                  sectionList.length > 1
                                                    ? `${section.rank} - `
                                                    : ""
                                                }${section.tempoIndication?.text}`}</h4>
                                                <div className="border-b-2 border-gray-200">
                                                  <div className="">
                                                    Metre :{" "}
                                                    <SectionMeter
                                                      section={section}
                                                    />
                                                  </div>
                                                  {section.fastestStructuralNotesPerBar && (
                                                    <div className="">
                                                      fastest structural note
                                                      per bar:{" "}
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
                                                      fastest ornamental note
                                                      per bar:{" "}
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
                                                      } catch (e: any) {
                                                        console.log(
                                                          `--------------------------------------------------`,
                                                        );
                                                        console.log(
                                                          `[getNotesPerSecondCollectionFromNotesPerBarCollectionAndMM ERROR] mm :`,
                                                          e?.message,
                                                        );
                                                        console.log(
                                                          `[] ${composer.firstName} ${composer.lastName}: ${piece.title} - mvt#${movement.rank} - section#${section.rank}`,
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
                                                          ].map(
                                                            (
                                                              keyBase,
                                                              index: number,
                                                            ) => {
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
                                                              const hasDataInconsistency = false;
                                                              // (originalNotesPerSecond &&
                                                              //   !computedNotesPerSecondFromNotesPerBar) ||
                                                              // (!originalNotesPerSecond &&
                                                              //   computedNotesPerSecondFromNotesPerBar);

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
                                                                  key={
                                                                    mm.id +
                                                                    keyBase
                                                                  }
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
                      </div>
                    </div>
                    <div className="w-1/2">
                      {mMSource ? (
                        <div className="ml-4 border-2 border-gray-300 rounded-2xl p-4">
                          <div className="flex">
                            <div className="mr-4">Source:</div>
                            <div>
                              <div className="">
                                {mMSource.year} -{" "}
                                {getSourceTypeLabel(mMSource.type)}
                              </div>
                              {mMSource.title && (
                                <div className="">{mMSource.title}</div>
                              )}
                              {scoreLink && (
                                <div className=" break-all">
                                  <a
                                    className="link link-primary"
                                    href={scoreLink}
                                    target="_blank"
                                  >
                                    {"Online score link"}
                                  </a>
                                </div>
                              )}
                              {mMSource.references &&
                                mMSource.references.length > 0 && (
                                  <div className="break-all">
                                    {JSON.stringify(mMSource.references)}
                                  </div>
                                )}
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
                                    contribution.person?.lastName
                                  : contribution.organization?.name}
                              </div>
                            </div>
                          ))}
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
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchPage;
