"use client";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormInput } from "@/components/ReactHookForm/FormInput";
import preventEnterKeySubmission from "@/utils/preventEnterKeySubmission";
import { CollectionTitleInput } from "@/types/formTypes";
import ArrowLeftIcon from "@/components/svg/ArrowLeftIcon";

const CollectionSchema = z.object({
  title: z.string().min(2),
});

export default function CollectionEditForm(
  props: Readonly<{
    collection?: CollectionTitleInput;
    onSubmit: (collection: CollectionTitleInput) => void;
    onCancel: () => void;
    submitTitle?: string;
    title?: string;
  }>,
) {
  const { collection, onCancel, onSubmit, submitTitle, title } = props;
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    control,
  } = useForm<CollectionTitleInput>({
    defaultValues: collection ?? {},
    resolver: zodResolver(CollectionSchema),
  });

  return (
    <div className="w-full max-w-md mt-4">
      <h3 className="mb-4 text-2xl font-bold">{`New collection`}</h3>
      <form
        onSubmit={handleSubmit(onSubmit)}
        onKeyDown={preventEnterKeySubmission}
        className="max-w-md"
      >
        <FormInput
          name="title"
          label="Title of the collection"
          isRequired={true}
          {...{ register, errors, control }}
        />
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
            {/*{submitTitle ? `Save ${submitTitle}` : "Next"}*/}
            {isSubmitting && (
              <span className="loading loading-spinner loading-md"></span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
