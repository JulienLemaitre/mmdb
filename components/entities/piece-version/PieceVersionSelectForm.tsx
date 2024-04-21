import PieceVersionSelect from "@/components/entities/piece-version/PieceVersionSelect";
import { PieceVersionState } from "@/types/formTypes";
import { useEffect, useState } from "react";
import PlusIcon from "@/components/svg/PlusIcon";

type PieceVersionSelectFormProps = {
  pieceVersions: PieceVersionState[];
  value?: PieceVersionState;
  onPieceVersionSelect: (event: any) => void;
  onPieceVersionCreationClick: () => void;
};
export default function PieceVersionSelectForm({
  pieceVersions,
  value,
  onPieceVersionSelect,
  onPieceVersionCreationClick,
}: Readonly<PieceVersionSelectFormProps>) {
  const [selectedPieceVersion, setSelectedPieceVersion] =
    useState<PieceVersionState | null>(null);

  // Reset the form context when the component is mounted
  useEffect(() => {
    // Init the form with context value if exists
    if (value) {
      onSelect(value.id);
    }
  }, []);

  const onSelect = (pieceVersionId: string) => {
    const pieceVersion = pieceVersions.find(
      (pieceVersion) => pieceVersion.id === pieceVersionId,
    );
    console.log(`[PieceVersionSelectForm] onSelect: ${pieceVersionId}`);
    if (!pieceVersion) return;
    setSelectedPieceVersion(pieceVersion);
  };

  // If we have a default value to set, we prevent an initial render of react-select that would prevent its use
  if (value && !selectedPieceVersion) {
    return null;
  }

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
          className="btn btn-secondary"
          onClick={() => onPieceVersionCreationClick()}
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
