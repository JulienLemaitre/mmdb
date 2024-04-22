import PieceSelect from "@/components/entities/piece/PieceSelect";
import { PieceState } from "@/types/formTypes";
import { useEffect, useState } from "react";

type PieceSelectFormProps = {
  pieces: PieceState[];
  value?: PieceState;
  onPieceSelect: (event: any) => void;
  onPieceCreationClick: () => void;
};
export default function PieceSelectForm({
  pieces,
  value,
  onPieceSelect,
  onPieceCreationClick,
}: PieceSelectFormProps) {
  console.log(`[PieceSelectForm] pieces :`, pieces);
  const [selectedPiece, setSelectedPiece] = useState<PieceState | null>(null);

  // Reset the form context when the component is mounted
  useEffect(() => {
    // Init the form with context value if exists
    if (value) {
      onSelect(value.id);
    }
  }, []);

  const onSelect = (pieceId: string) => {
    const piece = pieces.find((piece) => piece.id === pieceId);
    console.log(`[PieceSelectForm] piece: `, piece);
    if (!piece) return;
    setSelectedPiece(piece);
  };

  // If we have a default value to set, we prevent an initial render of react-select that would prevent its use
  if (value && !selectedPiece) {
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
        onClick={() => onPieceSelect(selectedPiece)}
        className="btn btn-primary mt-4"
        {...(selectedPiece ? { disabled: false } : { disabled: true })}
      >
        Choose Piece
      </button>
    </>
  );
}
