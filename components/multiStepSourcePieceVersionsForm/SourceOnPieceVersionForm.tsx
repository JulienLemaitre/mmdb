import { MMSourcePieceVersionsState } from "@/types/formTypes";
import SourceOnPieceVersionsSteps from "@/components/multiStepSourcePieceVersionsForm/SourceOnPieceVersionsSteps";
import { getStepByRank } from "@/components/multiStepSourcePieceVersionsForm/stepsUtils";
import { useSourceOnPieceVersionsForm } from "@/components/context/SourceOnPieceVersionFormContext";
import { allExpanded, darkStyles, JsonView } from "react-json-view-lite";
import React from "react";

type SourceOnPieceVersionFormProps = {
  sourceOnPieceVersions?: MMSourcePieceVersionsState[];
  onAddSourcePieceVersions: (
    sourceOnPieceVersions: MMSourcePieceVersionsState[],
  ) => void;
  onFormClose: () => void;
};

/**
 * This component will go throw the whole process of creating a sourceOnPieceVersion entity or a series of sourceOnPieceVersion entities.
 * If the composer, piece and pieceVersion pre-exist, they will just be selected. If not, the user will be able to create them.
 * @constructor
 */
const SourceOnPieceVersionForm = ({
  // sourceOnPieceVersions,
  // onAddSourcePieceVersions,
  onFormClose,
}: SourceOnPieceVersionFormProps) => {
  const { state, currentStepRank } = useSourceOnPieceVersionsForm();
  const currentStep = getStepByRank({ state, rank: currentStepRank });
  const StepFormComponent = currentStep.Component;

  return (
    <div>
      <SourceOnPieceVersionsSteps />
      {StepFormComponent ? (
        <StepFormComponent onFormClose={onFormClose} />
      ) : (
        <div>Nothing to show...</div>
      )}
      <div className="text-[0.6em]">
        <JsonView
          data={state}
          shouldExpandNode={allExpanded}
          style={darkStyles}
        />
      </div>
    </div>
  );
};

export default SourceOnPieceVersionForm;
