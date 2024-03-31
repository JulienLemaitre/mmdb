import {
  updateFeedForm,
  useFeedForm,
} from "@/components/context/feedFormContext";

function StepNavigation(
  props: Readonly<{
    isSubmitBtn?: boolean;
    isSubmitting?: boolean;
    isNextDisabled?: boolean;
    submitTitle?: string;
    onClick?: () => void;
  }>,
) {
  const { isSubmitting, submitTitle, onClick, isSubmitBtn, isNextDisabled } =
    props;
  if (!isSubmitBtn && !onClick) {
    console.log(`[StepNavigation] SHOULD receive isSubmitBtn or onClick`);
  }
  const { dispatch } = useFeedForm();
  const goToPrevStep = () => {
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
        Previous
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

export default StepNavigation;
