"use client";
import { z } from "zod";
import { useRouter } from "next/navigation";
import {
  updateEditForm,
  useEditForm,
} from "@/components/context/editFormContext";
import { useForm } from "react-hook-form";
import { SourceDescriptionInput } from "@/types/editFormTypes";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CREATE_SOURCE_CONTRIBUTIONS_URL,
  SELECT_PIECE_VERSION_URL,
} from "@/utils/routes";
import Link from "next/link";
import { FormInput } from "@/components/ReactHookForm/FormInput";
import { zodYear } from "@/utils/zodTypes";
import { SOURCE_TYPE } from "@prisma/client";
import ControlledSelect from "@/components/ReactHookForm/ControlledSelect";
import ReferenceArray from "@/components/ReactHookForm/ReferenceArray";
import getSourceDescriptionStateFromInput from "@/utils/getSourceDescriptionStateFromInput";

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

export default function SourceDescriptionEditForm({
  sourceDescription,
}: Readonly<{
  sourceDescription?: SourceDescriptionInput;
}>) {
  const router = useRouter();
  const { dispatch, state } = useEditForm();
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

  const onSubmit = async (data: SourceDescriptionInput) => {
    // Front input values validation is successful at this point.
    console.log("data", data);

    const sourceData = data;
    // Remove null values from sourceData
    Object.keys(sourceData).forEach(
      (key) => sourceData[key] == null && delete sourceData[key],
    );

    if (!state.pieceVersion) {
      console.warn("No pieceVersion in state to link to the source");
      return;
    }

    //TODO: for Source Description, Contributions and Metronome Marks, we will keep the data in state only and send to API once the user has completed all of them.

    const sourceDescriptionState = getSourceDescriptionStateFromInput({
      ...sourceData,
      // pieceVersions: [state.pieceVersion.id],
    });

    sourceDescriptionState.isNew = true;
    console.log(
      "source description to be stored in state",
      sourceDescriptionState,
    );
    updateEditForm(dispatch, "sourceDescription", sourceDescriptionState);
    router.push(CREATE_SOURCE_CONTRIBUTIONS_URL);
  };

  if (!state.pieceVersion) {
    return (
      <div>
        <h1 className="mb-4 text-4xl font-bold">
          Select a piece version first
        </h1>
        <Link href={SELECT_PIECE_VERSION_URL} className="btn">
          Back
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4 text-4xl font-bold">
        Create a Metronome Mark Source{" "}
        <span className="block text-xl font-normal">General description</span>
      </h1>
      <form onSubmit={handleSubmit(onSubmit)}>
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
        <button
          className="btn btn-primary mt-6 w-full max-w-xs"
          type="submit"
          disabled={isSubmitting}
        >
          Submit
          {isSubmitting && (
            <span className="loading loading-spinner loading-sm"></span>
          )}
        </button>
      </form>
    </div>
  );
}
