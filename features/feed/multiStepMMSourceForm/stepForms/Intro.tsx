"use client";

import React from "react";
import QuestionMarkCircleIcon from "@/ui/svg/QuestionMarkCircleIcon";
import { updateFeedForm, useFeedForm } from "@/context/feedFormContext";

const Intro = () => {
  const { dispatch } = useFeedForm();

  return (
    <div className="w-full prose prose-a:text-primary prose-a:hover:text-primary/70">
      <h1>Registering new data</h1>
      <p>
        {`You will be guided through the process of registering a new source of metronome marks. This involves several steps and concepts that are explained along the way.`}
      </p>
      <p className="mb-0.5">
        {`Two in-depth tutorials are available to familiarize yourself with the whole process, and to serve as reference:`}
      </p>
      <ul>
        <li>
          A{" "}
          <a
            className="link link-secondary"
            href="/pdf/MM_Database_User_Guide_V3.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            PDF guide
          </a>
        </li>
        <li>
          A{" "}
          <a
            className="link link-primary"
            href="https://www.youtube.com/watch?v=27UqZXgnqvU"
            target="_blank"
            rel="noopener noreferrer"
          >
            video tutorial
          </a>
        </li>
      </ul>
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
