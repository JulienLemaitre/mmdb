"use client";

import React from "react";
import {
  JsonView,
  allExpanded,
  darkStyles,
  defaultStyles,
} from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";
import {
  updateFeedForm,
  useFeedForm,
} from "@/components/context/feedFormContext";
import { steps } from "@/components/multiStepForm/constants";

const Steps = () => {
  const { currentStepRank, dispatch, lastCompletedStepRank, state } =
    useFeedForm();

  const goToStep = (stepRank: number) => {
    if (
      typeof lastCompletedStepRank === "number" &&
      stepRank <= lastCompletedStepRank + 1
    ) {
      updateFeedForm(dispatch, "goToStep", { stepRank });
    }
  };

  return (
    <>
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
      <div className="text-[0.6em]">
        <JsonView
          data={state}
          shouldExpandNode={allExpanded}
          style={darkStyles}
        />
      </div>
    </>
  );
};

export default Steps;
