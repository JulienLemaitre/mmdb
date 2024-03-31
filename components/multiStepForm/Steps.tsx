"use client";

import React from "react";
import { useFeedForm } from "@/components/context/feedFormContext";
import { steps } from "@/components/multiStepForm/constants";

const Steps = () => {
  const {
    state,
    dispatch,
    lastCompletedStepId,
    nextStepToCompleteId,
    currentStepRank,
  } = useFeedForm();
  console.log(`[Steps] :`, {
    state,
    dispatch,
    lastCompletedStepId,
    nextStepId: nextStepToCompleteId,
  });

  return (
    <ul className="steps steps-vertical bg-base">
      {steps.map((step) => {
        const stepClassName =
          step.rank <= (currentStepRank || 0) ? "step-primary" : "";
        const setpBtnClassName =
          step.rank === (currentStepRank || 0) ? "btn-primary" : "btn-ghost";
        return (
          <li className={`step ${stepClassName}`} key={step.title}>
            <div className={`step-title btn h-[50px] ${setpBtnClassName}`}>
              {step.title}
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default Steps;
