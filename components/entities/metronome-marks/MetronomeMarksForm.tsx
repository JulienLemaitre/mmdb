import { useForm } from "react-hook-form";
import {
  MetronomeMarkInput,
  MetronomeMarkState,
  SectionState,
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

const MetronomeMarkListSchema = z.object({
  metronomeMarks: z.array(
    z.object({
      sectionId: z.string(),
      beatUnit: zodOption,
      bpm: z.number(),
      comment: z.string().optional(),
    }),
  ),
});

interface MetronomeMarksFormProps {
  sectionList: SectionState[];
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
    const array = getMetronomeMarkStateFromInput(data.metronomeMarks);
    updateFeedForm(dispatch, "metronomeMarks", {
      array,
      idKey: "sectionId",
      next: true,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <MetronomeMarkArray
        {...{ control, register, errors, watch }}
        sectionList={sectionList}
        setValue={setValue}
      />
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
