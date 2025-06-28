import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PersonInput } from "@/types/formTypes";
import { FormInput } from "@/components/ReactHookForm/FormInput";
import { zodPerson } from "@/types/zodTypes";
import preventEnterKeySubmission from "@/utils/preventEnterKeySubmission";
import ArrowLeftIcon from "@/components/svg/ArrowLeftIcon";

const PersonSchema = zodPerson;

export default function ComposerEditForm({
  composer,
  onSubmit,
  onCancel,
}: Readonly<{
  composer?: PersonInput;
  onSubmit: (composer: PersonInput) => void;
  onCancel: () => void;
}>) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    control,
  } = useForm({
    resolver: zodResolver(PersonSchema),
    ...(composer && { defaultValues: composer }),
  });

  console.log(`[CreateComposer] composer :`, composer);
  console.log(`[CreateComposer] errors :`, errors);
  return (
    <div className="w-full max-w-md mt-4">
      <h3 className="mb-4 text-2xl font-bold">{`New composer`}</h3>
      {/*
      <h1 className="mb-4 text-2xl font-bold">{`${
        composer ? `Update` : `Create`
      } a composer`}</h1>
*/}
      <form
        // className="flex flex-col items-center justify-center"
        onSubmit={handleSubmit(onSubmit)}
        onKeyDown={preventEnterKeySubmission}
      >
        <FormInput
          name="firstName"
          isRequired
          {...{ register, control, errors }}
        />
        <FormInput
          name="lastName"
          isRequired
          {...{ register, control, errors }}
        />
        <FormInput
          name="birthYear"
          isRequired
          {...{ register, control, errors }}
        />
        <FormInput name="deathYear" {...{ register, control, errors }} />
        <div className="flex gap-4 items-center mt-6">
          <button
            className="btn btn-neutral"
            type="button"
            disabled={isSubmitting}
            onClick={onCancel}
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Cancel
          </button>
          <button
            className="btn btn-primary w-full max-w-xs"
            type="submit"
            disabled={isSubmitting}
          >
            Submit
            {isSubmitting && (
              <span className="loading loading-spinner loading-md"></span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
