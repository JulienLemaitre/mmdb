"use client";

import React from "react";
import { useFeedForm } from "@/components/context/feedFormContext";
import { steps } from "@/components/multiStepForm/constants";

const Steps = () => {
  const { state } = useFeedForm();
  console.log(`[Steps] state :`, state);
  return (
    <ul className="steps steps-vertical">
      {steps.map((step) => (
        <li className="step step-primary" key={step.title}>
          <div className="step-title btn h-[50px]">{step.title}</div>
        </li>
      ))}
    </ul>
  );
};

export default Steps;
