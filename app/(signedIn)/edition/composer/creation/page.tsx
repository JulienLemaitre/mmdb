"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ComposerInput } from "@/types/editFormTypes";
import { useRouter } from "next/navigation";
import { CREATION_PIECE_URL } from "@/utils/routes";
import { FormInput } from "@/components/ReactHookForm/FormInput";
import { z } from "zod";
import {
  updateEditForm,
  useEditForm,
} from "@/components/context/editFormContext";

const PersonSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  birthYear: z.number().gte(1000).lte(new Date().getFullYear()),
  deathYear: z
    .number()
    .gte(1000)
    .lte(new Date().getFullYear())
    .optional()
    .nullable(),
});

export default function CreateComposer() {
  const router = useRouter();
  const { dispatch } = useEditForm();
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    watch,
  } = useForm<ComposerInput>({
    resolver: zodResolver(PersonSchema),
  });

  const onSubmit = async (data: ComposerInput) => {
    // Front input values validation is successful at this point.
    console.log("data", data);

    // post data to api route to create a composer as a person
    const composer = await fetch("/api/person/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .catch((err) => console.log(err));

    if (!composer) {
      console.warn("ERROR - NO composer created");
      return;
    }

    console.log("Composer created", composer);
    const composerState = {
      id: composer.id,
      firstName: composer.firstName,
      lastName: composer.lastName,
    };

    updateEditForm(dispatch, "composer", composerState);
    router.push(CREATION_PIECE_URL);
  };

  console.log(`[CreateComposer] errors :`, errors);
  return (
    <div
    // className="flex flex-col items-center justify-center"
    >
      <h1 className="mb-4 text-4xl font-bold">Create a composer</h1>
      <form
        // className="flex flex-col items-center justify-center"
        onSubmit={handleSubmit(onSubmit)}
      >
        <FormInput name="firstName" {...{ register, watch, errors }} />
        <FormInput name="lastName" {...{ register, watch, errors }} />
        <FormInput name="birthYear" {...{ register, watch, errors }} />
        <FormInput name="deathYear" {...{ register, watch, errors }} />
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
