// "use client";
import Select from "react-select";
import { PieceState } from "@/types/editFormTypes";
import { CREATE_PIECE_URL } from "@/utils/routes";
import { useRouter } from "next/navigation";

type PieceSelectProps = {
  pieces: PieceState[];
  onSelect: (pieceId: string) => void;
  selectedPiece: PieceState | null;
};
export default function PieceSelect({
  pieces,
  onSelect,
  selectedPiece,
}: PieceSelectProps) {
  const pieceOptions = pieces.map((piece) => getPieceOption(piece));
  const router = useRouter();
  const defaultOption = selectedPiece ? getPieceOption(selectedPiece) : null;
  console.log(`[PieceSelect] defaultOption :`, defaultOption);

  return (
    <Select
      instanceId="piece-select"
      isSearchable={true}
      name="color"
      options={pieceOptions}
      defaultValue={defaultOption}
      autoFocus
      onChange={(pieceOption) => {
        if (!pieceOption) return;
        onSelect(pieceOption?.value);
      }}
      noOptionsMessage={() => (
        <div className="text-left">
          <div className="ml-4 mb-2">No piece found</div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={async () => {
              console.log("Create a new piece");
              router.push(CREATE_PIECE_URL);
            }}
          >
            Create a new piece
          </button>
        </div>
      )}
    />
  );
}

function getPieceOption(piece: PieceState) {
  return {
    value: piece.id,
    label: `${piece.title}${piece.nickname ? ` (${piece.nickname})` : ""} (${
      piece.yearOfComposition
    })`,
  };
}
