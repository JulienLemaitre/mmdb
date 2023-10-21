"use client";
import Link from "next/link";

import { useEditForm } from "@/components/context/editFormContext";
import { EDITION_PIECE_VERSION_URL } from "@/utils/routes";
import PieceSelect from "@/components/PieceSelect";
import { PieceState } from "@/types/editFormTypes";

type PieceSelectFormProps = {
  pieces: PieceState[];
};
export default function PieceSelectForm({ pieces }: PieceSelectFormProps) {
  const { state } = useEditForm();

  return (
    <>
      <PieceSelect pieces={pieces} />
      <Link
        href={EDITION_PIECE_VERSION_URL + "?pieceId=" + state?.piece?.id}
        className="btn btn-primary mt-4"
        {...(state?.piece?.id ? { disabled: false } : { disabled: true })}
      >
        Next
      </Link>
    </>
  );
}
