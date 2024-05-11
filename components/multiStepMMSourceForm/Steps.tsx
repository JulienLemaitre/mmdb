"use client";

import { JsonView, collapseAllNested, darkStyles } from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";
import {
  updateFeedForm,
  useFeedForm,
} from "@/components/context/feedFormContext";
import { steps } from "@/components/multiStepMMSourceForm/stepsUtils";

const Steps = () => {
  const { currentStepRank, dispatch, lastCompletedStepRank, state } =
    useFeedForm();
  const isDisabled = !!state.formInfo?.isSourceOnPieceVersionformOpen;

  const goToStep = (stepRank: number) => {
    if (
      !isDisabled &&
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
          let stepClassName =
            step.rank === 0 ||
            (typeof lastCompletedStepRank === "number" &&
              step.rank <= lastCompletedStepRank + 1)
              ? "step-primary"
              : "";
          let stepBtnClassName =
            step.rank === (currentStepRank || 0) ? "btn-primary" : "btn-ghost";
          if (isDisabled) {
            stepBtnClassName += " opacity-40 cursor-not-allowed";
            stepClassName = "step-disabled cursor-not-allowed";
          }
          return (
            <li className={`step ${stepClassName}`} key={step.title}>
              <div
                className={`step-title btn h-[50px] ${stepBtnClassName}`}
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
          shouldExpandNode={collapseAllNested}
          style={darkStyles}
        />
      </div>
    </>
  );
};

export default Steps;
