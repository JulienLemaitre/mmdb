import { updateFeedForm, useFeedForm } from "@/context/feedFormContext";
import { getStepByRank } from "@/features/feed/multiStepMMSourceForm/stepsUtils";
import SourceOnPieceVersionFormContainer from "@/features/feed/multiStepMMSourceForm/components/SourceOnPieceVersionFormContainer";

const MMSourceOnPieceVersions = () => {
  const { dispatch, currentStepRank, state } = useFeedForm();
  const step = getStepByRank(currentStepRank);

  const onSubmit = (option: { goToNextStep: boolean }) => {
    updateFeedForm(dispatch, "formInfo", {
      value: { allSourceOnPieceVersionsDone: true },
      next: option.goToNextStep,
    });
  };

  return (
    <SourceOnPieceVersionFormContainer
      mMSourceOnPieceVersions={state.mMSourceOnPieceVersions}
      onSubmit={onSubmit}
      title={step.title}
      submitTitle={step.title}
    />
  );
};

export default MMSourceOnPieceVersions;
