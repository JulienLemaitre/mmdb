import { updateFeedForm, useFeedForm } from "@/context/feedFormContext";
import { getStepByRank } from "@/features/feed/multiStepMMSourceForm/stepsUtils";
import SourceOnPieceVersionFormContainer from "@/features/sourceOnPieceVersion/SourceOnPieceVersionFormContainer";

const MMSourcePieceVersions = () => {
  const { dispatch, currentStepRank, state } = useFeedForm();
  const step = getStepByRank(currentStepRank);

  const onSubmit = (option: { goToNextStep: boolean }) => {
    updateFeedForm(dispatch, "formInfo", {
      value: { allSourcePieceVersionsDone: true },
      next: option.goToNextStep,
    });
  };

  return (
    <SourceOnPieceVersionFormContainer
      mMSourcePieceVersions={state.mMSourcePieceVersions}
      onSubmit={onSubmit}
      title={step.title}
      submitTitle={step.title}
    />
  );
};

export default MMSourcePieceVersions;
