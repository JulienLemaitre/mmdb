import SourceDescriptionEditForm from "@/app/(signedIn)/edition/source-description/SourceDescriptionEditForm";
import { SourceDescriptionInput } from "@/types/editFormTypes";
import getSourceDescriptionStateFromInput from "@/utils/getSourceDescriptionStateFromInput";
import { updateFeedForm } from "@/components/context/feedFormContext";
import { useFeedForm } from "@/components/context/feedFormContext";
import { getStepByRank } from "@/components/multiStepForm/constants";

const MMSourceDescription = () => {
  const { dispatch, currentStepRank } = useFeedForm();
  const step = getStepByRank(currentStepRank);

  const onSubmit = async (data: SourceDescriptionInput) => {
    // Front input values validation is successful at this point.
    console.log("data", data);

    const sourceData = data;
    // Remove null values from sourceData
    Object.keys(sourceData).forEach(
      (key) => sourceData[key] == null && delete sourceData[key],
    );

    const sourceDescriptionState = getSourceDescriptionStateFromInput({
      ...sourceData,
      // pieceVersions: [state.pieceVersion.id],
    });

    sourceDescriptionState.isNew = true;
    sourceDescriptionState.next = true;
    console.log(
      "source description to be stored in state",
      sourceDescriptionState,
    );
    updateFeedForm(dispatch, "mMSourceDescription", sourceDescriptionState);
  };

  return (
    <SourceDescriptionEditForm onSubmit={onSubmit} submitTitle={step.title} />
  );
};

export default MMSourceDescription;
