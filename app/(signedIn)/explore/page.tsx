"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import preventEnterKeySubmission from "@/utils/preventEnterKeySubmission";
import { FormInput } from "@/ui/form/FormInput";
import {
  PersonState,
  SearchFormInput,
  SearchFormState,
  TempoIndicationState,
} from "@/types/formTypes";
import getTempoIndicationSelectList from "@/utils/getTempoIndicationSelectList";
import ControlledSelect from "@/ui/form/ControlledSelect";
import getAllComposers from "@/utils/getAllComposers";
import getPersonName from "@/utils/getPersonName";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { zodOption, zodYear } from "@/types/zodTypes";
import Link from "next/link";
import TempoIndicationSearch from "@/features/explore/TempoIndicationSearch";
import { ChartDatum } from "@/types/chartTypes";
import getChartDataFromMMSources from "@/utils/getChartDataFromMMSources";
import AllBySourceList from "@/features/explore/AllBySourceList";

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
  tempoIndicationIds: z.array(z.string()).optional().default([]),
  composer: zodOption.optional().nullable(),
});

function SearchPage() {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SearchFormState, any, SearchFormInput>({
    resolver: zodResolver(searchFormSchema),
  });

  const [tempoIndications, setTempoIndications] = useState<
    TempoIndicationState[]
  >([]);
  const [lastSearch, setLastSearch] = useState<SearchFormInput>();
  const [composers, setComposers] = useState<PersonState[]>([]);
  const [mMSourceResults, setMMSourceResults] = useState<any[]>([]);
  const [chartData, setChartData] = useState<ChartDatum[]>([]);
  const [selectedTempoIndications, setSelectedTempoIndications] = useState<
    { id: string; text: string }[]
  >([]);

  const handleTempoIndicationSelect = (
    selected: { id: string; text: string }[],
  ) => {
    setSelectedTempoIndications(selected);
    setValue(
      "tempoIndicationIds",
      selected.map((ti) => ti.id),
    );
  };

  const handleDeselectAll = (e) => {
    e.preventDefault();
    setSelectedTempoIndications([]);
    setValue("tempoIndicationIds", []);
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
    console.log(`[onSubmit] data :`, data);
    const selectedTempoIndicationIds = selectedTempoIndications.map(
      (indication) => indication.id,
    );
    const requestData: SearchFormInput = {
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
        setMMSourceResults(res);
        setChartData(
          getChartDataFromMMSources({
            mMSources: res,
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

  const onInvalid = (errors: any) => {
    console.log(`[onInvalid] form errors :`, errors);
  };

  return (
    <div className="w-full p-8">
      <div className="flex gap-4">
        <h1 className="flex-1 mb-4 text-4xl font-bold">{`Search for scores`}</h1>
        <Link href="/explore/allBySource/30" className={`link link-primary`}>
          See latest data in the database
        </Link>
      </div>

      {Object.keys(errors).length > 0 && (
        <div className="alert alert-error mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 className="font-bold">Form Validation Error</h3>
            <div className="text-xs">
              Please check the fields marked in red.
              <ul className="list-disc pl-4 mt-1">
                {Object.entries(errors).map(([key, error]: [string, any]) => (
                  <li key={key}>
                    {key}: {error?.message || "Invalid value"}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <form
        className="flex"
        onSubmit={handleSubmit(onSubmit, onInvalid)}
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
                        const nextSelected = selectedTempoIndications.filter(
                          (ti) => ti.id !== tempoIndication.id,
                        );
                        setSelectedTempoIndications(nextSelected);
                        setValue(
                          "tempoIndicationIds",
                          nextSelected.map((ti) => ti.id),
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

      {lastSearch && (
        <div className="mt-8 border-t pt-8">
          <AllBySourceList
            mMSources={mMSourceResults}
            chartData={chartData}
            message={`Search results: ${mMSourceResults.length} source${mMSourceResults.length > 1 ? "s" : ""} found.`}
          />
        </div>
      )}
    </div>
  );
}

export default SearchPage;
