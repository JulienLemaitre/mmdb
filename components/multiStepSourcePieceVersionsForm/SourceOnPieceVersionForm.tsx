import SourceOnPieceVersionsSteps from "@/components/multiStepSourcePieceVersionsForm/SourceOnPieceVersionsSteps";
import { getStepByRank } from "@/components/multiStepSourcePieceVersionsForm/stepsUtils";
import { useSourceOnPieceVersionsForm } from "@/components/context/SourceOnPieceVersionFormContext";
import React from "react";
import DebugBox from "@/components/DebugBox";

type SourceOnPieceVersionFormProps = {
  onFormClose: () => void;
};

/**
 * This component will go throw the whole process of creating a sourceOnPieceVersion entity or a series of sourceOnPieceVersion entities.
 * If the composer, piece and pieceVersion pre-exist, they will just be selected. If not, the user will be able to create them.
 * @constructor
 */
const SourceOnPieceVersionForm = ({
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
      <DebugBox stateObject={state} />
    </div>
  );
};

export default SourceOnPieceVersionForm;
