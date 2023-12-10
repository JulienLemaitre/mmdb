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
import { fetchAPI } from "@/utils/fetchAPI";
import { useSession } from "next-auth/react";

const PieceSchema = z.object({
  title: z.string().min(2),
  nickname: z.string().optional(),
  yearOfComposition: z
    .number()
    .gte(1000)
    .lte(new Date().getFullYear())
    .or(z.nan())
    .optional()
    .nullable(),
});

export default function CreatePiece() {
  const router = useRouter();
  const { dispatch, state } = useEditForm();
  const { data: session } = useSession();
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

    const pieceData = data;
    // Remove null values from pieceData
    Object.keys(pieceData).forEach(
      (key) => pieceData[key] == null && delete pieceData[key],
    );

    if (!state.composer) {
      console.warn("No composer in state to link to the piece");
      return;
    }
    // post data to api route
    const piece = await fetchAPI(
      "/api/piece/create",
      {
        variables: { ...pieceData, composerId: state.composer.id },
      },
      session?.user?.accessToken,
    );

    console.log("piece created", piece);
    const pieceState = {
      id: piece.id,
      title: piece.title,
      nickname: piece.nickname,
    };

    updateEditForm(dispatch, "piece", pieceState);
    router.push(CREATION_PIECE_VERSION_URL);
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
      <h1 className="mb-4 text-4xl font-bold">
        Create a piece
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
            <span className="loading loading-spinner loading-sm"></span>
          )}
        </button>
      </form>
    </div>
  );
}
