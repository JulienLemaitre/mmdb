"use client";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormInput } from "@/components/ReactHookForm/FormInput";
import preventEnterKeySubmission from "@/utils/preventEnterKeySubmission";
import { CollectionTitleInput } from "@/types/formTypes";
import ArrowLeftIcon from "@/components/svg/ArrowLeftIcon";

const CollectionSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2),
});

export default function CollectionEditForm(
  props: Readonly<{
    collection?: CollectionTitleInput;
    onSubmit: (_collection: CollectionTitleInput) => void;
    onCancel: () => void;
    submitTitle?: string;
    title?: string;
  }>,
) {
  const { collection, onCancel, onSubmit } = props;
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
    <div className="mt-4">
      <h3 className="mb-4 text-2xl font-bold">{`New collection`}</h3>
      <form
        onSubmit={handleSubmit(onSubmit)}
        onKeyDown={preventEnterKeySubmission}
      >
        {collection?.id && <input type="hidden" {...register("id")} />}
        <FormInput
          name="title"
          label="Title of the collection"
          isRequired={true}
          {...{ register, errors, control }}
        />
        <div className="grid grid-cols-2 gap-4 items-center mt-6">
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
            className="btn btn-primary"
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
