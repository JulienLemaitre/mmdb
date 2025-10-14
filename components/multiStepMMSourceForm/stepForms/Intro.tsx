"use client";

import React from "react";
import QuestionMarkCircleIcon from "@/ui/svg/QuestionMarkCircleIcon";
import {
  updateFeedForm,
  useFeedForm,
} from "@/components/context/feedFormContext";

const Intro = () => {
  const { dispatch } = useFeedForm();

  return (
    <div className="w-full prose">
      <h1>Registering new data</h1>
      <p>
        {`You will be guided through the process of registering a new source of metronome marks. This involves several steps and concepts that are explained along the way.`}
      </p>
      <p>
        You can access the help section at any time by clicking the{" "}
        <label
          htmlFor="my-drawer-4"
          className="drawer-button btn btn-link h-auto min-h-fit px-0 align-bottom"
        >
          <QuestionMarkCircleIcon className="w-7 h-7" />
        </label>{" "}
        button at the top right of this page. You will find contextual help for
        each step and a general glossary of the terminology used on this
        website.
      </p>
      <p>Thank you for contributing!</p>
      <button
        className="btn btn-primary"
        onClick={() =>
          updateFeedForm(dispatch, "formInfo", {
            value: { introDone: true },
            next: true,
          })
        }
      >
        Begin now!
      </button>
    </div>
  );
};

export default Intro;
