"use client";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormInput } from "@/components/ReactHookForm/FormInput";
import preventEnterKeySubmission from "@/utils/preventEnterKeySubmission";
import { CollectionTitleInput } from "@/types/formTypes";

const CollectionSchema = z.object({
  title: z.string().min(2),
});

export default function CollectionEditForm(
  props: Readonly<{
    collection?: CollectionTitleInput;
    onSubmit: (collection: CollectionTitleInput) => void;
    submitTitle?: string;
    title?: string;
  }>,
) {
  const { collection, onSubmit, submitTitle, title } = props;
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
    <form
      onSubmit={handleSubmit(onSubmit)}
      onKeyDown={preventEnterKeySubmission}
      className="max-w-md"
    >
      <FormInput name="title" {...{ register, errors, control }} />
      <button
        className="btn btn-primary mt-6"
        type="submit"
        disabled={isSubmitting}
      >
        {submitTitle ? `Save ${submitTitle}` : "Next"}
      </button>
    </form>
  );
}
