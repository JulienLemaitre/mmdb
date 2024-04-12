import React, { useState } from "react";
import {
  updateFeedForm,
  useFeedForm,
} from "@/components/context/feedFormContext";
import QuestionMarkCircleIcon from "@/components/svg/QuestionMarkCircleIcon";
import { getStepByRank } from "@/components/multiStepMMSourceForm/stepsUtils";
import { MMSourcePieceVersionsState } from "@/types/editFormTypes";
import SourceOnPieceVersionFormContainer from "@/components/entities/source-piece-version/SourceOnPieceVersionFormContainer";

const MMSourcePieceVersions = () => {
  const { dispatch, currentStepRank, state } = useFeedForm();
  const step = getStepByRank(currentStepRank);

  const onSubmit = (sourceOnPieceVersions: MMSourcePieceVersionsState[]) => {
    updateFeedForm(dispatch, "mMSourcePieceVersions", {
      array: sourceOnPieceVersions,
      next: true,
    });
  };

  return (
    <>
      <div className="w-full prose">
        <h1>Pieces and Versions</h1>
        <p>
          {`In this section you will describe, in order, the pieces that are part of your MM Source.`}
        </p>
        <p>
          You can access the help section at any time clicking in the{" "}
          <label
            htmlFor="my-drawer-4"
            className="drawer-button btn btn-link h-auto min-h-fit px-0 align-bottom"
          >
            <QuestionMarkCircleIcon className="w-7 h-7" />
          </label>{" "}
          button here or in the header.
        </p>
      </div>
      <SourceOnPieceVersionFormContainer
        sourcePieceVersions={state.mMSourcePieceVersions}
        onSubmit={onSubmit}
        title={step.title}
        submitTitle={step.title}
      />
    </>
  );
};

export default MMSourcePieceVersions;
