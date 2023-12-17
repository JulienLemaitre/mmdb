"use client";

import Link from "next/link";
import {
  updateEditForm,
  useEditForm,
} from "@/components/context/editFormContext";
import {
  CREATE_PIECE_VERSION_URL,
  CREATE_SOURCE_URL,
  SELECT_PIECE_URL,
} from "@/utils/routes";
import PieceVersionSelect from "@/components/PieceVersionSelect";
import { PieceVersionState } from "@/types/editFormTypes";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PlusIcon from "@/components/svg/PlusIcon";

type PieceVersionSelectFormProps = {
  pieceVersions: PieceVersionState[];
};
export default function PieceVersionSelectForm({
  pieceVersions,
}: PieceVersionSelectFormProps) {
  const router = useRouter();
  const { dispatch, state } = useEditForm();
  const [selectedPieceVersion, setSelectedPieceVersion] =
    useState<PieceVersionState | null>(null);

  const onSelect = (pieceVersionId: string) => {
    const pieceVersion = pieceVersions.find(
      (pieceVersion) => pieceVersion.id === pieceVersionId,
    );
    console.log(`[PieceVersionSelectForm] onSelect: ${pieceVersionId}`);
    if (!pieceVersion) return;
    setSelectedPieceVersion(pieceVersion);
  };
  const onSubmit = () => {
    updateEditForm(dispatch, "pieceVersion", selectedPieceVersion);
    router.push(CREATE_SOURCE_URL);
  };

  if (!state.piece) {
    return (
      <div>
        <h1 className="mb-4 text-4xl font-bold">Select a piece first</h1>
        <Link href={SELECT_PIECE_URL} className="btn btn-secondary">
          Back
        </Link>
      </div>
    );
  }

  return (
    <>
      <PieceVersionSelect pieceVersions={pieceVersions} onSelect={onSelect} />
      <div className="mt-4">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            router.push(CREATE_PIECE_VERSION_URL);
          }}
        >
          <PlusIcon className="w-5 h-5" />
          New piece version
        </button>
      </div>
      <button
        onClick={onSubmit}
        className="btn btn-primary mt-4"
        {...(selectedPieceVersion ? { disabled: false } : { disabled: true })}
      >
        Next
      </button>
    </>
  );
}
