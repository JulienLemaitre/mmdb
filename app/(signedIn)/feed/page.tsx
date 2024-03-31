"use client";

import React from "react";
import { useFeedForm } from "@/components/context/feedFormContext";
// import Loader from "@/components/Loader";
import { getStepByRank } from "@/components/multiStepForm/constants";

const FeedPage = () => {
  const { currentStepRank } = useFeedForm();
  const currentStep = getStepByRank(currentStepRank);
  const StepFormComponent = currentStep.Component;

  return StepFormComponent ? (
    <StepFormComponent />
  ) : (
    <div>Nothing to show...</div>
  );
};

export default FeedPage;
