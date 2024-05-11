import { useForm } from "react-hook-form";
import {
  MetronomeMarkInput,
  MetronomeMarkState,
  SectionStateExtendedForMMForm,
} from "@/types/formTypes";
import { zodResolver } from "@hookform/resolvers/zod";
import MetronomeMarkArray from "@/components/ReactHookForm/MetronomeMarkArray";
import { z } from "zod";
import { zodOption } from "@/utils/zodTypes";
import {
  updateFeedForm,
  useFeedForm,
} from "@/components/context/feedFormContext";
import getMetronomeMarkInputFromState from "@/utils/getMetronomeMarksInputFromState";
import getMetronomeMarkStateFromInput from "@/utils/getMetronomeMarkStateFromInput";
import { ONE_MM_REQUIRED } from "@/utils/constants";

const MetronomeMarkListSchema = z
  .object({
    metronomeMarks: z
      .array(
        z.object({
          noMM: z.boolean(),
          sectionId: z.string(),
          beatUnit: zodOption.optional(),
          bpm: z.number().optional().or(z.nan()),
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
  const { dispatch } = useFeedForm();
  const {
    formState: { errors, isSubmitting },
    control,
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
  } = useForm<{ metronomeMarks: MetronomeMarkInput[] }>({
    defaultValues: metronomeMarks
      ? {
          metronomeMarks: metronomeMarks.map((metronomeMark) =>
            getMetronomeMarkInputFromState(metronomeMark),
          ),
        }
      : {},
    resolver: zodResolver(MetronomeMarkListSchema),
  });

  const onSubmit = async (data: { metronomeMarks: MetronomeMarkInput[] }) => {
    console.log(`[] data :`, data);
    const array = getMetronomeMarkStateFromInput(
      data.metronomeMarks,
      sectionList,
    );
    updateFeedForm(dispatch, "metronomeMarks", {
      array,
      idKey: "sectionId",
      next: true,
    });
  };

  // @ts-ignore
  const isOneMMRequiredError = errors?.general?.message === ONE_MM_REQUIRED;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
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
      <button
        className="btn btn-primary mt-6 w-full max-w-xs"
        type="submit"
        disabled={isSubmitting}
      >
        Submit
        {isSubmitting && (
          <span className="loading loading-spinner loading-sm"></span>
        )}
      </button>
    </form>
  );
}
