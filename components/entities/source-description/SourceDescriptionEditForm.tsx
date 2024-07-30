"use client";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { SourceDescriptionInput } from "@/types/formTypes";
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

export default function SourceDescriptionEditForm(
  props: Readonly<{
    sourceDescription?: SourceDescriptionInput;
    onSubmit: (sourceDescription: SourceDescriptionInput) => Promise<void>;
    submitTitle?: string;
    title?: string;
  }>,
) {
  const { sourceDescription, onSubmit, submitTitle, title } = props;
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    watch,
    control,
    getValues,
    setError,
    clearErrors,
  } = useForm<SourceDescriptionInput>({
    defaultValues: sourceDescription ?? {
      type: {
        value: SOURCE_TYPE.EDITION,
        label: formatToPhraseCase(SOURCE_TYPE.EDITION),
      },
    },
    resolver: zodResolver(SourceSchema),
  });

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
        onSubmit={handleSubmit(onSubmit)}
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
          {...{ register, watch, errors }}
        />
        <FormInput name="title" {...{ register, watch, errors }} />
        <FormInput
          name="link"
          type="url"
          isRequired
          label="Link to the online score"
          {...{ register, watch, errors }}
        />
        <ReferenceArray
          {...{
            control,
            register,
            errors,
            watch,
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
          {...{ register, errors }}
        />
        <MMSourceFormStepNavigation
          isNextDisabled={isReferenceDirty}
          isSubmitBtn
          isSubmitting={isSubmitting}
          submitTitle={submitTitle}
        />
      </form>
    </div>
  );
}
