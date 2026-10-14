import React from "react";
import { collectionFormSteps } from "@/features/feed/multiStepCollectionPieceVersionsForm/stepsUtils";
import {
  goToCollectionFormStep,
  useCollectionPieceVersionsForm,
} from "@/context/collectionPieceVersionForm/collectionPieceVersionsFormContext";

type CollectionPieceVersionsStepsProps = {
  shouldSkipComposerAndCollectionSteps: boolean;
};

const CollectionPieceVersionsSteps = ({
  shouldSkipComposerAndCollectionSteps,
}: CollectionPieceVersionsStepsProps) => {
  const { currentStepRank, lastCompletedStepRank, dispatch } =
    useCollectionPieceVersionsForm();

  const goToStep = (stepRank: number) => {
    if (
      typeof lastCompletedStepRank === "number" &&
      stepRank <= lastCompletedStepRank + 1
    ) {
      goToCollectionFormStep(dispatch, stepRank);
    }
  };

  // Skip the first two steps only while editing the original selected collection.
  const formSteps = collectionFormSteps.toSpliced(
    0,
    shouldSkipComposerAndCollectionSteps ? 2 : 0,
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
