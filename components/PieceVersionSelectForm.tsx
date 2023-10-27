"use client";
import Link from "next/link";

import {
  updateEditForm,
  useEditForm,
} from "@/components/context/editFormContext";
import {
  EDITION_PIECE_URL,
  EDITION_PIECE_VERSION_CONTENT_URL,
  EDITION_PIECE_VERSION_URL,
} from "@/utils/routes";
import PieceVersionSelect from "@/components/PieceVersionSelect";
import { PieceVersionState } from "@/types/editFormTypes";
import { useState } from "react";
import { useRouter } from "next/navigation";

type PieceVersionSelectFormProps = {
  pieceVersions: PieceVersionState[];
};
export default function PieceVersionSelectForm({
  pieceVersions,
}: PieceVersionSelectFormProps) {
  const router = useRouter();
  const { dispatch, state } = useEditForm();
  const [selectPieceVersionId, setSelectPieceVersionId] = useState<
    string | null
  >(null);

  const onSelect = (pieceVersionId: string) => {
    console.log(`[PieceVersionSelectForm] onSelect: ${pieceVersionId}`);
    if (!pieceVersionId) return;
    setSelectPieceVersionId(pieceVersionId);
  };
  const onSubmit = () => {
    updateEditForm(dispatch, "pieceVersionId", selectPieceVersionId);
    router.push(
      EDITION_PIECE_VERSION_CONTENT_URL +
        "?pieceVersionId=" +
        selectPieceVersionId,
    );
  };

  if (!state.piece) {
    return (
      <div>
        <h1 className="mb-4 text-4xl font-bold">Select a piece first</h1>
        <Link href={EDITION_PIECE_URL} className="btn btn-secondary">
          Back
        </Link>
      </div>
    );
  }

  return (
    <>
      <PieceVersionSelect pieceVersions={pieceVersions} onSelect={onSelect} />
      <button
        onClick={onSubmit}
        className="btn btn-primary mt-4"
        {...(selectPieceVersionId ? { disabled: false } : { disabled: true })}
      >
        Next
      </button>
    </>
  );
}
