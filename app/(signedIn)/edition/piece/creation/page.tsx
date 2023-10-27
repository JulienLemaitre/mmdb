"use client";
import { z } from "zod";
import { useRouter } from "next/navigation";
import {
  updateEditForm,
  useEditForm,
} from "@/components/context/editFormContext";
import { useForm } from "react-hook-form";
import { PieceInput } from "@/types/editFormTypes";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CREATION_PIECE_VERSION_URL,
  EDITION_COMPOSER_URL,
} from "@/utils/routes";
import Link from "next/link";
import { FormInput } from "@/components/ReactHookForm/FormInput";
import { PIECE_CATEGORY } from "@prisma/client";
import ControlledSelect from "@/components/ReactHookForm/ControlledSelect";

const PieceSchema = z.object({
  title: z.string().min(2),
  nickname: z.string().min(2).optional(),
  yearOfComposition: z
    .number()
    .gte(1000)
    .lte(new Date().getFullYear())
    .optional(),
  category: z.object({
    value: z.string(),
    label: z.string(),
  }),
});

export default function CreatePiece() {
  const router = useRouter();
  const { dispatch, state } = useEditForm();
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    watch,
    control,
  } = useForm<PieceInput>({
    resolver: zodResolver(PieceSchema),
  });

  const onSubmit = async (data: PieceInput) => {
    // Front input values validation is successful at this point.
    console.log("data", data);

    const { category, ...pieceData } = data;

    if (!state.composer) {
      console.warn("No composer in state to link to the piece");
      return;
    }
    // post data to api route
    const piece = await fetch("/api/piece/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...pieceData, composerId: state.composer.id }),
    })
      .then((res) => res.json())
      .catch((err) => console.log(err));

    console.log("piece created", piece);
    const pieceState = {
      id: piece.id,
      title: piece.title,
      nickname: piece.nickname,
    };

    updateEditForm(dispatch, "piece", pieceState);
    router.push(CREATION_PIECE_VERSION_URL + "?category=" + category.value);
  };

  if (!state.composer) {
    return (
      <div>
        <h1 className="mb-4 text-4xl font-bold">Select a composer first</h1>
        <Link href={EDITION_COMPOSER_URL} className="btn">
          Back
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4 text-4xl font-bold">Create a piece</h1>
      <form
        className="flex flex-col items-center justify-center"
        onSubmit={handleSubmit(onSubmit)}
      >
        <FormInput name="title" {...{ register, watch, errors }} />
        <FormInput name="nickname" {...{ register, watch, errors }} />
        <FormInput name="yearOfComposition" {...{ register, watch, errors }} />
        <ControlledSelect
          control={control}
          name="category"
          id="category"
          options={Object.values(PIECE_CATEGORY).map((category) => ({
            value: category,
            label: category,
          }))}
          placeholder="Type d'ouvrage"
          hasOptionsGrouped
          label=""
        />
        <button
          className="btn btn-primary mt-6 w-full max-w-xs"
          type="submit"
          disabled={isSubmitting}
        >
          Submit
        </button>
      </form>
    </div>
  );
}
