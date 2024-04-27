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

type SourcePieceVersionSelectFormProps = {
  sourcePieceVersions?: MMSourcePieceVersionsState[];
  onSubmit: (sourcePieceVersions: MMSourcePieceVersionsState[]) => void;
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

  return (
    <>
      {isFormOpen ? (
        <SourceOnPieceVersionForm onFormClose={onFormClose} />
      ) : (
        <>
          <ul className="my-4">
            {sourcePieceVersions.map((sourcePieceVersion, index) => (
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

      {!isFormOpen ? (
        <StepNavigation
          onClick={() => onSubmit(sourcePieceVersions)}
          isNextDisabled={!(sourcePieceVersions.length > 0 && !isFormOpen)}
          submitTitle={submitTitle}
        />
      ) : null}
    </>
  );
};

export default SourceOnPieceVersionFormContainer;
