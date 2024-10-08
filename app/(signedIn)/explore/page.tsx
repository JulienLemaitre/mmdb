"use client";

import React, { Fragment, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import preventEnterKeySubmission from "@/utils/preventEnterKeySubmission";
import { FormInput } from "@/components/ReactHookForm/FormInput";
import {
  PersonState,
  SearchFormInput,
  TempoIndicationState,
} from "@/types/formTypes";
import getTempoIndicationSelectList from "@/utils/getTempoIndicationSelectList";
import ControlledSelect from "@/components/ReactHookForm/ControlledSelect";
import getAllComposers from "@/utils/getAllComposers";
import getPersonName from "@/components/entities/person/utils/getPersonName";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { zodOption, zodYear } from "@/utils/zodTypes";
import getKeyLabel from "@/utils/getKeyLabel";
import getNotesPerSecondCollectionFromNotesPerBarCollectionAndMM from "@/utils/getNotesPerSecondCollectionFromNotesPerBarCollectionAndMM";
import getIMSLPPermaLink from "@/utils/getIMSLPPermaLink";
import GlobalShart from "@/components/GlobalShart";
import Link from "next/link";

// zod schema for the search form
const searchFormSchema = z.object({
  startYear: zodYear,
  endYear: zodYear,
  tempoIndication: zodOption.optional(),
  composer: zodOption.optional(),
});

function SearchPage() {
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SearchFormInput>({
    resolver: zodResolver(searchFormSchema),
  });

  const [tempoIndications, setTempoIndications] = useState<
    TempoIndicationState[]
  >([]);
  const [lastSearch, setLastSearch] = useState<SearchFormInput>();
  const [isPieceVersionExtended, setIsPieceVersionExtended] =
    useState<boolean>(false);
  const [isTempoIndicationsLoading, setIsTempoIndicationsLoading] =
    useState(true);
  const [composers, setComposers] = useState<PersonState[]>([]);
  const [isComposersLoading, setIsComposersLoading] = useState(true);
  const [pieceVersionResults, setPieceVersionResults] = useState<any[]>([]);
  console.log(`[] pieceVersionResults :`, pieceVersionResults);

  const tempoIndicationId = lastSearch?.tempoIndication?.value;

  // Fetch tempoIndicationSelectList from API
  useEffect(() => {
    getTempoIndicationSelectList()
      .then((data) => {
        setTempoIndications(data);
        setIsTempoIndicationsLoading(false);
      })
      .catch((err) => {
        console.log(`[getTempoIndicationSelectList] err :`, err);
        setIsTempoIndicationsLoading(false);
      });
  }, []);

  // Fetch composersSelectList from API
  useEffect(() => {
    getAllComposers()
      .then((data) => {
        setComposers(data?.composers);
        setIsComposersLoading(false);
      })
      .catch((err) => {
        console.log(`[getAllComposers] err :`, err);
        setIsComposersLoading(false);
      });
  }, []);

  const onSubmit = async (data: SearchFormInput) => {
    console.log(`[onSubmit] data :`, data);
    setLastSearch(data);
    await fetch("/api/search", { method: "POST", body: JSON.stringify(data) })
      .then((res) => res.json())
      .then((res) => {
        console.log(`[onSubmit] res :`, res);
        setPieceVersionResults(res);
      })
      .catch((error) => {
        console.error(`[onSubmit] error :`, error.message);
        // Handle error
      });
  };

  return (
    <div className="w-full p-8">
      <div className="flex">
        <h1 className="flex-1 mb-4 text-4xl font-bold">{`Search for scores`}</h1>
        <Link href="/explore/allByComposer" className={`link link-primary`}>
          See all data per composer
        </Link>
        {/*<Link href="/explore/allBySource" className={`link link-primary`}>
          See all data per source
        </Link>*/}
      </div>
      <div className="flex">
        <form
          className="w-1/2"
          onSubmit={handleSubmit(onSubmit)}
          onKeyDown={preventEnterKeySubmission}
        >
          <FormInput
            name="startYear"
            label="Start Date of composition"
            type="number"
            isRequired
            {...{ control, errors, register, watch }}
          />
          <FormInput
            name="endYear"
            label="End Date of composition"
            type="number"
            isRequired
            {...{ control, errors, register, watch }}
          />
          <ControlledSelect
            name={`tempoIndication` as const}
            label={`Tempo Indication`}
            id={`tempoIndication` as const}
            control={control}
            options={tempoIndications.map((tempoIndication) => ({
              value: tempoIndication.id,
              label: tempoIndication.text,
            }))}
            isRequired={false}
            errors={errors}
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
            errors={errors}
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
        </form>
        <div className="w-1/2">
          <h2>Last search</h2>
          <pre>
            {JSON.stringify(lastSearch, null, 2) || "no search history"}
          </pre>
        </div>
      </div>

      {lastSearch ? (
        <div className="w-full h-[800px] text-slate-900 dark:text-white">
          <GlobalShart
            pieceVersions={pieceVersionResults}
            filter={{ tempoIndicationId }}
          />
        </div>
      ) : null}

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
                    className="my-8 border-solid border-l-4 border-l-emerald-500 pl-2"
                  >
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
                                              }${section.tempoIndication?.text}`}</h4>
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
                      <div className="w-1/2">
                        {mMSource ? (
                          <div className="ml-4 border-2 border-gray-300 rounded-2xl p-4">
                            <div className="flex">
                              <div className="mr-4">Source:</div>
                              <div>
                                <div className="">
                                  {mMSource.year} -{" "}
                                  {mMSource.type.toLowerCase()}
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
