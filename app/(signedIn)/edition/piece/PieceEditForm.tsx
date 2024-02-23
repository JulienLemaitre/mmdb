"use client";

import { z } from "zod";
import { zodYearOptional } from "@/utils/zodTypes";
import { useRouter } from "next/navigation";
import {
  updateEditForm,
  useEditForm,
} from "@/components/context/editFormContext";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { PieceInput } from "@/types/editFormTypes";
import { zodResolver } from "@hookform/resolvers/zod";
import { fetchAPI } from "@/utils/fetchAPI";
import { CREATE_PIECE_VERSION_URL, SELECT_COMPOSER_URL } from "@/utils/routes";
import Link from "next/link";
import { FormInput } from "@/components/ReactHookForm/FormInput";

const PieceSchema = z.object({
  title: z.string().min(2),
  nickname: z.string().optional().nullable(),
  yearOfComposition: zodYearOptional,
});

export default function PieceEditForm({
  piece,
}: Readonly<{ piece?: PieceInput }>) {
  const router = useRouter();
  const { dispatch, state } = useEditForm();
  const { data: session } = useSession();
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    watch,
  } = useForm<PieceInput>({
    resolver: zodResolver(PieceSchema),
    ...(piece && { defaultValues: piece }),
  });

  const onSubmit = async (data: PieceInput) => {
    // Front input values validation is successful at this point.
    console.log("data", data);

    const pieceData = {
      ...data,
      ...(piece && { id: piece.id }),
    };
    // Remove null values from pieceData
    Object.keys(pieceData).forEach(
      (key) => pieceData[key] == null && delete pieceData[key],
    );

    if (!state.composer) {
      console.warn("No composer in state to link to the piece");
      return;
    }

    const apiUrl = piece ? `/api/piece/update` : "/api/piece/create";

    // post data to api route
    const editedPiece = await fetchAPI(
      apiUrl,
      {
        variables: { ...pieceData, composerId: state.composer.id },
        cache: "no-store",
      },
      session?.user?.accessToken,
    );

    console.log("piece created", editedPiece);
    const pieceState = {
      id: editedPiece.id,
      title: editedPiece.title,
      nickname: editedPiece.nickname,
      yearOfComposition: editedPiece.yearOfComposition,
      isNew: true,
    };

    updateEditForm(dispatch, "piece", pieceState);
    router.push(CREATE_PIECE_VERSION_URL);
  };

  if (!state.composer) {
    return (
      <div className="w-full max-w-md">
        <h1 className="mb-4 text-4xl font-bold">Select a composer first</h1>
        <Link href={SELECT_COMPOSER_URL} className="btn">
          Back
        </Link>
      </div>
    );
  }

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
