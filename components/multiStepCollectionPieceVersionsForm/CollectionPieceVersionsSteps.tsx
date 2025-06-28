import React from "react";
import { collectionFormSteps } from "@/components/multiStepCollectionPieceVersionsForm/stepsUtils";
import {
  updateCollectionPieceVersionsForm,
  useCollectionPieceVersionsForm,
} from "@/components/context/CollectionPieceVersionsFormContext";

type CollectionPieceVersionsStepsProps = {
  hasCollectionJustBeenCreated: boolean;
  isUpdateMode: boolean;
};

const CollectionPieceVersionsSteps = ({
  hasCollectionJustBeenCreated,
  isUpdateMode,
}: CollectionPieceVersionsStepsProps) => {
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

  // skip the two first "composer" and "piece" steps if we are updating a selected existing collection
  const formSteps = collectionFormSteps.toSpliced(
    0,
    isUpdateMode && !hasCollectionJustBeenCreated ? 2 : 0,
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

export default CollectionPieceVersionsSteps;
