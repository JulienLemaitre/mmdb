import React from "react";
import { URL_CREATE_SOURCE_DESCRIPTION } from "@/utils/routes";
import Link from "next/link";
import QuestionMarkCircleIcon from "@/components/svg/QuestionMarkCircleIcon";

const EditionPage = () => {
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
      <Link href={URL_CREATE_SOURCE_DESCRIPTION} className="btn btn-primary">
        Begin now!
      </Link>
    </div>
  );
};

export default EditionPage;
