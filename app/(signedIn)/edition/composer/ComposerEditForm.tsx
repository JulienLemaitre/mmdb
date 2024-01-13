"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ComposerInput, PersonState } from "@/types/editFormTypes";
import { useRouter } from "next/navigation";
import { CREATE_PIECE_URL } from "@/utils/routes";
import { FormInput } from "@/components/ReactHookForm/FormInput";
import {
  updateEditForm,
  useEditForm,
} from "@/components/context/editFormContext";
import { fetchAPI } from "@/utils/fetchAPI";
import { useSession } from "next-auth/react";
import { zodPerson } from "@/utils/zodTypes";
import BackButton from "@/components/BackButton";

const PersonSchema = zodPerson;

export default function ComposerEditForm({
  composer,
}: {
  composer?: PersonState;
}) {
  const router = useRouter();
  const { dispatch } = useEditForm();
  const { data: session } = useSession();
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    watch,
  } = useForm<ComposerInput>({
    resolver: zodResolver(PersonSchema),
    ...(composer && { defaultValues: composer }),
  });

  const onSubmit = async (data: ComposerInput) => {
    // Front input values validation is successful at this point.
    console.log("data", data);
    const apiUrl = composer ? `/api/person/update` : "/api/person/create";

    // post data to api route to create a composer as a person
    const editedComposer = await fetchAPI(
      apiUrl,
      {
        variables: { ...data, id: composer?.id },
        cache: "no-store",
      },
      session?.user?.accessToken,
    );

    if (!editedComposer || editedComposer.error) {
      console.warn(
        `ERROR - NO composer ${composer ? "updated" : "created"}${
          editedComposer?.error ? ` [${editedComposer.error}]` : ""
        }`,
      );
      // TODO should trigger a toast
      return;
    }

    console.log("Composer created", editedComposer);
    const composerState = {
      id: editedComposer.id,
      firstName: editedComposer.firstName,
      lastName: editedComposer.lastName,
      birthYear: editedComposer.birthYear,
      deathYear: editedComposer.deathYear,
      isNew: true,
    };

    updateEditForm(dispatch, "composer", composerState);
    router.push(CREATE_PIECE_URL);
  };

  console.log(`[CreateComposer] errors :`, errors);
  return (
    <div className="w-full max-w-md">
      <h1 className="mb-4 text-4xl font-bold">{`${
        composer ? `Update` : `Create`
      } a composer`}</h1>
      <form
        // className="flex flex-col items-center justify-center"
        onSubmit={handleSubmit(onSubmit)}
      >
        <FormInput
          name="firstName"
          isRequired
          {...{ register, watch, errors }}
        />
        <FormInput
          name="lastName"
          isRequired
          {...{ register, watch, errors }}
        />
        <FormInput
          name="birthYear"
          isRequired
          {...{ register, watch, errors }}
        />
        <FormInput name="deathYear" {...{ register, watch, errors }} />
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
      <BackButton />
    </div>
  );
}
