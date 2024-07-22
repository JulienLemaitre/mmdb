"use client";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormInput } from "@/components/ReactHookForm/FormInput";
import preventEnterKeySubmission from "@/utils/preventEnterKeySubmission";
import { CollectionInput, CollectionTitleInput } from "@/types/formTypes";
import { NOTE_VALUE } from "@prisma/client";
import formatToPhraseCase from "@/utils/formatToPhraseCase";
import ControlledSelect from "@/components/ReactHookForm/ControlledSelect";

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
    watch,
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
      <FormInput name="title" {...{ register, watch, errors }} />
      <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
        {submitTitle ? `Save ${submitTitle}` : "Next"}
      </button>
    </form>
  );
}
