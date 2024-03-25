"use client";

import Link from "next/link";
import {
  updateEditForm,
  useEditForm,
} from "@/components/context/editFormContext";
import {
  URL_CREATE_PIECE_VERSION,
  URL_CREATE_SOURCE_DESCRIPTION,
  URL_SELECT_PIECE,
} from "@/utils/routes";
import PieceVersionSelect from "@/app/(signedIn)/edition/piece-version/PieceVersionSelect";
import { PieceVersionState } from "@/types/editFormTypes";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PlusIcon from "@/components/svg/PlusIcon";

type PieceVersionSelectFormProps = {
  pieceVersions: PieceVersionState[];
};
export default function PieceVersionSelectForm({
  pieceVersions,
}: Readonly<PieceVersionSelectFormProps>) {
  const router = useRouter();
  const { dispatch, state } = useEditForm();
  const [selectedPieceVersion, setSelectedPieceVersion] =
    useState<PieceVersionState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Reset the form context when the component is mounted
  useEffect(() => {
    // Init the form with context value if exists
    if (state.pieceVersion) {
      onSelect(state.pieceVersion.id);
    }
  }, []);

  const onSelect = (pieceVersionId: string) => {
    const pieceVersion = pieceVersions.find(
      (pieceVersion) => pieceVersion.id === pieceVersionId,
    );
    console.log(`[PieceVersionSelectForm] onSelect: ${pieceVersionId}`);
    if (!pieceVersion) return;
    setSelectedPieceVersion(pieceVersion);
  };
  const onSubmit = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    updateEditForm(dispatch, "pieceVersion", selectedPieceVersion);
    router.push(URL_CREATE_SOURCE_DESCRIPTION);
  };

  if (!state.piece) {
    return (
      <div>
        <h2 className="mb-4 text-2xl font-bold">Select a piece first</h2>
        <Link href={URL_SELECT_PIECE} className="btn btn-secondary">
          Back
        </Link>
      </div>
    );
  }

  return (
    <>
      <PieceVersionSelect
        pieceVersions={pieceVersions}
        onSelect={onSelect}
        selectedPieceVersion={selectedPieceVersion}
      />
      <div className="mt-4">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            router.push(URL_CREATE_PIECE_VERSION);
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
        {isSubmitting && (
          <span className="loading loading-spinner loading-md" />
        )}
        Choose Piece Version
      </button>
    </>
  );
}
