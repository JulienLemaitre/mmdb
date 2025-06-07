import { useState } from "react";
import {
  MMSourcePieceVersionsState,
  SourceOnPieceVersionsFormType,
} from "@/types/formTypes";
import PlusIcon from "@/components/svg/PlusIcon";
import MMSourceFormStepNavigation from "@/components/multiStepMMSourceForm/MMSourceFormStepNavigation";
import SinglePieceVersionFormContainer from "@/components/multiStepSinglePieceVersionForm/SinglePieceVersionFormContainer";
import {
  getEntityByIdOrKey,
  updateFeedForm,
  useFeedForm,
} from "@/components/context/feedFormContext";
import TrashIcon from "@/components/svg/TrashIcon";
import QuestionMarkCircleIcon from "@/components/svg/QuestionMarkCircleIcon";
import {
  SinglePieceVersionFormProvider,
  SinglePieceVersionFormState,
} from "@/components/context/SinglePieceVersionFormContext";
import { CollectionPieceVersionsFormProvider } from "@/components/context/CollectionPieceVersionsFormContext";
import getPersonName from "@/components/entities/person/utils/getPersonName";
import CollectionPieceVersionsFormContainer from "@/components/multiStepCollectionPieceVersionsForm/CollectionPieceVersionsFormContainer";
import EditIcon from "@/components/svg/EditIcon";
import dynamic from "next/dynamic";

type SourcePieceVersionSelectFormProps = {
  mMSourcePieceVersions?: MMSourcePieceVersionsState[];
  onSubmit: (option: { goToNextStep: boolean }) => void;
  submitTitle?: string;
  title?: string;
};

const needConfirmationModalId = "need-confirmation-modal";
const NeedConfirmationModal = dynamic(
  () => import("@/components/NeedConfirmationModal"),
  { ssr: false },
);

