"use client";

import { useFeedForm } from "@/context/feedFormContext";
import { getStepByRank } from "@/features/feed/multiStepMMSourceForm/stepsUtils";

const MMSourceForm = () => {
  const { currentStepRank } = useFeedForm();
  const currentStep = getStepByRank(currentStepRank);
  const StepFormComponent = currentStep.Component;

  return StepFormComponent ? (
    <StepFormComponent />
  ) : (
    <div>Oops, something went wrong...</div>
  );
};

export default MMSourceForm;
