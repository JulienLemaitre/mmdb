import {
  updateFeedForm,
  useFeedForm,
} from "@/components/context/feedFormContext";
import ArrowLeftIcon from "@/components/svg/ArrowLeftIcon";
import ResetIcon from "@/components/svg/ResetIcon";
// import DataLossWarningModal from "@/components/DataLossWarningModal";
import ArrowRightIcon from "@/components/svg/ArrowRightIcon";
import dynamic from "next/dynamic";

const DataLossWarningModal = dynamic(
  () => import("@/components/DataLossWarningModal"),
  { ssr: false },
);

export default function MMSourceFormStepNavigation(
  props: Readonly<{
    isNextDisabled?: boolean;
    isPresentFormDirty?: boolean;
    isSubmitting?: boolean;
    onGoToPrevStep?: () => void;
    onResetForm?: () => void;
    onSave?: () => void;
    onSaveAndGoToNextStep?: () => void;
    submitTitle?: string;
    dirtyFields?: any;
  }>,
) {
  const {
    isNextDisabled,
    isPresentFormDirty,
    isSubmitting,
    onGoToPrevStep,
    onResetForm,
    onSave,
    onSaveAndGoToNextStep,
    submitTitle,
    dirtyFields,
  } = props;

  if (!(onSave && onSaveAndGoToNextStep)) {
    console.log(
      `[StepNavigation] SHOULD receive onSave && onSaveAndGoToNextStep`,
    );
  }
  const { dispatch } = useFeedForm();
  const goToPrevStep = () => {
    if (typeof onGoToPrevStep === "function") {
      onGoToPrevStep();
    }
    updateFeedForm(dispatch, "goToPrevStep", {});
  };

  const onDataLossModalWarning = (modalId: string) => {
    //@ts-ignore => Daisy UI modal has an unconventional showModal method
    document?.getElementById(modalId)?.showModal();
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-4 items-center mt-6 w-full max-w-2xl">
        <button
          className={`btn btn-neutral`}
          type="button"
          disabled={isSubmitting || typeof onResetForm !== "function"}
          onClick={onResetForm}
        >
          <ResetIcon className="w-5 h-5 mr-2" />
          Reset changes
        </button>
        <button
          className="btn btn-primary"
          type="button"
          {...(typeof onSave === "function" && {
            onClick: onSave,
          })}
          disabled={
            isNextDisabled ||
            isSubmitting ||
            typeof onSave !== "function" ||
            !isPresentFormDirty
          }
        >
          {`Save${submitTitle ? ` ${submitTitle}` : ""}`}
        </button>
        <button
          className={`btn btn-neutral`}
          type="button"
          disabled={isSubmitting}
          onClick={
            isPresentFormDirty
              ? () => onDataLossModalWarning("prev-step-warning")
              : goToPrevStep
          }
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back
        </button>
        <button
          className="btn btn-primary"
          type="button"
          {...(typeof onSaveAndGoToNextStep === "function" && {
            onClick: onSaveAndGoToNextStep,
          })}
          disabled={isNextDisabled || isSubmitting}
        >
          Next step
          <ArrowRightIcon className="w-5 h-5 mr-2" />
        </button>
      </div>
      <DataLossWarningModal
        modalId="prev-step-warning"
        action={goToPrevStep}
        dirtyFields={dirtyFields}
      />
    </>
  );
}
