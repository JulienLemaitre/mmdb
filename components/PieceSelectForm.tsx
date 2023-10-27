"use client";
import {
  updateEditForm,
  useEditForm,
} from "@/components/context/editFormContext";
import {
  EDITION_COMPOSER_URL,
  EDITION_PIECE_VERSION_URL,
} from "@/utils/routes";
import PieceSelect from "@/components/PieceSelect";
import { PieceState } from "@/types/editFormTypes";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

type PieceSelectFormProps = {
  pieces: PieceState[];
};
export default function PieceSelectForm({ pieces }: PieceSelectFormProps) {
  const { dispatch, state } = useEditForm();
  const router = useRouter();
  const [selectedPiece, setSelectedPiece] = useState<PieceState | null>(null);

  const onSelect = (pieceId: string) => {
    const piece = pieces.find((piece) => piece.id === pieceId);
    console.log(`[PieceSelectForm] onSelect: ${pieceId}`);
    if (!piece) return;
    setSelectedPiece(piece);
  };
  const onSubmit = () => {
    updateEditForm(dispatch, "piece", selectedPiece);
    router.push(EDITION_PIECE_VERSION_URL + "?pieceId=" + selectedPiece?.id);
  };

  if (!state.composer) {
    return (
      <div>
        <h2 className="mb-4 text-2xl font-bold">Select a composer first</h2>
        <Link href={EDITION_COMPOSER_URL} className="btn btn-secondary">
          Back
        </Link>
      </div>
    );
  }

  return (
    <>
      <PieceSelect pieces={pieces} onSelect={onSelect} />
      <button
        onClick={onSubmit}
        className="btn btn-primary mt-4"
        {...(selectedPiece ? { disabled: false } : { disabled: true })}
      >
        Next
      </button>
    </>
  );
}
