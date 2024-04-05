"use client";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { SourceDescriptionInput } from "@/types/editFormTypes";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormInput } from "@/components/ReactHookForm/FormInput";
import { zodYear } from "@/utils/zodTypes";
import { SOURCE_TYPE } from "@prisma/client";
import ControlledSelect from "@/components/ReactHookForm/ControlledSelect";
import ReferenceArray from "@/components/ReactHookForm/ReferenceArray";
import StepNavigation from "@/components/multiStepForm/StepNavigation";

const SourceSchema = z.object({
  title: z.string().optional(),
  type: z.object({
    value: z.string(),
    label: z.string(),
  }),
  link: z.string().trim().url(),
  year: zodYear,
  references: z.array(
    z.object({
      type: z.object({
        value: z.string(),
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
  } = useForm<SourceDescriptionInput>({
    defaultValues: sourceDescription ?? {
      type: {
        value: SOURCE_TYPE.EDITION,
        label: SOURCE_TYPE.EDITION,
      },
    },
    resolver: zodResolver(SourceSchema),
  });

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
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-md">
        <ControlledSelect
          name="type"
          label="Source type"
          id="type"
          control={control}
          options={Object.values(SOURCE_TYPE).map((category) => ({
            value: category,
            label: category,
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
        <ReferenceArray {...{ control, register, errors, watch }} />
        <FormInput
          name="comment"
          label={`Comment`}
          defaultValue={``}
          {...{ register, errors }}
        />
        <StepNavigation
          isSubmitBtn
          isSubmitting={isSubmitting}
          submitTitle={submitTitle}
        />
      </form>
    </div>
  );
}
