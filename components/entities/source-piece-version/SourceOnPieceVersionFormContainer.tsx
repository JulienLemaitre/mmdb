import React, { useState } from "react";
import { MMSourcePieceVersionsState } from "@/types/formTypes";
import PlusIcon from "@/components/svg/PlusIcon";
import StepNavigation from "@/components/multiStepMMSourceForm/StepNavigation";
import SourceOnPieceVersionForm from "@/components/multiStepSourcePieceVersionsForm/SourceOnPieceVersionForm";
import {
  updateFeedForm,
  useFeedForm,
} from "@/components/context/feedFormContext";
import ArrowLeftIcon from "@/components/svg/ArrowLeftIcon";
import {
  updateSourceOnPieceVersionsForm,
  useSourceOnPieceVersionsForm,
} from "@/components/context/SourceOnPieceVersionFormContext";

type SourcePieceVersionSelectFormProps = {
  sourcePieceVersions?: MMSourcePieceVersionsState[];
  onSubmit: (sourcePieceVersions: MMSourcePieceVersionsState[]) => void;
  submitTitle?: string;
  title?: string;
};

const SourceOnPieceVersionFormContainer = ({
  sourcePieceVersions,
  onSubmit,
  submitTitle,
  title,
}: SourcePieceVersionSelectFormProps) => {
  const [sourceOnPieceVersions, setSourceOnPieceVersions] = useState<
    MMSourcePieceVersionsState[]
  >(sourcePieceVersions || []);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { dispatch } = useFeedForm();
  const { dispatch: dispatchSourceOnPieceVersionsForm } =
    useSourceOnPieceVersionsForm();

  const onAddSourcePieceVersions = (
    sourcePieceVersions: MMSourcePieceVersionsState[],
  ) => {
    setSourceOnPieceVersions((prevList) => [
      ...prevList,
      ...sourcePieceVersions,
    ]);
    setIsFormOpen(false);
  };

  const onFormOpen = (formType: "single" | "collection") => {
    updateSourceOnPieceVersionsForm(
      dispatchSourceOnPieceVersionsForm,
      "formInfo",
      { value: { formType } },
    );
    updateFeedForm(dispatch, "formInfo", {
      value: { isSourceOnPieceVersionformOpen: true },
    });
    setIsFormOpen(true);
  };

  const onFormClose = () => {
    setIsFormOpen(false);
    updateFeedForm(dispatch, "formInfo", {
      value: { isSourceOnPieceVersionformOpen: false },
    });
  };

  return (
    <>
      <ul className="my-4">
        {sourceOnPieceVersions.map((sourcePieceVersion, index) => (
          <li
            key={`${index}-${sourcePieceVersion.pieceVersionId}-${sourcePieceVersion.rank}`}
          >
            <h4 className="mt-6 text-lg font-bold text-secondary">{`Piece ${
              index + 1
            }`}</h4>
            <div className="flex gap-3 items-center">
              <div className="font-bold">{`${sourcePieceVersion.rank}:`}</div>
              <div>{sourcePieceVersion.pieceVersionId}</div>
            </div>
          </li>
        ))}
      </ul>

      {isFormOpen ? (
        <SourceOnPieceVersionForm
          sourceOnPieceVersions={sourceOnPieceVersions}
          onAddSourcePieceVersions={onAddSourcePieceVersions}
          onFormClose={onFormClose}
        />
      ) : (
        <div className="flex gap-4 items-center mt-6">
          <button
            className="btn btn-accent"
            type="button"
            onClick={() => onFormOpen("single")}
          >
            <PlusIcon className="w-5 h-5" />
            Add a single piece
          </button>
          <button
            className="btn btn-accent"
            type="button"
            onClick={() => onFormOpen("collection")}
          >
            <PlusIcon className="w-5 h-5" />
            Add a complete collection
          </button>
        </div>
      )}

      {!isFormOpen ? (
        <StepNavigation
          onClick={() => onSubmit(sourceOnPieceVersions)}
          isNextDisabled={!(sourceOnPieceVersions.length > 0 && !isFormOpen)}
          submitTitle={submitTitle}
        />
      ) : null}
    </>
  );
};

export default SourceOnPieceVersionFormContainer;
