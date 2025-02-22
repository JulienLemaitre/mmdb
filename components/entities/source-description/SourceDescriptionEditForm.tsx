"use client";
import { z } from "zod";
import { useForm } from "react-hook-form";
import {
  MMSourceDescriptionState,
  SourceDescriptionInput,
} from "@/types/formTypes";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormInput } from "@/components/ReactHookForm/FormInput";
import { zodYear } from "@/utils/zodTypes";
import { REFERENCE_TYPE, SOURCE_TYPE } from "@prisma/client";
import ControlledSelect from "@/components/ReactHookForm/ControlledSelect";
import ReferenceArray from "@/components/ReactHookForm/ReferenceArray";
import MMSourceFormStepNavigation from "@/components/multiStepMMSourceForm/MMSourceFormStepNavigation";
import formatToPhraseCase from "@/utils/formatToPhraseCase";
import preventEnterKeySubmission from "@/utils/preventEnterKeySubmission";
import { useState } from "react";
import getMMSourceDescriptionInputFromState from "@/utils/getMMSourceDescriptionInputFromState";
import checkAreFieldsDirty from "@/utils/checkAreFieldsDirty";

const SourceSchema = z.object({
  title: z.string().optional(),
  type: z.object({
    value: z.nativeEnum(SOURCE_TYPE),
    label: z.string(),
  }),
  link: z.string().trim().url(),
  year: zodYear,
  references: z.array(
    z.object({
      type: z.object({
        value: z.nativeEnum(REFERENCE_TYPE),
        label: z.string(),
      }),
      reference: z.string().min(2),
    }),
  ),
  comment: z.string().optional(),
});

const DEFAULT_VALUES = {
  type: {
    value: SOURCE_TYPE.EDITION,
    label: formatToPhraseCase(SOURCE_TYPE.EDITION),
  },
  // type: undefined,
  year: "",
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
    formState: { errors, isSubmitting, isDirty, dirtyFields },
    handleSubmit,
    register,
    control,
    getValues,
    setError,
    clearErrors,
    reset,
    trigger,
  } = useForm<SourceDescriptionInput>({
    defaultValues: sourceDescription ?? DEFAULT_VALUES,
    resolver: zodResolver(SourceSchema),
  });

  console.group(`MMSourceDescriptionEditForm`);
  console.log(`[] isDirty :`, isDirty);
  console.log(`[] dirtyFields :`, dirtyFields);
  const computedIsDirty = checkAreFieldsDirty(dirtyFields);
  // const computedIsDirty = Object.keys(dirtyFields).length > 0;
  console.log(`[] computedIsDirty :`, computedIsDirty);
  console.log(`[] errors :`, errors);
  console.groupEnd();

  const [isReferenceDirty, setIsReferenceDirty] = useState(false);
  const [isCheckingReference, setIsCheckingReference] = useState(false);
  const onReferenceInputChange = (index: number) => {
    setIsReferenceDirty(true);
    clearErrors(`references.${index}.reference`);
  };
  const onReferenceBlur = async (index: number) => {
    setIsCheckingReference(true);
    console.log(`[SourceDescriptionEditForm] onReferenceBlur`, index);
    const references = getValues(`references`) || [];
    const { reference, type } = references[index] || {};
    if (!reference || !type?.value) {
      console.log(
        `[] reference and type value are needed to fetch existing reference`,
      );
      setIsCheckingReference(false);
      return;
    }
    // Check if the reference is already in the database
    const existingReference = await fetch(
      `/api/reference/get?type=${type.value}&reference=${reference}`,
    ).then((response) => response.json());
    if (existingReference) {
      setError(`references.${index}.reference`, {
        type: "manual",
        message: "This reference is already in the database",
      });
    } else {
      setIsReferenceDirty(false);
    }
    setIsCheckingReference(false);
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
        <FormInput
          name="link"
          type="url"
          isRequired
          label="Link to the online score"
          {...{ register, errors, control }}
        />
        <ReferenceArray
          {...{
            control,
            register,
            errors,
            onReferenceBlur,
            onReferenceInputChange,
            isCheckingReference,
            isReferenceDirty,
          }}
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
          isNextDisabled={isReferenceDirty}
          isSubmitting={isSubmitting}
          submitTitle={submitTitle}
          dirtyFields={dirtyFields}
        />
      </form>
    </div>
  );
}
