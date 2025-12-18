import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { SectionStateExtendedForMMForm } from "@/types/formTypes";
import { zodResolver } from "@hookform/resolvers/zod";
import MetronomeMarkArray from "@/features/metronomeMark/form/MetronomeMarkArray";
import { z } from "zod";
import { updateFeedForm, useFeedForm } from "@/context/feedFormContext";
import getMetronomeMarkInputFromState from "@/utils/getMetronomeMarksInputFromState";
import getMetronomeMarkStateFromInput from "@/utils/getMetronomeMarkStateFromInput";
import { ONE_MM_REQUIRED } from "@/utils/constants";
import preventEnterKeySubmission from "@/utils/preventEnterKeySubmission";
import MMSourceFormStepNavigation from "@/features/feed/multiStepMMSourceForm/MMSourceFormStepNavigation";
import checkAreFieldsDirty from "@/utils/checkAreFieldsDirty";
import { getStepByRank } from "@/features/feed/multiStepMMSourceForm/stepsUtils";
import { MetronomeMarkListSchema } from "@/types/zodTypes";

interface MetronomeMarksFormProps {
  sectionList: SectionStateExtendedForMMForm[];
  // metronomeMarks?: MetronomeMarkState[];
}
export default function MetronomeMarksForm({
  // metronomeMarks,
  sectionList,
}: MetronomeMarksFormProps) {
  const { state, dispatch, currentStepRank } = useFeedForm();
  const step = getStepByRank(currentStepRank);

  // 1. Build defaultValues whose order == UI order
  const defaultValues = useMemo(
    () => ({
      metronomeMarks: sectionList.map((section) => {
        const existing = state.metronomeMarks?.find(
          (mm) => mm.sectionId === section.id,
        );
        // If we already have a value for this section, reuse it
        if (existing) return getMetronomeMarkInputFromState(existing);

        // Otherwise create an “empty” value for this section
        return {
          sectionId: section.id,
          comment: "",
        };
      }),
    }),
    [sectionList, state.metronomeMarks],
  );

  const {
    formState: { errors, dirtyFields },
    control,
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    trigger,
    reset,
  } = useForm<z.infer<typeof MetronomeMarkListSchema>>({
    defaultValues,
    resolver: zodResolver(
      MetronomeMarkListSchema.superRefine(({ metronomeMarks }, ctx) => {
        if (
          !metronomeMarks.some(
            (metronomeMark) =>
              !metronomeMark.noMM &&
              metronomeMark.beatUnit?.value &&
              metronomeMark.bpm,
          )
        ) {
          ctx.addIssue({
            code: "custom",
            path: ["general"],
            message: ONE_MM_REQUIRED,
          });
        }
      }),
    ) as any,
  });

  const computedIsDirty = checkAreFieldsDirty(dirtyFields);

  const onResetForm = () => {
    reset(defaultValues);
  };

  const submitForm = async (option: { goToNextStep: boolean }) => {
    // Trigger validations before submitting
    const isValid = await trigger();

    if (!isValid) {
      console.log(`[submitForm !isValid] getValues :`, getValues());
      console.log(`[submitForm !isValid] errors :`, errors);
    }

    if (isValid) {
      await handleSubmit(async (data) => {
        const mMStateList = getMetronomeMarkStateFromInput(
          data.metronomeMarks,
          sectionList,
        );
        updateFeedForm(dispatch, "metronomeMarks", {
          array: mMStateList,
          idKey: "sectionId",
          next: option.goToNextStep,
        });
        if (!option.goToNextStep) {
          const newMMStateInput = mMStateList.map((mMState) =>
            getMetronomeMarkInputFromState(mMState),
          );
          reset({ metronomeMarks: newMMStateInput });
        }
      })();
    }
  };

  // @ts-ignore
  const isOneMMRequiredError = errors?.general?.message === ONE_MM_REQUIRED;

  return (
    <form
      onSubmit={() => {
        console.warn(`[react-hook-form] form onSubmit - SHOULD NOT HAPPEN`);
        // Form is submitted programmatically
      }}
      onKeyDown={preventEnterKeySubmission}
    >
      <MetronomeMarkArray
        {...{ control, register, errors, watch, getValues }}
        sectionList={sectionList}
        setValue={setValue}
      />
      {isOneMMRequiredError && (
        <div role="alert" className="alert alert-error mt-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{ONE_MM_REQUIRED}</span>
        </div>
      )}
      <MMSourceFormStepNavigation
        onSave={() => submitForm({ goToNextStep: false })}
        onSaveAndGoToNextStep={() => submitForm({ goToNextStep: true })}
        onResetForm={onResetForm}
        isPresentFormDirty={computedIsDirty}
        submitTitle={step.title}
        dirtyFields={dirtyFields}
      />
    </form>
  );
}
