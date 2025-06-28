import Select from "@/components/ReactSelect/Select";
import { PieceState } from "@/types/formTypes";
import getNoOptionsMessage from "@/components/ReactSelect/getNoOptionsMessage";

type PieceSelectProps = {
  pieces: PieceState[];
  onSelect: (pieceId: string) => void;
  selectedPiece: PieceState | null;
  onInitPieceCreation: () => void;
};
export default function PieceSelect({
  pieces,
  onSelect,
  selectedPiece,
  onInitPieceCreation,
}: Readonly<PieceSelectProps>) {
  const pieceOptions = pieces.map((piece) => getPieceOption(piece));
  const defaultOption = selectedPiece ? getPieceOption(selectedPiece) : null;

  return (
    <Select
      className="react-select-container"
      classNamePrefix="react-select"
      instanceId="piece-select"
      placeholder="Enter piece name..."
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
        entityName: "piece",
        onClick: onInitPieceCreation,
      })}
    />
  );
}

function getPieceOption(piece: PieceState) {
  const nickname = piece.nickname ? ` (${piece.nickname})` : "";
  return {
    value: piece.id,
    label: `${piece.title}${nickname} (${typeof piece.yearOfComposition === "number" && !Number.isNaN(piece.yearOfComposition) ? piece.yearOfComposition : "no date"})`,
  };
}
