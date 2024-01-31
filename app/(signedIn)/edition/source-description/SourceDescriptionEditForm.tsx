"use client";
import { z } from "zod";
import { useRouter } from "next/navigation";
import {
  updateEditForm,
  useEditForm,
} from "@/components/context/editFormContext";
import { useForm } from "react-hook-form";
import { SourceInput } from "@/types/editFormTypes";
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
import { fetchAPI } from "@/utils/fetchAPI";
import { useSession } from "next-auth/react";

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
  sourceDescription?: SourceInput;
}>) {
  const router = useRouter();
  const { dispatch, state } = useEditForm();
  const { data: session } = useSession();
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    watch,
    control,
  } = useForm<SourceInput>({
    defaultValues: sourceDescription || {
      type: SOURCE_TYPE.EDITION,
    },
    resolver: zodResolver(SourceSchema),
  });

  const onSubmit = async (data: SourceInput) => {
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
    // post data to api route
    const apiUrl = sourceDescription
      ? "/api/source-description/update"
      : "/api/source-description/create";
    const editedSourceDescription = await fetchAPI(
      apiUrl,
      {
        variables: {
          ...sourceData,
          pieceVersionId: state.pieceVersion.id,
        },
        cache: "no-store",
      },
      session?.user?.accessToken,
    );

    editedSourceDescription.isNew = true;
    console.log("source description created", editedSourceDescription);
    updateEditForm(dispatch, "sourceDescription", editedSourceDescription);
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
        Create a source
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
