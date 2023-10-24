"use client";
import Select from "react-select";
import {
  useEditForm,
  updateEditForm,
} from "@/components/context/editFormContext";
import { PieceState } from "@/types/editFormTypes";
import { CREATION_PIECE_URL } from "@/utils/routes";
import { useRouter } from "next/navigation";

type PieceSelectProps = {
  pieces: PieceState[];
};
export default function PieceSelect({ pieces }: PieceSelectProps) {
  const pieceOptions = pieces.map((piece) => ({
    value: piece.id,
    label: `${piece.title}${piece.nickName ? ` (${piece.nickName})` : ""} (${
      piece.yearOfComposition
    })`,
  }));
  const router = useRouter();
  const { dispatch } = useEditForm();
  const onSelect = (pieceId: string) => {
    const piece = pieces.find((piece) => piece.id === pieceId);
    // Update the pieceId in the context
    console.log(`[PieceSelect] pieceId: ${pieceId}`);
    if (!piece) return;
    updateEditForm(dispatch, "piece", piece);
  };

  return (
    <Select
      instanceId="piece-select"
      defaultValue={pieceOptions[0]}
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
              console.log("Create a new piece");
              await router.push(CREATION_PIECE_URL);
            }}
          >
            Create a new piece
          </button>
        </div>
      )}
    />
  );
}
