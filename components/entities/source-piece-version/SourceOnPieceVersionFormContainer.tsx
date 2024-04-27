import { MMSourcePieceVersionsState } from "@/types/formTypes";
import PlusIcon from "@/components/svg/PlusIcon";
import StepNavigation from "@/components/multiStepMMSourceForm/StepNavigation";
import SourceOnPieceVersionForm from "@/components/multiStepSourcePieceVersionsForm/SourceOnPieceVersionForm";
import {
  updateFeedForm,
  useFeedForm,
} from "@/components/context/feedFormContext";
import {
  updateSourceOnPieceVersionsForm,
  useSourceOnPieceVersionsForm,
} from "@/components/context/SourceOnPieceVersionFormContext";
import TrashIcon from "@/components/svg/TrashIcon";

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
  const { state, dispatch } = useFeedForm();
  const { dispatch: dispatchSourceOnPieceVersionsForm } =
    useSourceOnPieceVersionsForm();
  const isFormOpen = !!state.formInfo?.isSourceOnPieceVersionformOpen;

  const onFormOpen = (formType: "single" | "collection") => {
    updateSourceOnPieceVersionsForm(
      dispatchSourceOnPieceVersionsForm,
      "formInfo",
      { value: { formType } },
    );
    updateFeedForm(dispatch, "formInfo", {
      value: { isSourceOnPieceVersionformOpen: true },
    });
  };

  const onFormClose = () => {
    // reset sourceOnPieceVersionForm
    updateSourceOnPieceVersionsForm(dispatchSourceOnPieceVersionsForm, "init");
    // Close sourceOnPieceVersions form
    updateFeedForm(dispatch, "formInfo", {
      value: { isSourceOnPieceVersionformOpen: false },
    });
  };

  const onDeletePieceVersionId = (pieceVersionId) => {
    updateFeedForm(dispatch, "mMSourcePieceVersions", {
      deleteIdArray: [pieceVersionId],
      idKey: "pieceVersionId",
    });
    // Delete new PieceVersion as well if exists
    updateFeedForm(dispatch, "pieceVersions", {
      deleteIdArray: [pieceVersionId],
    });
  };

  return (
    <>
      {isFormOpen ? (
        <SourceOnPieceVersionForm onFormClose={onFormClose} />
      ) : (
        <>
          <ul className="my-4 max-w-[65ch]">
            {sourcePieceVersions.map((sourcePieceVersion, index) => (
              <li
                key={`${index}-${sourcePieceVersion.pieceVersionId}-${sourcePieceVersion.rank}`}
              >
                <div className="mt-6 flex gap-4 items-end w-full">
                  <div className="flex-grow">
                    <h4 className="text-lg font-bold text-secondary">{`Piece ${sourcePieceVersion.rank}`}</h4>
                    <div className="flex gap-3 items-center">
                      <div>{sourcePieceVersion.pieceVersionId}</div>
                    </div>
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
            ))}
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
              disabled={true}
            >
              <PlusIcon className="w-5 h-5" />
              Add a complete collection
            </button>
          </div>
        </>
      )}

      {!isFormOpen ? (
        <StepNavigation
          onClick={onSubmit}
          isNextDisabled={!(sourcePieceVersions.length > 0 && !isFormOpen)}
          submitTitle={submitTitle}
        />
      ) : null}
    </>
  );
};

export default SourceOnPieceVersionFormContainer;
