import React from "react";
import { collectionFormSteps } from "@/components/multiStepCollectionPieceVersionsForm/stepsUtils";
import {
  updateCollectionPieceVersionsForm,
  useCollectionPieceVersionsForm,
} from "@/components/context/CollectionPieceVersionsFormContext";

const CollectionPieceVersionsSteps = () => {
  const { currentStepRank, lastCompletedStepRank, dispatch } =
    useCollectionPieceVersionsForm();

  const goToStep = (stepRank: number) => {
    if (
      typeof lastCompletedStepRank === "number" &&
      stepRank <= lastCompletedStepRank + 1
    ) {
      updateCollectionPieceVersionsForm(dispatch, "goToStep", { stepRank });
    }
  };

  return (
    <div className="mb-4">
      <ul className="steps">
        {collectionFormSteps.map((step, index) => {
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

export default CollectionPieceVersionsSteps;
