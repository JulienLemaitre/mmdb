import { MMSourcePieceVersionsState } from "@/types/formTypes";
import PlusIcon from "@/components/svg/PlusIcon";
import MMSourceFormStepNavigation from "@/components/multiStepMMSourceForm/MMSourceFormStepNavigation";
import SinglePieceVersionForm from "@/components/multiStepSinglePieceVersionForm/SinglePieceVersionForm";
import {
  getEntityByIdOrKey,
  updateFeedForm,
  useFeedForm,
} from "@/components/context/feedFormContext";
import {
  SourceOnPieceVersionsFormType,
  updateSourceOnPieceVersionsForm,
  useSourceOnPieceVersionsForm,
} from "@/components/context/SourceOnPieceVersionFormContext";
import TrashIcon from "@/components/svg/TrashIcon";
import QuestionMarkCircleIcon from "@/components/svg/QuestionMarkCircleIcon";
import CollectionPieceVersionForm from "@/components/multiStepCollectionPieceVersionsForm/CollectionPieceVersionForm";
import { SinglePieceVersionFormProvider } from "@/components/context/SinglePieceVersionFormContext";

type SourcePieceVersionSelectFormProps = {
  sourcePieceVersions?: MMSourcePieceVersionsState[];
  onSubmit: () => void;
  submitTitle?: string;
};

const SourceOnPieceVersionFormContainer = ({
  sourcePieceVersions = [],
  onSubmit,
  submitTitle,
}: SourcePieceVersionSelectFormProps) => {
  const { state: feedFormState, dispatch: feedFormDispatch } = useFeedForm();
  const {
    dispatch: dispatchSourceOnPieceVersionsForm,
    state: sourceOnPieceVersionsFormState,
  } = useSourceOnPieceVersionsForm();
  const isFormOpen = !!feedFormState.formInfo?.isSourceOnPieceVersionformOpen;
  const isIntro =
    feedFormState?.mMSourcePieceVersions?.length === 0 && !isFormOpen;
  const formType = sourceOnPieceVersionsFormState?.formInfo?.formType;

  const onFormOpen = (formType: SourceOnPieceVersionsFormType) => {
    updateSourceOnPieceVersionsForm(
      dispatchSourceOnPieceVersionsForm,
      "formInfo",
      { value: { formType } },
    );
    updateFeedForm(feedFormDispatch, "formInfo", {
      value: { isSourceOnPieceVersionformOpen: true },
    });
  };

  const onFormClose = () => {
    // reset sourceOnPieceVersionForm
    updateSourceOnPieceVersionsForm(dispatchSourceOnPieceVersionsForm, "init");
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
    // Delete new PieceVersion as well if exists
    updateFeedForm(feedFormDispatch, "pieceVersions", {
      deleteIdArray: [pieceVersionId],
    });
  };

  return (
    <>
      {isIntro ? (
        <div className="w-full prose">
          <h1>Pieces and Versions</h1>
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
      {isFormOpen && formType === "single" && (
        <SinglePieceVersionFormProvider>
          <SinglePieceVersionForm onFormClose={onFormClose} />
        </SinglePieceVersionFormProvider>
      )}
      {isFormOpen && formType === "collection" && (
        <CollectionPieceVersionForm onFormClose={onFormClose} />
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

              return (
                <li
                  key={`${index}-${sourcePieceVersion.pieceVersionId}-${sourcePieceVersion.rank}`}
                >
                  <div className="mt-6 flex gap-4 items-end w-full">
                    <div className="flex-grow">
                      <h4 className="text-lg font-bold text-secondary">
                        {`${sourcePieceVersion.rank} - ${piece.title}`}
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
        </>
      )}

      <MMSourceFormStepNavigation
        onClick={onSubmit}
        isNextDisabled={!(sourcePieceVersions.length > 0 && !isFormOpen)}
        submitTitle={submitTitle}
        onGoToPrevStep={onFormClose}
      />
    </>
  );
};

export default SourceOnPieceVersionFormContainer;
