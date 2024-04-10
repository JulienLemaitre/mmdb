import React, { useEffect, useState } from "react";
import {
  EditedSourceOnPieceVersionsState,
  useFeedForm,
} from "@/components/context/feedFormContext";
import { MMSourcePieceVersionsState } from "@/types/editFormTypes";
import ComposerSelectForm from "@/components/entities/composer/ComposerSelectForm";
import SourceOnPieceVersionsSteps from "@/components/multiStepSourcePieceVersionsForm/SourceOnPieceVersionsSteps";
import Loader from "@/components/Loader";
import { getCompletedSteps } from "@/components/multiStepSourcePieceVersionsForm/stepsUtils";
import { getStepByRank } from "@/components/multiStepSourcePieceVersionsForm/stepsUtils";
import { Person } from "@prisma/client";

type SourceOnPieceVersionFormProps = {
  sourceOnPieceVersions?: MMSourcePieceVersionsState[];
  onAddSourcePieceVersions: (
    sourceOnPieceVersions: MMSourcePieceVersionsState[],
  ) => void;
};

/**
 * This component will go throw the whole process of creating a sourceOnPieceVersion entity or a series of sourceOnPieceVersion entities.
 * If the composer, piece and pieceVersion pre-exist, they will just be selected. If not, the user will be able to create them.
 * @constructor
 */
const SourceOnPieceVersionForm = ({
  sourceOnPieceVersions,
  onAddSourcePieceVersions,
}: SourceOnPieceVersionFormProps) => {
  const [currentStepRank, setCurrentStepRank] = useState<number>(0);
  const { state } = useFeedForm();
  console.log(
    `[SourceOnPieceVersionForm] state.editedSourceOnPieceVersions :`,
    state.editedSourceOnPieceVersions,
  );

  const completedSteps = getCompletedSteps(state);
  const [hasComposer, isCollection] = completedSteps;
  console.log(`[SourceOnPieceVersionForm] [hasComposer, isCollection] :`, [
    hasComposer,
    isCollection,
  ]);

  const currentStep = getStepByRank(currentStepRank);
  const StepFormComponent = currentStep.Component;

  return (
    <div>
      <SourceOnPieceVersionsSteps
        completedSteps={completedSteps}
        currentStep={currentStep}
      />
      {StepFormComponent ? (
        <StepFormComponent />
      ) : (
        <div>Nothing to show...</div>
      )}
    </div>
  );
};

export default SourceOnPieceVersionForm;
