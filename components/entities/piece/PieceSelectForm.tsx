"use client";
import {
  updateEditForm,
  useEditForm,
} from "@/components/context/editFormContext";
import { URL_SELECT_COMPOSER, URL_SELECT_PIECE_VERSION } from "@/utils/routes";
import PieceSelect from "@/components/entities/piece/PieceSelect";
import { PieceState } from "@/types/editFormTypes";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

type PieceSelectFormProps = {
  pieces: PieceState[];
};
export default function PieceSelectForm({ pieces }: PieceSelectFormProps) {
  const { dispatch, state } = useEditForm();
  const router = useRouter();
  const [selectedPiece, setSelectedPiece] = useState<PieceState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Reset the form context when the component is mounted
  useEffect(() => {
    // Init the form with context value if exists
    if (state.piece) {
      onSelect(state.piece.id);
    }
  }, []);

  const onSelect = (pieceId: string) => {
    const piece = pieces.find((piece) => piece.id === pieceId);
    console.log(`[PieceSelectForm] onSelect: ${pieceId}`);
    console.log(`[PieceSelectForm] piece: `, piece);
    console.log(`[PieceSelectForm] pieces: `, pieces);
    if (!piece) return;
    setSelectedPiece(piece);
  };
  const onSubmit = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    updateEditForm(dispatch, "piece", selectedPiece);
    router.push(URL_SELECT_PIECE_VERSION + "?pieceId=" + selectedPiece?.id);
  };

  if (!state.composer) {
    return (
      <div>
        <h2 className="mb-4 text-2xl font-bold">Select a composer first</h2>
        <Link href={URL_SELECT_COMPOSER} className="btn btn-secondary">
          Back
        </Link>
      </div>
    );
  }

  // If we have a default value to set, we prevent an initial render of react-select that would prevent its use
  if (state.piece && !selectedPiece) {
    return null;
  }

  return (
    <>
      <PieceSelect
        pieces={pieces}
        onSelect={onSelect}
        selectedPiece={selectedPiece}
      />
      <button
        onClick={onSubmit}
        className="btn btn-primary mt-4"
        {...(selectedPiece ? { disabled: false } : { disabled: true })}
      >
        {isSubmitting && (
          <span className="loading loading-spinner loading-md" />
        )}
        Choose Piece
      </button>
    </>
  );
}
