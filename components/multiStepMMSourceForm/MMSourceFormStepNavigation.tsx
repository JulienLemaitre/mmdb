import {
  updateFeedForm,
  useFeedForm,
} from "@/components/context/feedFormContext";
import ArrowLeftIcon from "@/components/svg/ArrowLeftIcon";

export default function MMSourceFormStepNavigation(
  props: Readonly<{
    isSubmitBtn?: boolean;
    isSubmitting?: boolean;
    isNextDisabled?: boolean;
    submitTitle?: string;
    onClick?: () => void;
    onGoToPrevStep?: () => void;
  }>,
) {
  const {
    isSubmitting,
    submitTitle,
    onClick,
    onGoToPrevStep,
    isSubmitBtn,
    isNextDisabled,
  } = props;
  if (!isSubmitBtn && !onClick) {
    console.log(`[StepNavigation] SHOULD receive isSubmitBtn or onClick`);
  }
  const { dispatch } = useFeedForm();
  const goToPrevStep = () => {
    if (typeof onGoToPrevStep === "function") {
      onGoToPrevStep();
    }
    updateFeedForm(dispatch, "goToPrevStep", {});
  };

  return (
    <div className="flex gap-4 items-center mt-6">
      <button
        className="btn btn-neutral"
        type="button"
        disabled={isSubmitting}
        onClick={goToPrevStep}
      >
        <ArrowLeftIcon className="w-5 h-5 mr-2" />
        Back
      </button>
      <button
        className="btn btn-primary"
        {...(isSubmitBtn && { type: "submit" })}
        {...(typeof onClick === "function" && { onClick })}
        disabled={isNextDisabled || isSubmitting}
      >
        {submitTitle ? `Save ${submitTitle}` : "Next"}
      </button>
    </div>
  );
}
