import SourceDescriptionEditForm from "@/features/sourceDescription/SourceDescriptionEditForm";
import { SourceDescriptionInput } from "@/types/formTypes";
import getMMSourceDescriptionStateFromInput from "@/utils/getMMSourceDescriptionStateFromInput";
import { updateFeedForm } from "@/context/feedFormContext";
import { useFeedForm } from "@/context/feedFormContext";
import { getStepByRank } from "@/features/feed/multiStepMMSourceForm/stepsUtils";
import getMMSourceDescriptionInputFromState from "@/utils/getMMSourceDescriptionInputFromState";

const MMSourceDescription = () => {
  const { dispatch, currentStepRank, state } = useFeedForm();
  const step = getStepByRank(currentStepRank);

  const onSubmit = async (
    data: SourceDescriptionInput,
    option?: { goToNextStep: boolean },
  ) => {
    // Front input values validation is successful at this point.

    const { noDate: _noDate, ...sourceData } = data;
    // Remove null/undefined values from sourceData, but keep year: null
    // (optional publication year is a valid persisted value).
    Object.keys(sourceData).forEach((key) => {
      if (key === "year") return;
      // '== null' is true for undefined AND null values
      if (sourceData[key as keyof typeof sourceData] == null) {
        delete sourceData[key as keyof typeof sourceData];
      }
    });

    const sourceDescriptionState = getMMSourceDescriptionStateFromInput({
      ...sourceData,
    });
    sourceDescriptionState.isNew = true;
    updateFeedForm(dispatch, "mMSourceDescription", {
      value: sourceDescriptionState,
      next: !!option?.goToNextStep,
    });

    if (!option?.goToNextStep) {
      return sourceDescriptionState;
    }
  };

  const sourceDescriptionInput = getMMSourceDescriptionInputFromState(
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
