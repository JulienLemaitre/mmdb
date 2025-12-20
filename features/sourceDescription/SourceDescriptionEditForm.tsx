"use client";
import { z } from "zod";
import { useForm } from "react-hook-form";
import {
  MMSourceDescriptionState,
  SourceDescriptionInput,
} from "@/types/formTypes";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormInput } from "@/ui/form/FormInput";
import { getZodOptionFromEnum, zodYear } from "@/types/zodTypes";
import { REFERENCE_TYPE, SOURCE_TYPE } from "@/prisma/client/enums";
import ControlledSelect from "@/ui/form/ControlledSelect";
import ReferenceArray from "@/features/reference/form/ReferenceArray";
import MMSourceFormStepNavigation from "@/features/feed/multiStepMMSourceForm/MMSourceFormStepNavigation";
import formatToPhraseCase from "@/utils/formatToPhraseCase";
import preventEnterKeySubmission from "@/utils/preventEnterKeySubmission";
import React, { useState } from "react";
import getMMSourceDescriptionInputFromState from "@/utils/getMMSourceDescriptionInputFromState";
import checkAreFieldsDirty from "@/utils/checkAreFieldsDirty";
import getIMSLPPermaLink from "@/utils/getIMSLPPermaLink";
import XMarkIcon from "@/ui/svg/XMarkIcon";
import CheckIcon from "@/ui/svg/CheckIcon";
import getSourceTypeLabel from "@/utils/getSourceTypeLabel";

const SourceSchema = z
  .object({
    title: z.string().optional(),
    type: getZodOptionFromEnum(SOURCE_TYPE),
    link: z.string().trim().url(),
    year: zodYear,
    isYearEstimated: z.boolean(),
    references: z.array(
      z.object({
        type: getZodOptionFromEnum(REFERENCE_TYPE),
        reference: z.string().min(2),
      }),
    ),
    comment: z.string().optional(),
  })
  .superRefine(({ references }, ctx) => {
    references.forEach((reference, currentIndex) => {
      const isDuplicate = references.some(
        (existingRef, refIndex) =>
          refIndex !== currentIndex &&
          existingRef.type.value === reference.type.value &&
          existingRef.reference === reference.reference,
      );
      if (isDuplicate) {
        ctx.addIssue({
          code: "custom",
          message: "Duplicate reference",
          path: ["references", currentIndex, "reference"],
        });
      }
    });
  });

const DEFAULT_VALUES: Partial<SourceDescriptionInput> = {
  type: {
    value: SOURCE_TYPE.EDITION,
    label: getSourceTypeLabel(SOURCE_TYPE.EDITION),
  },
  year: undefined,
  isYearEstimated: false,
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
    resolver: zodResolver(SourceSchema) as any, // Type assertion to bypass strict overload matching
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
    if (!isLinkDirty) return;

    setIsCheckingLink(true);
    const link = getValues(`link`);

    if (!link) {
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

    if (!isValid) {
      console.log(`[] getValues :`, getValues());
      console.log(`[] errors :`, errors);
    }

    if (isValid) {
      await handleSubmit(async (data) => {
        const newSourceDescriptionState = await onSubmit(data, option);
        if (!option.goToNextStep && newSourceDescriptionState) {
          const newSourceDescriptionInput =
            getMMSourceDescriptionInputFromState(newSourceDescriptionState);
          reset(newSourceDescriptionInput);
        }
      })();
    }
  };

  return (
    <>
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
          fieldError={errors.type}
        />
        <div className="flex gap-4 items-center">
          <FormInput
            name="year"
            isRequired
            label="Year of publication"
            inputMode="numeric"
            {...{ register, errors, control }}
          />
          <FormInput
            name="isYearEstimated"
            type="checkbox"
            label="Is year estimated?"
            {...{ register, errors, control }}
          />
        </div>
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
            className={`badge badge-outline py-3.5 gap-1 ${!hasLinkValue ? "badge-neutral" : isLinkDirty ? (isCheckingLink ? "badge-disabled" : "badge-warning") : "badge-success"} cursor-${isLinkDirty ? "pointer" : "auto"}`}
            onClick={(e) => {
              e.preventDefault();
              onLinkBlur();
            }}
          >
            {!hasLinkValue ? (
              <>
                <XMarkIcon className="w-7 h-7" />
                Unchecked
              </>
            ) : isLinkDirty ? (
              isCheckingLink ? (
                <>
                  <span className="loading loading-infinity w-7"></span>
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
    </>
  );
}
