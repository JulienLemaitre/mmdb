import { useForm } from "react-hook-form";
import { MetronomeMarksInput, SectionState } from "@/types/formTypes";
import { zodResolver } from "@hookform/resolvers/zod";
import MetronomeMarkArray from "@/components/ReactHookForm/MetronomeMarkArray";
import { z } from "zod";
import { zodOption } from "@/utils/zodTypes";
// import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { fetchAPI } from "@/utils/fetchAPI";

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

interface MetronomeMarksFormProps {
  sectionList: SectionState[];
  sourceId: string;
}
export default function MetronomeMarksForm({
  sectionList,
  sourceId,
}: MetronomeMarksFormProps) {
  // const router = useRouter();
  const [isDataSaved, setIsDataSaved] = useState<boolean>(false);
  const { data: session } = useSession();
  const {
    formState: { errors, isSubmitting },
    control,
    register,
    handleSubmit,
    // getValues,
    // reset,
    setValue,
    watch,
  } = useForm<{ metronomeMarks: MetronomeMarksInput[] }>({
    defaultValues: {
      metronomeMarks: sectionList.map((sectionStateList) => {
        return {
          sectionId: sectionStateList.id,
        };
      }),
    },
    resolver: zodResolver(MetronomeMarksSchema),
  });

  const onSubmit = async (data: { metronomeMarks: MetronomeMarksInput[] }) => {
    console.log(`[] data :`, data);
    try {
      const response = await fetchAPI(
        "/api/metronome-marks/create",
        {
          variables: {
            metronomeMarks: data.metronomeMarks,
            sourceId: sourceId,
          },
        },
        session?.user?.accessToken,
      );

      if (response.ok) {
        setIsDataSaved(true);
        console.log(
          `[onSubmit] Metronome marks are persisted - Should redirect on a summary thank you page`,
        );
      } else {
        console.error("Error creating metronome marks", response);
        // TODO: handle the error on screen
      }
    } catch (error) {
      console.error("Error creating metronome marks", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {isDataSaved && (
        <div className="alert alert-success">
          <div className="flex-1">
            <label className="label">
              <span className="label-text">Data saved</span>
            </label>
          </div>
        </div>
      )}
      {!isDataSaved && (
        <>
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
        </>
      )}
    </form>
  );
}
