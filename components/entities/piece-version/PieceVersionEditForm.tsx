import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KEY, PIECE_CATEGORY } from "@prisma/client";
import ControlledSelect from "@/components/ReactHookForm/ControlledSelect";
import {
  OptionInput,
  PieceVersionInput,
  TempoIndicationState,
} from "@/types/formTypes";
import { URL_API_GETALL_TEMPO_INDICATIONS } from "@/utils/routes";
import MovementArray from "@/components/ReactHookForm/MovementArray";
import { getMovementDefaultValues } from "@/components/ReactHookForm/formUtils";
import { TEMPO_INDICATION_NONE_ID } from "@/utils/constants";
import {
  getZodOptionFromEnum,
  zodOption,
  zodPositiveNumber,
} from "@/utils/zodTypes";
import {
  updateFeedForm,
  useFeedForm,
} from "@/components/context/feedFormContext";
import preventEnterKeySubmission from "@/utils/preventEnterKeySubmission";
import formatToPhraseCase from "@/utils/formatToPhraseCase";

const PieceVersionSchema = z.object({
  category: getZodOptionFromEnum(PIECE_CATEGORY),
  movements: z
    .array(
      z.object({
        id: z.string(),
        key: getZodOptionFromEnum(KEY),
        sections: z
          .array(
            z.object({
              id: z.string(),
              metreNumerator: zodPositiveNumber,
              metreDenominator: zodPositiveNumber,
              isCommonTime: z.boolean().optional(),
              isCutTime: z.boolean().optional(),
              fastestStructuralNotesPerBar: zodPositiveNumber,
              isFastestStructuralNoteBelCanto: z.boolean().optional(),
              fastestStaccatoNotesPerBar: zodPositiveNumber.optional(),
              fastestRepeatedNotesPerBar: zodPositiveNumber.optional(),
              fastestOrnamentalNotesPerBar: zodPositiveNumber.optional(),
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
  const {
    formState: { errors, isSubmitting },
    control,
    register,
    handleSubmit,
    getValues,
    setValue,
    watch,
  } = useForm<PieceVersionInput>({
    defaultValues: pieceVersion ?? {
      movements: [getMovementDefaultValues()],
    },
    resolver: zodResolver(PieceVersionSchema),
  });

  const [tempoIndicationList, setTempoIndicationList] = useState<
    TempoIndicationState[]
  >([]);
  const { state: feedFormState, dispatch: feedFormDispatch } = useFeedForm();

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
    // persist the new tempoIndication in main form context
    const newTempoIndication = {
      id: uuidv4(),
      text: inputValue,
      isNew: true,
    };
    updateFeedForm(feedFormDispatch, "tempoIndications", {
      array: [newTempoIndication],
    });
    return { value: newTempoIndication.id, label: newTempoIndication.text };
  };

  const fullTempoIndicationList = [
    ...tempoIndicationList,
    ...(feedFormState.tempoIndications || []),
  ];

  return (
    <div>
      <h1 className="mb-4 text-4xl font-bold">
        Create a piece{" "}
        <span className="block text-xl font-normal">Content details</span>
      </h1>
      <form
        onSubmit={handleSubmit(onSubmit)}
        onKeyDown={preventEnterKeySubmission}
      >
        <ControlledSelect
          name="category"
          label="Category"
          id="category"
          control={control}
          options={Object.values(PIECE_CATEGORY).map((category) => ({
            value: category,
            label: formatToPhraseCase(category),
          }))}
          isRequired={true}
          errors={errors}
        />

        <h2 className="my-4 text-3xl font-bold">Piece structure</h2>
        <MovementArray
          {...{ control, register, getValues, setValue, errors, watch }}
          tempoIndicationList={fullTempoIndicationList}
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
