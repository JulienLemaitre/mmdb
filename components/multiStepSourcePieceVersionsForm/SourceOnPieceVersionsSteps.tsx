import React from "react";
import { steps } from "@/components/multiStepSourcePieceVersionsForm/stepsUtils";

const SourceOnPieceVersionsSteps = ({ completedSteps, currentStep }) => {
  return (
    <div>
      <ul className="steps">
        {steps.map((step, index) => (
          <li
            key={step.id}
            className={`step${completedSteps[step.rank] === true ? " step-primary" : ""}`}
          >
            {step.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SourceOnPieceVersionsSteps;
