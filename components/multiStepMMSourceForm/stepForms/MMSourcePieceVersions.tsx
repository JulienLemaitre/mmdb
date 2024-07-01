import {
  updateFeedForm,
  useFeedForm,
} from "@/components/context/feedFormContext";
import { getStepByRank } from "@/components/multiStepMMSourceForm/stepsUtils";
import SourceOnPieceVersionFormContainer from "@/components/entities/source-piece-version/SourceOnPieceVersionFormContainer";

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
    <SourceOnPieceVersionFormContainer
      sourcePieceVersions={state.mMSourcePieceVersions}
      onSubmit={onSubmit}
      submitTitle={step.title}
    />
  );
};

export default MMSourcePieceVersions;
