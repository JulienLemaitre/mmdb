import { useForm } from "react-hook-form";
import {
  MetronomeMarkInput,
  MetronomeMarkState,
  SectionStateExtendedForMMForm,
} from "@/types/formTypes";
import { zodResolver } from "@hookform/resolvers/zod";
import MetronomeMarkArray from "@/components/ReactHookForm/MetronomeMarkArray";
import { z } from "zod";
import { getZodOptionFromEnum, zodPositiveNumber } from "@/utils/zodTypes";
import {
  updateFeedForm,
  useFeedForm,
} from "@/components/context/feedFormContext";
import getMetronomeMarkInputFromState from "@/utils/getMetronomeMarksInputFromState";
import getMetronomeMarkStateFromInput from "@/utils/getMetronomeMarkStateFromInput";
import { ONE_MM_REQUIRED } from "@/utils/constants";
import preventEnterKeySubmission from "@/utils/preventEnterKeySubmission";
import { NOTE_VALUE } from "@prisma/client";
import MMSourceFormStepNavigation from "@/components/multiStepMMSourceForm/MMSourceFormStepNavigation";
import checkAreFieldsDirty from "@/utils/checkAreFieldsDirty";
import { getStepByRank } from "@/components/multiStepMMSourceForm/stepsUtils";

const MetronomeMarkListSchema = z
  .object({
    metronomeMarks: z
      .array(
        z.object({
          noMM: z.boolean(),
          sectionId: z.string(),
          beatUnit: getZodOptionFromEnum(NOTE_VALUE).optional(),
          bpm: zodPositiveNumber.optional().or(z.nan()),
          comment: z.string().optional(),
        }),
      )
      .nonempty(),
  })
  .superRefine(({ metronomeMarks }, ctx) => {
    // for each metronomeMark, if noMM is not checked and bpm or beatUnit is not filled, we add an error
    const errors = metronomeMarks.reduce<any>(
      (acc, metronomeMark, currentIndex) => {
        if (!metronomeMark.noMM) {
          if (!metronomeMark.bpm) {
            acc.push({
              code: "custom",
              path: ["metronomeMarks", currentIndex, "bpm"],
              message: "This is required",
            });
          }
          if (!metronomeMark.beatUnit) {
            acc.push({
              code: "custom",
              path: ["metronomeMarks", currentIndex, "beatUnit"],
              message: "This is required",
            });
          }
        }
        return acc;
      },
      [],
    );
    if (errors.length > 0) {
      errors.forEach((error) => ctx.addIssue(error));
    }

    // If there is no metronomeMark with beatUnit and bpm, we add an error
    if (
      errors.length === 0 &&
      !metronomeMarks.some(
        (metronomeMark) =>
          !metronomeMark.noMM && metronomeMark.beatUnit && metronomeMark.bpm,
      )
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["general"],
        message: ONE_MM_REQUIRED,
      });
    }
  });

interface MetronomeMarksFormProps {
  sectionList: SectionStateExtendedForMMForm[];
  metronomeMarks?: MetronomeMarkState[];
}
export default function MetronomeMarksForm({
  metronomeMarks,
  sectionList,
}: MetronomeMarksFormProps) {
  const { dispatch, currentStepRank } = useFeedForm();
  const step = getStepByRank(currentStepRank);
  const {
    formState: { errors, isSubmitting, dirtyFields },
    control,
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    trigger,
    reset,
  } = useForm<{ metronomeMarks: MetronomeMarkInput[] }>({
    defaultValues: metronomeMarks
      ? {
          metronomeMarks: metronomeMarks.map((metronomeMark) =>
            getMetronomeMarkInputFromState(metronomeMark),
          ),
        }
      : {
          metronomeMarks: sectionList.map((s) => ({
            beatUnit: undefined,
            bpm: undefined,
            comment: undefined,
            sectionId: s.id,
            noMM: false,
          })),
        },
    resolver: zodResolver(MetronomeMarkListSchema),
  });

  const computedIsDirty = checkAreFieldsDirty(dirtyFields);

  const onResetForm = () => {
    sectionList.forEach((section, index) => {
      setValue(`metronomeMarks.${index}.sectionId`, section.id);
      // @ts-ignore => I don't know how to allow resetting the value to undefined without implying the correct MetronomeMArkInput type accepting this value and screwing the getMetronomeMarkStateFromInput type checking before persisting feedForm data.
      setValue(`metronomeMarks.${index}.bpm`, undefined);
      // @ts-ignore
      setValue(`metronomeMarks.${index}.beatUnit`, undefined);
      // @ts-ignore
      setValue(`metronomeMarks.${index}.comment`, undefined);
      setValue(`metronomeMarks.${index}.noMM`, false);
    });
    reset(
      metronomeMarks
        ? {
            metronomeMarks: metronomeMarks.map((metronomeMark) =>
              getMetronomeMarkInputFromState(metronomeMark),
            ),
          }
        : {
            metronomeMarks: sectionList.map((s) => ({
              beatUnit: undefined,
              bpm: undefined,
              comment: undefined,
              sectionId: s.id,
              noMM: false,
            })),
          },
    );
  };

  // const submitForm = async (data: { metronomeMarks: MetronomeMarkInput[] }) => {
  const submitForm = async (option: { goToNextStep: boolean }) => {
    // Trigger validations before submitting
    const isValid = await trigger();

    if (!isValid) {
      console.log(`[submitForm !isValid] getValues :`, getValues());
      console.log(`[submitForm !isValid] errors :`, errors);
    }

    if (isValid) {
      console.log(`[submitForm] submitForm after validation successful`);
      await handleSubmit(async (data) => {
        console.log(`[submitForm] data :`, data);
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
