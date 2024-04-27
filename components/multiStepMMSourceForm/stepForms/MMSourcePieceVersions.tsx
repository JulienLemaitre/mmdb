import {
  updateFeedForm,
  useFeedForm,
} from "@/components/context/feedFormContext";
import QuestionMarkCircleIcon from "@/components/svg/QuestionMarkCircleIcon";
import { getStepByRank } from "@/components/multiStepMMSourceForm/stepsUtils";
import SourceOnPieceVersionFormContainer from "@/components/entities/source-piece-version/SourceOnPieceVersionFormContainer";
import { SourceOnPieceVersionsFormProvider } from "@/components/context/SourceOnPieceVersionFormContext";

const MMSourcePieceVersions = () => {
  const { dispatch, currentStepRank, state } = useFeedForm();
  const step = getStepByRank(currentStepRank);

  const onSubmit = () => {
    updateFeedForm(dispatch, "formInfo", {
      value: { allSourcePieceVersionsDone: true },
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
          If your source contains a complete <i>collection</i> of pieces, like a
          complete opus, choose the corresponding option below and you will be
          guided to describe this collection and its pieces.
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
      <SourceOnPieceVersionsFormProvider>
        <SourceOnPieceVersionFormContainer
          sourcePieceVersions={state.mMSourcePieceVersions}
          onSubmit={onSubmit}
          submitTitle={step.title}
        />
      </SourceOnPieceVersionsFormProvider>
    </>
  );
};

export default MMSourcePieceVersions;
