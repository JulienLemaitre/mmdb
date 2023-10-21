"use client";
import Link from "next/link";

import { useEditForm } from "@/components/context/editFormContext";
import { EDITION_PIECE_VERSION_URL } from "@/utils/routes";
import PieceVersionSelect from "@/components/PieceVersionSelect";
import { PieceVersionState } from "@/types/editFormTypes";

type PieceVersionSelectFormProps = {
  pieceVersions: PieceVersionState[];
};
export default function PieceVersionSelectForm({
  pieceVersions,
}: PieceVersionSelectFormProps) {
  const { state } = useEditForm();

  return (
    <>
      <PieceVersionSelect pieceVersions={pieceVersions} />
      <Link
        href={
          EDITION_PIECE_VERSION_URL + "?pieceVersionId=" + state?.pieceVersionId
        }
        className="btn btn-primary mt-4"
        {...(state?.pieceVersionId ? { disabled: false } : { disabled: true })}
      >
        Next
      </Link>
    </>
  );
}
