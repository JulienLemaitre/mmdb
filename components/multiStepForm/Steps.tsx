"use client";

import React from "react";
import {
  updateFeedForm,
  useFeedForm,
} from "@/components/context/feedFormContext";
import { steps } from "@/components/multiStepForm/constants";

const Steps = () => {
  const { currentStepRank, dispatch, lastCompletedStepRank } = useFeedForm();

  const goToStep = (stepRank: number) => {
    console.log(`[goToStep] Going to step ${stepRank}`);
    console.log(`[] lastCompletedStepRank :`, lastCompletedStepRank);
    if (
      typeof lastCompletedStepRank === "number" &&
      stepRank <= lastCompletedStepRank + 1
    ) {
      updateFeedForm(dispatch, "goToStep", { stepRank });
    }
  };

  return (
    <ul className="steps steps-vertical bg-base">
      {steps.map((step) => {
        const stepClassName =
          step.rank === 0 ||
          (typeof lastCompletedStepRank === "number" &&
            step.rank <= lastCompletedStepRank + 1)
            ? "step-primary"
            : "";
        const setpBtnClassName =
          step.rank === (currentStepRank || 0) ? "btn-primary" : "btn-ghost";
        return (
          <li className={`step ${stepClassName}`} key={step.title}>
            <div
              className={`step-title btn h-[50px] ${setpBtnClassName}`}
              onClick={() => goToStep(step.rank)}
            >
              {step.title}
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default Steps;
