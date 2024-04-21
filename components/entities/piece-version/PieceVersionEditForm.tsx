import { z } from "zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PIECE_CATEGORY, TempoIndication } from "@prisma/client";
import ControlledSelect from "@/components/ReactHookForm/ControlledSelect";
import { OptionInput, PieceVersionInput } from "@/types/formTypes";
import { URL_API_GETALL_TEMPO_INDICATIONS } from "@/utils/routes";
import MovementArray from "@/components/ReactHookForm/MovementArray";
import { MOVEMENT_DEFAULT_VALUE } from "@/components/ReactHookForm/formUtils";
import { TEMPO_INDICATION_NONE_ID } from "@/utils/constants";
import { zodOption } from "@/utils/zodTypes";
import { useSession } from "next-auth/react";
import { fetchAPI } from "@/utils/fetchAPI";

const PieceVersionSchema = z.object({
  category: zodOption,
  movements: z
    .array(
      z.object({
        id: z.string().optional(),
        rank: z.number(),
        key: zodOption,
        sections: z
          .array(
            z.object({
              id: z.string().optional(),
              rank: z.number(),
              metreNumerator: z.number(),
              metreDenominator: z.number(),
              isCommonTime: z.boolean().optional(),
              isCutTime: z.boolean().optional(),
              fastestStructuralNotesPerBar: z.number(),
              isFastestStructuralNoteBelCanto: z.boolean().optional(),
              fastestStaccatoNotesPerBar: z.number().or(z.nan()),
              fastestRepeatedNotesPerBar: z.number().or(z.nan()),
              fastestOrnamentalNotesPerBar: z.number().or(z.nan()),
              comment: z.string().optional(),
              tempoIndication: zodOption,
            }),
          )
          .nonempty(),
      }),
    )
    .nonempty(),
});

export default function PieceVersionEditForm({
  pieceVersion,
  onSubmit,
}: Readonly<{
  pieceVersion?: PieceVersionInput;
  onSubmit: (pieceVersion: PieceVersionInput) => void;
}>) {
  const { data: session } = useSession();
  const {
    formState: { errors, isSubmitting },
    control,
    register,
    handleSubmit,
    getValues,
    // reset,
    setValue,
    watch,
  } = useForm<PieceVersionInput>({
    defaultValues: pieceVersion ?? {
      movements: [MOVEMENT_DEFAULT_VALUE],
    },
    resolver: zodResolver(PieceVersionSchema),
  });

  const [tempoIndicationList, setTempoIndicationList] = useState<
    TempoIndication[]
  >([]);
  // Fetch tempoIndicationList from API
  useEffect(() => {
    fetch(URL_API_GETALL_TEMPO_INDICATIONS)
      .then((res) => res.json())
      .then((data) => {
        // Get the index of tempoIndication with id === TEMPO_INDICATION_NONE_ID (text === "-- None --")
        const noneIndex = data.findIndex(
          (tempoIndication) => tempoIndication.id === TEMPO_INDICATION_NONE_ID,
        );
        // Copy the tempoIndication with text === "-- None --"
        const noneTempoIndication = data[noneIndex];
        // Remove the targeted tempoIndication from the list
        data.splice(noneIndex, 1);
        // put the tempoIndication with text === "-- None --" as the first element in the array
        data.unshift(noneTempoIndication);

        setTempoIndicationList(data);
      });
  }, []);

  const onTempoIndicationCreated = async (
    inputValue: string,
  ): Promise<OptionInput | void> => {
    return await fetchAPI(
      "/api/tempoIndication/create",
      {
        variables: {
          text: inputValue,
        },
      },
      session?.user?.accessToken,
    )
      .then(async (newTempoIndication) => {
        console.log(
          `[onTempoIndicationCreated] newTempoIndication :`,
          newTempoIndication,
        );
        const newOption = {
          value: newTempoIndication.id,
          label: newTempoIndication.text,
        };
        setTempoIndicationList((tiList) => [...tiList, newTempoIndication]);

        // Return an option to be feeded to ReactCreatableSelect onChange
        return newOption;
      })
      .catch((reason) => {
        console.error(reason);
      });
  };

  console.log(`[PieceVersionEditForm] errors :`, errors);

  return (
    <div>
      <h1 className="mb-4 text-4xl font-bold">
        Create a piece{" "}
        <span className="block text-xl font-normal">Content details</span>
      </h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <ControlledSelect
          name="category"
          label="Category"
          id="category"
          control={control}
          options={Object.values(PIECE_CATEGORY).map((category) => ({
            value: category,
            label: category,
          }))}
          isRequired={true}
          errors={errors}
        />

        <h2 className="my-4 text-3xl font-bold">Piece structure</h2>
        <MovementArray
          {...{ control, register, getValues, setValue, errors, watch }}
          tempoIndicationList={tempoIndicationList}
          onTempoIndicationCreated={onTempoIndicationCreated}
        />
        <button
          className="btn btn-primary mt-4"
          type="submit"
          disabled={isSubmitting}
        >
          Submit
          {isSubmitting && (
            <span className="loading loading-spinner loading-md"></span>
          )}
        </button>
      </form>
    </div>
  );
}
