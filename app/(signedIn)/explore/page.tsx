"use client";

import React, { useEffect, useState } from "react";
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

// zod schema for the search form
const searchFormSchema = z.object({
  startYear: zodYear,
  endYear: zodYear,
  tempoIndication: zodOption,
  composer: zodOption,
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
  const [isTempoIndicationsLoading, setIsTempoIndicationsLoading] =
    useState(true);
  const [composers, setComposers] = useState<PersonState[]>([]);
  const [isComposersLoading, setIsComposersLoading] = useState(true);

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

  const onSubmit = (data: SearchFormInput) => {
    console.log(`[onSubmit] data :`, data);
    fetch("/api/search", { method: "POST", body: JSON.stringify(data) })
      .then((res) => res.json())
      .then((data) => {
        console.log(`[onSubmit] data :`, data);
        // Handle successful response
      })
      .catch((error) => {
        console.error(`[onSubmit] error :`, error.message);
        // Handle error
      });
  };

  return (
    <div className="w-full max-w-md p-8">
      <h1 className="mb-4 text-4xl font-bold">{`Search for scores`}</h1>
      <form
        // className="flex flex-col items-center justify-center"
        onSubmit={handleSubmit(onSubmit)}
        onKeyDown={preventEnterKeySubmission}
      >
        <FormInput
          name="startYear"
          label="Start Date"
          type="number"
          isRequired
          {...{ control, errors, register, watch }}
        />
        <FormInput
          name="endYear"
          label="End Date"
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
    </div>
  );
}

export default SearchPage;
