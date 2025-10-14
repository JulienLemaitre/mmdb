import { z } from "zod";
import { zodYearOptional } from "@/types/zodTypes";
import { useForm } from "react-hook-form";
import { PieceInput } from "@/types/formTypes";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormInput } from "@/ui/form/FormInput";
import ArrowLeftIcon from "@/ui/svg/ArrowLeftIcon";
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
  } = useForm<PieceInput>({
    resolver: zodResolver(PieceSchema) as any,
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
    <div className="mt-4">
      <h3 className="mb-4 text-2xl font-bold">New piece</h3>
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
            {isSubmitting && (
              <span className="loading loading-spinner loading-md"></span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
