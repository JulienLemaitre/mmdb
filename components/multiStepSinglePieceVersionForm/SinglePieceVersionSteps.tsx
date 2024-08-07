import React from "react";
import {
  getAllStepStatus,
  getStepByRank,
  steps,
} from "@/components/multiStepSinglePieceVersionForm/stepsUtils";
import {
  updateSinglePieceVersionForm,
  useSinglePieceVersionForm,
} from "@/components/context/SinglePieceVersionFormContext";

const SinglePieceVersionSteps = () => {
  const { state, currentStepRank, lastCompletedStepRank, dispatch } =
    useSinglePieceVersionForm();
  const completedSteps = getAllStepStatus(state);
  const currentStep = getStepByRank({ state, rank: currentStepRank });
  const formSteps = steps[state.formInfo.formType];

  const goToStep = (stepRank: number) => {
    if (
      typeof lastCompletedStepRank === "number" &&
      stepRank <= lastCompletedStepRank + 1
    ) {
      updateSinglePieceVersionForm(dispatch, "goToStep", { stepRank });
    }
  };

  return (
    <div className="mb-4">
      <ul className="steps">
        {formSteps.map((step, index) => {
          // console.group(`STEP ${index}`);
          // console.log(`[] step.rank :`, step.rank);
          const stepClassName =
            step.rank === 0 ||
            (typeof lastCompletedStepRank === "number" &&
              step.rank <= lastCompletedStepRank + 1)
              ? "step-primary"
              : "";
          const setpBtnClassName =
            step.rank === (currentStepRank || 0) ? "btn-primary" : "btn-ghost";
          const isStepCompleted = completedSteps[step.rank];
          const isCurrentStep = currentStep.rank === step.rank;
          // console.log(`[] isStepCompleted :`, isStepCompleted);
          // console.log(`[] isCurrentStep :`, isCurrentStep);
          // console.groupEnd();
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
    </div>
  );
};

export default SinglePieceVersionSteps;
