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
    <SourceOnPieceVersionsFormProvider>
      <SourceOnPieceVersionFormContainer
        sourcePieceVersions={state.mMSourcePieceVersions}
        onSubmit={onSubmit}
        submitTitle={step.title}
      />
    </SourceOnPieceVersionsFormProvider>
  );
};

export default MMSourcePieceVersions;
