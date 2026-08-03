import PieceVersionSelect from "@/features/pieceVersion/PieceVersionSelect";
import { PieceVersionState } from "@/types/formTypes";
import { useCallback, useState } from "react";
import PlusIcon from "@/ui/svg/PlusIcon";
import { prodLog } from "@/utils/debugLogger";

type PieceVersionSelectFormProps = {
  pieceVersions: PieceVersionState[];
  value?: PieceVersionState;
  onPieceVersionSelect: (event: any) => void;
  onInitPieceVersionCreation: () => void;
};
export default function PieceVersionSelectForm({
  pieceVersions,
  value,
  onPieceVersionSelect,
  onInitPieceVersionCreation,
}: Readonly<PieceVersionSelectFormProps>) {
  const [selectedPieceVersionId, setSelectedPieceVersionId] = useState<
    string | null
  >(() => value?.id ?? null);

  const selectedPieceVersion = pieceVersions.find(
    (pieceVersion) => pieceVersion.id === selectedPieceVersionId,
  );

  const onSelect = useCallback(
    (pieceVersionId: string) => {
      const pieceVersion = pieceVersions.find(
        (pieceVersion) => pieceVersion.id === pieceVersionId,
      );
      if (!pieceVersion) {
        prodLog.warn(
          "Selected pieceVersionId not found in received pieceVersions",
        );
        return;
      }
      setSelectedPieceVersionId(pieceVersionId);
    },
    [pieceVersions],
  );

  return (
    <>
      <PieceVersionSelect
        pieceVersions={pieceVersions}
        onSelect={onSelect}
        selectedPieceVersion={selectedPieceVersion}
      />
      <div className="mt-4">
        <button
          type="button"
          className="btn btn-accent"
          onClick={onInitPieceVersionCreation}
        >
          <PlusIcon className="w-5 h-5" />
          New piece version
        </button>
      </div>
      <button
        onClick={() => onPieceVersionSelect(selectedPieceVersion)}
        className="btn btn-primary mt-4"
        {...(selectedPieceVersion ? { disabled: false } : { disabled: true })}
      >
        Choose Piece Version
      </button>
    </>
  );
}
