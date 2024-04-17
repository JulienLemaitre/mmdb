import React, { useState } from "react";
import { MMSourcePieceVersionsState } from "@/types/formTypes";
import PlusIcon from "@/components/svg/PlusIcon";
import StepNavigation from "@/components/multiStepMMSourceForm/StepNavigation";
import SourceOnPieceVersionForm from "@/components/multiStepSourcePieceVersionsForm/SourceOnPieceVersionForm";

type SourcePieceVersionSelectFormProps = {
  sourcePieceVersions?: MMSourcePieceVersionsState[];
  onSubmit: (sourcePieceVersions: MMSourcePieceVersionsState[]) => void;
  submitTitle?: string;
  title?: string;
};

const SourceOnPieceVersionFormContainer = ({
  sourcePieceVersions,
  onSubmit,
  submitTitle,
  title,
}: SourcePieceVersionSelectFormProps) => {
  const [sourceOnPieceVersions, setSourceOnPieceVersions] = useState<
    MMSourcePieceVersionsState[]
  >(sourcePieceVersions || []);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const onAddSourcePieceVersions = (
    sourcePieceVersions: MMSourcePieceVersionsState[],
  ) => {
    setSourceOnPieceVersions((prevList) => [
      ...prevList,
      ...sourcePieceVersions,
    ]);
    setIsFormOpen(false);
  };

  return (
    <>
      <ul className="my-4">
        {sourceOnPieceVersions.map((sourcePieceVersion, index) => (
          <li
            key={`${index}-${sourcePieceVersion.pieceVersionId}-${sourcePieceVersion.rank}`}
          >
            <h4 className="mt-6 text-lg font-bold text-secondary">{`Contribution ${
              index + 1
            }`}</h4>
            <div className="flex gap-3 items-center">
              <div className="font-bold">{`${sourcePieceVersion.rank}:`}</div>
              <div>{sourcePieceVersion.pieceVersionId}</div>
            </div>
          </li>
        ))}
      </ul>

      {isFormOpen ? (
        <SourceOnPieceVersionForm
          sourceOnPieceVersions={sourceOnPieceVersions}
          onAddSourcePieceVersions={onAddSourcePieceVersions}
        />
      ) : (
        <div>
          <button
            type="button"
            className="btn btn-accent"
            onClick={() => setIsFormOpen(true)}
          >
            <PlusIcon className="w-5 h-5" />
            Add a piece
          </button>
        </div>
      )}

      <StepNavigation
        onClick={() => onSubmit(sourceOnPieceVersions)}
        isNextDisabled={!(sourceOnPieceVersions.length > 0 && !isFormOpen)}
        submitTitle={submitTitle}
      />
    </>
  );
};

export default SourceOnPieceVersionFormContainer;
