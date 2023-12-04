import { useForm } from "react-hook-form";
import { MetronomeMarksInput } from "@/types/editFormTypes";
import { zodResolver } from "@hookform/resolvers/zod";
import MetronomeMarkArray from "@/components/ReactHookForm/MetronomeMarkArray";
import { z } from "zod";
import { zodOption } from "@/utils/zodTypes";
import { useRouter } from "next/navigation";

const MetronomeMarksSchema = z.object({
  metronomeMarks: z.array(
    z.object({
      sectionId: z.string(),
      beatUnit: zodOption,
      bpm: z.number(),
      comment: z.string().optional(),
    }),
  ),
});

export default function MetronomeMarksForm({ sectionList, sourceId }) {
  const router = useRouter();
  const {
    formState: { errors, isSubmitting },
    control,
    register,
    handleSubmit,
    getValues,
    reset,
    setValue,
    watch,
  } = useForm<{ metronomeMarks: MetronomeMarksInput[] }>({
    defaultValues: {
      metronomeMarks: sectionList.map((sectionStateList) => {
        return {
          sectionId: sectionStateList.id,
          beatUnit: { value: "", label: "" },
          bpm: 0,
          // comment: "",
        };
      }),
    },
    resolver: zodResolver(MetronomeMarksSchema),
  });

  const onSubmit = async (data: { metronomeMarks: MetronomeMarksInput[] }) => {
    console.log(`[] data :`, data);
    try {
      const response = await fetch(`/api/metronome-marks/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          metronomeMarks: data.metronomeMarks,
          sourceId: sourceId,
        }),
      });
      if (response.ok) {
        console.log(
          `[onSubmit] Metronome marks are persisted - Should redirect on a summary thank you page`,
        );
      } else {
        console.error("Error creating metronome marks");
      }
    } catch (error) {
      console.error("Error creating metronome marks", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <MetronomeMarkArray
        {...{ control, register, errors, watch }}
        sectionList={sectionList}
      />
    </form>
  );
}
