// "use client";
import Select from "react-select";
import {
  useEditForm,
  updateEditForm,
} from "@/components/context/editFormContext";
import { PieceState } from "@/types/editFormTypes";
import { CREATE_PIECE_URL } from "@/utils/routes";
import { useRouter } from "next/navigation";

type PieceSelectProps = {
  pieces: PieceState[];
  onSelect: (pieceId: string) => void;
};
export default function PieceSelect({ pieces, onSelect }: PieceSelectProps) {
  const pieceOptions = pieces.map((piece) => ({
    value: piece.id,
    label: `${piece.title}${piece.nickname ? ` (${piece.nickname})` : ""} (${
      piece.yearOfComposition
    })`,
  }));
  const router = useRouter();
  const { dispatch } = useEditForm();

  return (
    <Select
      instanceId="piece-select"
      isSearchable={true}
      name="color"
      options={pieceOptions}
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
              updateEditForm(dispatch, "piece", null);
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
