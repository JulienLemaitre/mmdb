"use client";
import { z } from "zod";
import { useForm } from "react-hook-form";
import {
  MMSourceDescriptionState,
  SourceDescriptionInput,
} from "@/types/formTypes";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormInput } from "@/components/ReactHookForm/FormInput";
import { getZodOptionFromEnum, zodYear } from "@/types/zodTypes";
import { REFERENCE_TYPE, SOURCE_TYPE } from "@prisma/client";
import ControlledSelect from "@/components/ReactHookForm/ControlledSelect";
import ReferenceArray from "@/components/ReactHookForm/ReferenceArray";
import MMSourceFormStepNavigation from "@/components/multiStepMMSourceForm/MMSourceFormStepNavigation";
import formatToPhraseCase from "@/utils/formatToPhraseCase";
import preventEnterKeySubmission from "@/utils/preventEnterKeySubmission";
import React, { useState } from "react";
import getMMSourceDescriptionInputFromState from "@/utils/getMMSourceDescriptionInputFromState";
import checkAreFieldsDirty from "@/utils/checkAreFieldsDirty";
import getIMSLPPermaLink from "@/utils/getIMSLPPermaLink";
import XMarkIcon from "@/components/svg/XMarkIcon";
import LoadingSpinIcon from "@/components/svg/LoadingSpinIcon";
import CheckIcon from "@/components/svg/CheckIcon";

const SourceSchema = z
  .object({
    title: z.string().optional(),
    type: getZodOptionFromEnum(SOURCE_TYPE),
    link: z.string().trim().url(),
    year: zodYear,
    references: z.array(
      z.object({
        type: getZodOptionFromEnum(REFERENCE_TYPE),
        reference: z.string().min(2),
      }),
    ),
    comment: z.string().optional(),
  })
  .superRefine(({ references }, ctx) => {
    // If we find two references with the same type.value and reference, we add an error
    const errors = references.reduce<any>((acc, reference, currentIndex) => {
      // Determine if the same ref exists in references
      const isDuplicate = references.some(
        (existingRef, refIndex) =>
          refIndex !== currentIndex &&
          existingRef.type.value === reference.type.value &&
          existingRef.reference === reference.reference,
      );
      if (isDuplicate) {
        acc.push({
          code: "custom",
          path: ["references", currentIndex, "reference"],
          message: "Duplicate reference",
        });
      }
      return acc;
    }, []);

    if (errors.length > 0) {
      errors.forEach((error) => ctx.addIssue(error));
    }
  });

const DEFAULT_VALUES: Partial<SourceDescriptionInput> = {
  type: {
    value: SOURCE_TYPE.EDITION,
    label: formatToPhraseCase(SOURCE_TYPE.EDITION),
  },
  year: undefined,
  title: "",
  link: "",
  comment: "",
  references: [],
};

