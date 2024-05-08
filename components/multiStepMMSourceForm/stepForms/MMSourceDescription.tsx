import SourceDescriptionEditForm from "@/components/entities/source-description/SourceDescriptionEditForm";
import { SourceDescriptionInput } from "@/types/formTypes";
import getSourceDescriptionStateFromInput from "@/utils/getSourceDescriptionStateFromInput";
import { updateFeedForm } from "@/components/context/feedFormContext";
import { useFeedForm } from "@/components/context/feedFormContext";
import { getStepByRank } from "@/components/multiStepMMSourceForm/stepsUtils";
import getSourceDescriptionInputFromState from "@/utils/getSourceDescriptionInputFromState";

const MMSourceDescription = () => {
  const { dispatch, currentStepRank, state } = useFeedForm();
  const step = getStepByRank(currentStepRank);

  const onSubmit = async (data: SourceDescriptionInput) => {
    // Front input values validation is successful at this point.
    console.log("data", data);

    const sourceData = data;
    // Remove null values from sourceData
    Object.keys(sourceData).forEach(
      // '== null' is true for undefined AND null values
      (key) => sourceData[key] == null && delete sourceData[key],
    );

    const sourceDescriptionState = getSourceDescriptionStateFromInput({
      ...sourceData,
      // pieceVersions: [state.pieceVersion.id],
    });

    sourceDescriptionState.isNew = true;
    console.log(
      "source description to be stored in state",
      sourceDescriptionState,
    );
    updateFeedForm(dispatch, "mMSourceDescription", {
      value: sourceDescriptionState,
      next: true,
    });
  };

  const sourceDescriptionInput = getSourceDescriptionInputFromState(
    state?.mMSourceDescription,
  );

  return (
    <SourceDescriptionEditForm
      onSubmit={onSubmit}
      submitTitle={step.title}
      sourceDescription={sourceDescriptionInput}
      title={step.title}
    />
  );
};

export default MMSourceDescription;
