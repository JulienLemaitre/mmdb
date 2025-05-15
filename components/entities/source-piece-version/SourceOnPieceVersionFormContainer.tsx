import { useState } from "react";
import {
  MMSourcePieceVersionsState,
  SourceOnPieceVersionsFormType,
} from "@/types/formTypes";
import PlusIcon from "@/components/svg/PlusIcon";
import MMSourceFormStepNavigation from "@/components/multiStepMMSourceForm/MMSourceFormStepNavigation";
import SinglePieceVersionForm from "@/components/multiStepSinglePieceVersionForm/SinglePieceVersionForm";
import {
  getEntityByIdOrKey,
  updateFeedForm,
  useFeedForm,
} from "@/components/context/feedFormContext";
import TrashIcon from "@/components/svg/TrashIcon";
import QuestionMarkCircleIcon from "@/components/svg/QuestionMarkCircleIcon";
import { SinglePieceVersionFormProvider } from "@/components/context/SinglePieceVersionFormContext";
import { CollectionPieceVersionsFormProvider } from "@/components/context/CollectionPieceVersionsFormContext";
import getPersonName from "@/components/entities/person/utils/getPersonName";
import CollectionPieceVersionsForm from "@/components/multiStepCollectionPieceVersionsForm/CollectionPieceVersionsForm";

type SourcePieceVersionSelectFormProps = {
  sourcePieceVersions?: MMSourcePieceVersionsState[];
  onSubmit: (option: { goToNextStep: boolean }) => void;
  submitTitle?: string;
  title?: string;
};

const SourceOnPieceVersionFormContainer = ({
  sourcePieceVersions = [],
  onSubmit,
  submitTitle,
  title,
}: SourcePieceVersionSelectFormProps) => {
  const { state: feedFormState, dispatch: feedFormDispatch } = useFeedForm();
  const [formType, setFormType] =
    useState<SourceOnPieceVersionsFormType>("none");
  const isFormOpen = !!feedFormState.formInfo?.isSourceOnPieceVersionformOpen;
  const isIntro =
    feedFormState?.mMSourcePieceVersions?.length === 0 && !isFormOpen;

  const onFormOpen = (formType: "single" | "collection") => {
    setFormType(formType);
    updateFeedForm(feedFormDispatch, "formInfo", {
      value: { isSourceOnPieceVersionformOpen: true },
    });
  };

  const onFormClose = () => {
    // reset sourceOnPieceVersionForm
    setFormType("none");

    // Close sourceOnPieceVersions form
    updateFeedForm(feedFormDispatch, "formInfo", {
      value: { isSourceOnPieceVersionformOpen: false },
    });
  };

  const onDeletePieceVersionId = (pieceVersionId) => {
    updateFeedForm(feedFormDispatch, "mMSourcePieceVersions", {
      deleteIdArray: [pieceVersionId],
      idKey: "pieceVersionId",
    });

    // Delete all related metronomeMarks if exists
    updateFeedForm(feedFormDispatch, "metronomeMarks", {
      deleteIdArray: [pieceVersionId],
      idKey: "pieceVersionId",
    });

    // Delete new PieceVersion as well if exists
    updateFeedForm(feedFormDispatch, "pieceVersions", {
      deleteIdArray: [pieceVersionId],
    });
  };

  return (
    <>
      {isIntro ? (
        <div className="w-full prose">
          <h1>{title}</h1>
          <p>
            {`In this section you will describe, in order, the pieces that are part of your MM Source.`}
          </p>
          <p>
            If your source contains a complete <i>collection</i> of pieces, like
            a complete opus, choose the corresponding option below and you will
            be guided to describe this collection and its pieces.
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
      ) : null}
      {isFormOpen && (
        <>
          <h1 className="mb-4 text-4xl font-bold">{title}</h1>
          {formType === "single" && (
            <SinglePieceVersionFormProvider>
              <SinglePieceVersionForm onFormClose={onFormClose} />
            </SinglePieceVersionFormProvider>
          )}
          {formType === "collection" && (
            <CollectionPieceVersionsFormProvider>
              <CollectionPieceVersionsForm onFormClose={onFormClose} />
            </CollectionPieceVersionsFormProvider>
          )}
          <div className="grid grid-cols-2 gap-4 items-center mt-6 w-full max-w-2xl">
            <button
              className="btn btn-accent"
              type="button"
              onClick={() => onFormClose()}
            >
              <TrashIcon className="w-5 h-5" />
              {`Discard this ${formType === "single" ? "piece" : "collection"}`}
            </button>
          </div>
        </>
      )}
      {!isFormOpen && (
        <>
          <ul className="my-4 max-w-[65ch]">
            {sourcePieceVersions.map((sourcePieceVersion, index) => {
              const pieceVersion = getEntityByIdOrKey(
                feedFormState,
                "pieceVersions",
                sourcePieceVersion.pieceVersionId,
              );
              const piece = getEntityByIdOrKey(
                feedFormState,
                "pieces",
                pieceVersion.pieceId,
              );
              const collection = getEntityByIdOrKey(
                feedFormState,
                "collections",
                piece.collectionId,
              );
              const composer = getEntityByIdOrKey(
                feedFormState,
                "persons",
                piece.composerId,
              );
              console.log({ piece, composer });

              return (
                <li
                  key={`${index}-${sourcePieceVersion.pieceVersionId}-${sourcePieceVersion.rank}`}
                >
                  <div className="mt-6 flex gap-4 items-end w-full">
                    <div className="flex-grow">
                      {collection ? (
                        <div className="text-sm">{collection.title}</div>
                      ) : null}
                      <h4 className="text-lg font-bold text-secondary">
                        {`${sourcePieceVersion.rank} - ${piece.title}${!!composer && ` | ${getPersonName(composer)}`}`}
                      </h4>
                    </div>
                    <div>
                      <button
                        type="button"
                        className="btn btn-sm btn-neutral hover:btn-error"
                        onClick={() =>
                          onDeletePieceVersionId(
                            sourcePieceVersion.pieceVersionId,
                          )
                        }
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

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
          <MMSourceFormStepNavigation
            onSave={() => onSubmit({ goToNextStep: false })}
            onSaveAndGoToNextStep={() => onSubmit({ goToNextStep: true })}
            isNextDisabled={!(sourcePieceVersions.length > 0 && !isFormOpen)}
            submitTitle={submitTitle}
            onGoToPrevStep={onFormClose}
          />
        </>
      )}
    </>
  );
};

export default SourceOnPieceVersionFormContainer;
