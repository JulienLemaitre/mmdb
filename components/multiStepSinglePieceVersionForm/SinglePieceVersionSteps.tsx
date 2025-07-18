import React from "react";
import { singlePieceFormSteps } from "@/components/multiStepSinglePieceVersionForm/stepsUtils";
import {
  updateSinglePieceVersionForm,
  useSinglePieceVersionForm,
} from "@/components/context/SinglePieceVersionFormContext";

type SinglePieceVersionStepsProps = {
  isCollectionMode?: boolean;
  isPreexistingCollectionEdit?: boolean;
};

const SinglePieceVersionSteps = ({
  isCollectionMode,
  isPreexistingCollectionEdit,
}: SinglePieceVersionStepsProps) => {
  const { currentStepRank, lastCompletedStepRank, dispatch } =
    useSinglePieceVersionForm();

  const goToStep = (stepRank: number) => {
    if (
      typeof lastCompletedStepRank === "number" &&
      stepRank <= lastCompletedStepRank + 1
    ) {
      updateSinglePieceVersionForm(dispatch, "goToStep", { stepRank });
    }
  };

  // skip the first "composer" step if we are in collectionMode, "composer" AND "piece" if isPreexistingCollectionEdit
  const formSteps = singlePieceFormSteps.toSpliced(
    0,
    isPreexistingCollectionEdit ? 2 : isCollectionMode ? 1 : 0,
  );

  return (
    <div className="mb-4">
      <ul className="steps">
        {formSteps.map((step) => {
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
                className={`step-title btn btn-sm ${setpBtnClassName}`}
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
