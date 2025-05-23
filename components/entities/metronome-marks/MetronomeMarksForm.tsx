import { useForm } from "react-hook-form";
import {
  MetronomeMarkState,
  SectionStateExtendedForMMForm,
} from "@/types/formTypes";
import { zodResolver } from "@hookform/resolvers/zod";
import MetronomeMarkArray from "@/components/ReactHookForm/MetronomeMarkArray";
import { z } from "zod";
import { getZodOptionFromEnum, zodPositiveNumber } from "@/types/zodTypes";
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

const MetronomeMarkSchema = z.discriminatedUnion("noMM", [
  z.object({
    noMM: z.literal(true),
    sectionId: z.string(),
    comment: z.string().optional().nullable(),
  }),
  z.object({
    noMM: z.literal(false),
    sectionId: z.string(),
    beatUnit: getZodOptionFromEnum(NOTE_VALUE),
    bpm: zodPositiveNumber,
    comment: z.string().optional().nullable(),
  }),
]);

const MetronomeMarkListSchema = z
  .object({
    metronomeMarks: z.array(MetronomeMarkSchema).nonempty(),
  })
  .superRefine(({ metronomeMarks }, ctx) => {
    // If there is no metronomeMark with beatUnit and bpm, we add an error
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
  } = useForm<z.infer<typeof MetronomeMarkListSchema>>({
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
