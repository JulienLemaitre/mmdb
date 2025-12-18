// "use client";
import { PieceVersionState } from "@/types/formTypes";
import PieceVersionDisplay from "@/features/pieceVersion/PieceVersionDisplay";

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
  return (
    <div className="grid-cols-1 space-y-2">
      {pieceVersions.map((pieceVersion) => {
        const isChecked = pieceVersion.id === selectedPieceVersion?.id;

        return (
          <div
            key={pieceVersion.id}
            className={`flex py-2 pl-4 pr-2 items-center rounded-sm border-2 border-primary/30 hover:border-primary/60 ${isChecked && "outline-1 outline-primary transition-all duration-150"}`}
          >
            <input
              type="radio"
              id={pieceVersion.id}
              checked={isChecked}
              name="pieceVersion"
              value={pieceVersion.id}
              onChange={(e) => onSelect(e.target.value)}
              className="mr-4"
            />
            <label htmlFor={pieceVersion.id} className="flex-1">
              <PieceVersionDisplay pieceVersion={pieceVersion} />
            </label>
          </div>
        );
      })}
    </div>
  );
}
