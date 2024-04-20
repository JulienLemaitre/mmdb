import { z } from "zod";
import { zodYearOptional } from "@/utils/zodTypes";
import { useForm } from "react-hook-form";
import { PieceInput } from "@/types/formTypes";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormInput } from "@/components/ReactHookForm/FormInput";

const PieceSchema = z.object({
  title: z.string().min(2),
  nickname: z.string().optional().nullable(),
  yearOfComposition: zodYearOptional,
});

export default function PieceEditForm({
  piece,
  onSubmit,
}: Readonly<{ piece?: PieceInput; onSubmit: (piece: PieceInput) => void }>) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    watch,
  } = useForm<PieceInput>({
    resolver: zodResolver(PieceSchema),
    ...(piece && { defaultValues: piece }),
  });

  console.log(`[PieceEditForm] piece :`, piece);
  console.log(`[PieceEditForm] errors :`, errors);

  return (
    <div>
      <h1 className="mb-4 text-4xl font-bold">
        Create a piece{" "}
        <span className="block text-xl font-normal">General information</span>
      </h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormInput name="title" isRequired {...{ register, watch, errors }} />
        <FormInput name="nickname" {...{ register, watch, errors }} />
        <FormInput name="yearOfComposition" {...{ register, watch, errors }} />
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
    </div>
  );
}
