// "use client";
import { PieceVersionState } from "@/types/formTypes";
import PieceVersionDisplay from "@/components/entities/piece-version/PieceVersionDisplay";

type PieceVersionSelectProps = {
  pieceVersions: PieceVersionState[];
  onSelect: (pieceVersionId: string) => void;
  selectedPieceVersion: PieceVersionState | null;
};
export default function PieceVersionSelect({
  pieceVersions,
  onSelect,
  selectedPieceVersion,
}: PieceVersionSelectProps) {
  return pieceVersions.map((pieceVersion) => (
    <div
      key={pieceVersion.id}
      className="flex py-2 pl-4 pr-2 items-center rounded-sm border-2 border-slate-500 hover:ring"
    >
      <input
        type="radio"
        id={pieceVersion.id}
        checked={pieceVersion.id === selectedPieceVersion?.id}
        name="pieceVersion"
        value={pieceVersion.id}
        onChange={(e) => onSelect(e.target.value)}
        className="mr-4"
      />
      <label htmlFor={pieceVersion.id} className="flex-1">
        <PieceVersionDisplay pieceVersion={pieceVersion} />
      </label>
    </div>
  ));
}
