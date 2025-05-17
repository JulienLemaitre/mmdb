import {
  updateFeedForm,
  useFeedForm,
} from "@/components/context/feedFormContext";
import { getStepByRank } from "@/components/multiStepMMSourceForm/stepsUtils";
import SourceOnPieceVersionFormContainer from "@/components/entities/source-piece-version/SourceOnPieceVersionFormContainer";

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
      sourcePieceVersions={state.mMSourcePieceVersions}
      onSubmit={onSubmit}
      title={step.title}
      submitTitle={step.title}
    />
  );
};

export default MMSourcePieceVersions;