export default function SourceDescriptionEditForm(
  props: Readonly<{
    sourceDescription?: SourceDescriptionInput;
    onSubmit: (
      data: SourceDescriptionInput,
      option: { goToNextStep: boolean },
    ) => Promise<MMSourceDescriptionState | undefined>;
    submitTitle?: string;
    title?: string;
  }>,
) {
  const { sourceDescription, onSubmit, submitTitle, title } = props;
  const {
    formState: { errors, isSubmitting, dirtyFields },
    handleSubmit,
    register,
    control,
    getValues,
    reset,
    trigger,
    clearErrors,
    setError,
  } = useForm<SourceDescriptionInput>({
    defaultValues: sourceDescription ?? DEFAULT_VALUES,
    resolver: zodResolver(SourceSchema),
  });

  const computedIsDirty = checkAreFieldsDirty(dirtyFields);

  const [isReferenceFormOpen, setIsReferenceFormOpen] = useState(false);

  const [isLinkDirty, setIsLinkDirty] = useState(false);
  const [isCheckingLink, setIsCheckingLink] = useState(false);
  const hasLinkValue = !!getValues("link");
  const onLinkInputChange = () => {
    setIsLinkDirty(true);
    clearErrors(`link`);
  };
  const onLinkBlur = async () => {
    setIsCheckingLink(true);
    console.log(`[SourceDescriptionEditForm] onLinkBlur`);
    const link = getValues(`link`);

    if (!link) {
      console.warn(`[] link value is needed to fetch existing link`);
      setIsCheckingLink(false);
      return;
    }

    // Validate URL using Zod
    const urlSchema = z.string().trim().url();
    const urlResult = urlSchema.safeParse(link);

    if (!urlResult.success) {
      setError(`link`, {
        type: "manual",
        message: "Please enter a valid URL",
      });
      setIsCheckingLink(false);
      return;
    }

    // If URL is valid, proceed with checking if it exists in the database
    const existingLink = await fetch(
      `/api/permalink/get?url=${getIMSLPPermaLink(link)}`,
    ).then((response) => response.json());
    if (existingLink) {
      setError(`link`, {
        type: "manual",
        message: "This link is already in the database",
      });
    } else {
      setIsLinkDirty(false);
    }
    setIsCheckingLink(false);
  };

  const onResetForm = () => {
    reset(sourceDescription ?? DEFAULT_VALUES);
  };

  const submitForm = async (option: { goToNextStep: boolean }) => {
    // Trigger validations before submitting
    const isValid = await trigger();
    console.log(`[submitForm] isValid :`, isValid);

    if (!isValid) {
      console.log(`[] getValues :`, getValues());
      console.log(`[] errors :`, errors);
    }

    if (isValid) {
      console.log(`[submitForm] submitForm after validation successful`);
      await handleSubmit(async (data) => {
        const newSourceDescriptionState = await onSubmit(data, option);
        console.log(
          `[submitForm] newSourceDescriptionState :`,
          newSourceDescriptionState,
        );
        if (!option.goToNextStep && newSourceDescriptionState) {
          const newSourceDescriptionInput =
            getMMSourceDescriptionInputFromState(newSourceDescriptionState);
          reset(newSourceDescriptionInput);
        }
      })();
    }
  };

  return (
    <div>
      <h1 className="mb-4 text-4xl font-bold">
        {title ?? (
          <>
            Metronome Mark Source
            <span className="block text-xl font-normal">
              General description
            </span>
          </>
        )}
      </h1>
      <form
        onSubmit={() => {
          console.warn(`[react-hook-form] form onSubmit - SHOULD NOT HAPPEN`);
          // Form is submitted programmatically
        }}
        onKeyDown={preventEnterKeySubmission}
        className="max-w-md"
      >
        <ControlledSelect
          name="type"
          label="Source type"
          id="type"
          control={control}
          options={Object.values(SOURCE_TYPE).map((category) => ({
            value: category,
            label: formatToPhraseCase(category),
          }))}
          isRequired={true}
          errors={errors}
        />
        <FormInput
          name="year"
          isRequired
          label="Year of publication"
          inputMode="numeric"
          {...{ register, errors, control }}
        />
        <FormInput
          name="title"
          label="Title of the source"
          {...{ register, errors, control }}
        />
        <div className="flex items-end gap-2">
          <FormInput
            name="link"
            type="url"
            isRequired
            label="Link to the online score"
            controlClassName="flex-none"
            onBlur={onLinkBlur}
            onInputChange={onLinkInputChange}
            {...{ register, errors, control }}
          />
          <div
            className={`badge badge-outline py-3.5 gap-1 ${!hasLinkValue ? "badge-disabled" : isLinkDirty ? (isCheckingLink ? "badge-neutral" : "badge-warning") : "badge-success"}`}
            onClick={(e) => e.preventDefault()}
          >
            {!hasLinkValue ? (
              <>
                <XMarkIcon className="w-7 h-7" />
                Unchecked
              </>
            ) : isLinkDirty ? (
              isCheckingLink ? (
                <>
                  <LoadingSpinIcon className="w-7 h-7" />
                  checking
                </>
              ) : (
                <>
                  <XMarkIcon className="w-7 h-7" />
                  Unchecked
                </>
              )
            ) : (
              <>
                <CheckIcon className="w-7 h-7" />
                checked
              </>
            )}
          </div>
        </div>
        <ReferenceArray
          control={control}
          currentReferences={getValues(`references`) || []}
          isReferenceFormOpen={isReferenceFormOpen}
          onReferenceFormOpen={() => setIsReferenceFormOpen(true)}
          onReferenceFormClose={() => setIsReferenceFormOpen(false)}
        />
        <FormInput
          name="comment"
          label={`Comment`}
          defaultValue={``}
          {...{ register, errors, control }}
        />
        <MMSourceFormStepNavigation
          onSave={() => submitForm({ goToNextStep: false })}
          onSaveAndGoToNextStep={() => submitForm({ goToNextStep: true })}
          onResetForm={onResetForm}
          isPresentFormDirty={computedIsDirty}
          isNextDisabled={isReferenceFormOpen || (hasLinkValue && isLinkDirty)}
          isSubmitting={isSubmitting || isReferenceFormOpen}
          submitTitle={submitTitle}
          dirtyFields={dirtyFields}
        />
      </form>
    </div>
  );
}
