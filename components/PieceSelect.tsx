"use client";
import Select from "react-select";
import {
  useEditForm,
  updateEditForm,
} from "@/components/context/editFormContext";
import { PieceState } from "@/types/editFormTypes";

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
    />
  );
}
