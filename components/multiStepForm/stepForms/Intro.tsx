"use client";

import React from "react";
import QuestionMarkCircleIcon from "@/components/svg/QuestionMarkCircleIcon";
import {
  updateFeedForm,
  useFeedForm,
} from "@/components/context/feedFormContext";

const Intro = () => {
  const { dispatch } = useFeedForm();

  return (
    <div className="w-full prose">
      <h1>Registering new Metronome Marks</h1>
      <p>
        {`You will be guided through the process of registering new Metronome Marks. This involves several steps and notions that are explained at each steps.`}
      </p>
      <p>
        You can access the help section at any time clicking in the{" "}
        <label
          htmlFor="my-drawer-4"
          className="drawer-button btn btn-link h-auto min-h-fit px-0 align-bottom"
        >
          <QuestionMarkCircleIcon className="w-7 h-7" />
        </label>{" "}
        button in the header.
      </p>
      <button
        className="btn btn-primary"
        onClick={() =>
          updateFeedForm(dispatch, "formInfos", { introDone: true, next: true })
        }
      >
        Begin now!
      </button>
    </div>
  );
};

export default Intro;