const SourceOnPieceVersionFormContainer = ({
  mMSourcePieceVersions = [],
  onSubmit,
  submitTitle,
  title,
}: SourcePieceVersionSelectFormProps) => {
  const { state: feedFormState, dispatch: feedFormDispatch } = useFeedForm();
  const [formType, setFormType] =
    useState<SourceOnPieceVersionsFormType>("none");
  const [editionInitState, setEditionInitState] =
    useState<SinglePieceVersionFormState | null>(null);
  const isEditMode = !!editionInitState;
  const isFormOpen = !!feedFormState.formInfo?.isSourceOnPieceVersionformOpen;
  const isIntro =
    feedFormState?.mMSourcePieceVersions?.length === 0 && !isFormOpen;

  // For needConfirmation modal
  const [pieceVersionToDiscardId, setPieceVersionToDiscardId] = useState<
    string | null
  >();
  const isConfirmationModalOpened = !!pieceVersionToDiscardId;

  const onFormOpen = (formType: "single" | "collection") => {
    setFormType(formType);
    updateFeedForm(feedFormDispatch, "formInfo", {
      value: { isSourceOnPieceVersionformOpen: true },
    });
  };

  const onFormClose = () => {
    // reset sourceOnPieceVersionForm and editionInitState
    setFormType("none");
    setEditionInitState(null);

    // Close sourceOnPieceVersions form
    updateFeedForm(feedFormDispatch, "formInfo", {
      value: { isSourceOnPieceVersionformOpen: false },
    });
  };

  const onEditMMSourcePieceVersion = (
    mmSourceOnPieceVersion: MMSourcePieceVersionsState,
  ) => {
    const { pieceVersionId, rank } = mmSourceOnPieceVersion;

    // Build singlePieceVersionFormState
    const pieceVersion = getEntityByIdOrKey(
      feedFormState,
      "pieceVersions",
      pieceVersionId,
    );
    const piece = getEntityByIdOrKey(
      feedFormState,
      "pieces",
      pieceVersion.pieceId,
    );
    const composer = getEntityByIdOrKey(
      feedFormState,
      "persons",
      piece.composerId,
    );

    const singlePieceVersionFormEditState: SinglePieceVersionFormState = {
      formInfo: {
        currentStepRank: 0,
        mMSourcePieceVersionRank: rank,
      },
      composer: {
        id: composer.id,
      },
      piece: {
        id: piece.id,
      },
      pieceVersion: {
        id: pieceVersion.id,
      },
    };
    setEditionInitState(singlePieceVersionFormEditState);
    onFormOpen("single");
  };
  const onDeletePieceVersionInit = (pieceVersionId: string) => {
    setPieceVersionToDiscardId(pieceVersionId);
  };
  const onDeletePieceVersionId = (pieceVersionId) => {
    updateFeedForm(feedFormDispatch, "mMSourcePieceVersions", {
      deleteIdArray: [pieceVersionId],
      idKey: "pieceVersionId",
    });
    setPieceVersionToDiscardId(null);
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
            <SinglePieceVersionFormProvider initialState={editionInitState}>
              <SinglePieceVersionFormContainer
                onFormClose={onFormClose}
                isEditMode={isEditMode}
              />
            </SinglePieceVersionFormProvider>
          )}
          {formType === "collection" && (
            <CollectionPieceVersionsFormProvider>
              <CollectionPieceVersionsFormContainer onFormClose={onFormClose} />
            </CollectionPieceVersionsFormProvider>
          )}
          <div className="grid grid-cols-2 gap-4 items-center mt-6 w-full max-w-2xl">
            <button
              className="btn btn-accent"
              type="button"
              onClick={() => onFormClose()}
            >
              <TrashIcon className="w-5 h-5" />
              {`${isEditMode ? `Cancel updating ` : "Discard"} this ${formType === "single" ? "piece" : "whole collection"}`}
            </button>
          </div>
        </>
      )}
      {!isFormOpen && (
        <>
          {!isIntro && <h1 className="mb-4 text-4xl font-bold">{title}</h1>}
          <ul className="my-4 max-w-[65ch]">
            {mMSourcePieceVersions.map((mMSourcePieceVersion, index) => {
              const pieceVersion = getEntityByIdOrKey(
                feedFormState,
                "pieceVersions",
                mMSourcePieceVersion.pieceVersionId,
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

              return (
                <li
                  key={`${index}-${mMSourcePieceVersion.pieceVersionId}-${mMSourcePieceVersion.rank}`}
                >
                  <div className="mt-6 flex gap-4 items-end w-full">
                    <div className="flex-grow">
                      {collection ? (
                        <div className="text-sm">{collection.title}</div>
                      ) : null}
                      <h4 className="text-lg font-bold text-secondary">
                        {`${mMSourcePieceVersion.rank} - ${piece.title}${!!composer && ` | ${getPersonName(composer)}`}`}
                      </h4>
                    </div>
                    <div>
                      <button
                        type="button"
                        className="btn btn-sm btn-neutral hover:btn-accent"
                        onClick={() =>
                          onEditMMSourcePieceVersion(mMSourcePieceVersion)
                        }
                      >
                        <EditIcon className="w-4 h-4" />
                      </button>
                    </div>
                    <div>
                      <button
                        type="button"
                        className="btn btn-sm btn-neutral hover:btn-error"
                        onClick={() =>
                          onDeletePieceVersionInit(
                            mMSourcePieceVersion.pieceVersionId,
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
            isNextDisabled={!(mMSourcePieceVersions.length > 0 && !isFormOpen)}
            submitTitle={submitTitle}
            onGoToPrevStep={onFormClose}
          />
          <NeedConfirmationModal
            modalId={needConfirmationModalId}
            onConfirm={() => onDeletePieceVersionId(pieceVersionToDiscardId)}
            onCancel={() => setPieceVersionToDiscardId(null)}
            description={`Delete a piece version from the source`}
            isOpened={isConfirmationModalOpened}
          />
        </>
      )}
    </>
  );
};

export default SourceOnPieceVersionFormContainer;
