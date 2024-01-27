// "use client";
import Select from "@/components/ReactSelect/Select";
import { PieceState } from "@/types/editFormTypes";
import { CREATE_PIECE_URL } from "@/utils/routes";
import { useRouter } from "next/navigation";
import getNoOptionsMessage from "@/components/ReactSelect/getNoOptionsMessage";

type PieceSelectProps = {
  pieces: PieceState[];
  onSelect: (pieceId: string) => void;
  selectedPiece: PieceState | null;
};
export default function PieceSelect({
  pieces,
  onSelect,
  selectedPiece,
}: Readonly<PieceSelectProps>) {
  const pieceOptions = pieces.map((piece) => getPieceOption(piece));
  const router = useRouter();
  const defaultOption = selectedPiece ? getPieceOption(selectedPiece) : null;
  console.log(`[PieceSelect] defaultOption :`, defaultOption);

  return (
    <Select
      className="react-select-container"
      classNamePrefix="react-select"
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
      noOptionsMessage={getNoOptionsMessage({
        router,
        entityName: "piece",
        createUrl: CREATE_PIECE_URL,
      })}
    />
  );
}

function getPieceOption(piece: PieceState) {
  const nickname = piece.nickname ? ` (${piece.nickname})` : "";
  return {
    value: piece.id,
    label: `${piece.title}${nickname} (${piece.yearOfComposition})`,
  };
}
