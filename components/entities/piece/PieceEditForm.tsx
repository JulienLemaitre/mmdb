import { z } from "zod";
import { zodYearOptional } from "@/types/zodTypes";
import { useForm } from "react-hook-form";
import { PieceInput } from "@/types/formTypes";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormInput } from "@/components/ReactHookForm/FormInput";
import ArrowLeftIcon from "@/components/svg/ArrowLeftIcon";
import preventEnterKeySubmission from "@/utils/preventEnterKeySubmission";

const PieceSchema = z.object({
  title: z.string().min(2),
  nickname: z.string().optional().nullable(),
  yearOfComposition: zodYearOptional,
});

export default function PieceEditForm({
  piece,
  onSubmit,
  onCancel,
  newPieceDefaultTitle,
}: Readonly<{
  piece?: PieceInput;
  onSubmit: (piece: PieceInput) => void;
  onCancel: () => void;
  newPieceDefaultTitle?: string;
}>) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    control,
  } = useForm({
    resolver: zodResolver(PieceSchema),
    ...((piece || newPieceDefaultTitle) && {
      defaultValues: {
        ...piece,
        ...(newPieceDefaultTitle ? { title: newPieceDefaultTitle } : {}),
      },
    }),
  });

  console.log(`[PieceEditForm] piece :`, piece);
  console.log(`[PieceEditForm] errors :`, errors);

  return (
    <div>
      <h3 className="mb-4 text-xl font-normal">General information</h3>
      <form
        onSubmit={handleSubmit(onSubmit)}
        onKeyDown={preventEnterKeySubmission}
      >
        <FormInput name="title" isRequired {...{ register, control, errors }} />
        <FormInput name="nickname" {...{ register, control, errors }} />
        <FormInput
          name="yearOfComposition"
          inputMode="numeric"
          {...{ register, control, errors }}
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
            {isSubmitting && (
              <span className="loading loading-spinner loading-md"></span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
