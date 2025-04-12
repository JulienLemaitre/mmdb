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
  PieceVersionState,
  TempoIndicationState,
} from "@/types/formTypes";
import MovementArray from "@/components/ReactHookForm/MovementArray";
import { getMovementDefaultValues } from "@/components/ReactHookForm/formUtils";
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
import getTempoIndicationSelectList from "@/utils/getTempoIndicationSelectList";
import ArrowLeftIcon from "@/components/svg/ArrowLeftIcon";
import getPieceVersionInputFromPieceVersionState from "@/utils/getPieceVersionInputFromPieceVersionState";

const PieceVersionSchema = z.object({
  category: getZodOptionFromEnum(PIECE_CATEGORY),
  movements: z
    .array(
      z.object({
        id: z.string().optional(),
        key: getZodOptionFromEnum(KEY),
        sections: z
          .array(
            z.object({
              id: z.string().optional(),
              metreNumerator: zodPositiveNumber,
              metreDenominator: zodPositiveNumber,
              isCommonTime: z.boolean().optional(),
              isCutTime: z.boolean().optional(),
              fastestStructuralNotesPerBar: zodPositiveNumber,
              isFastestStructuralNoteBelCanto: z.boolean().optional(),
              fastestStaccatoNotesPerBar: zodPositiveNumber
                .optional()
                .nullable(),
              fastestRepeatedNotesPerBar: zodPositiveNumber
                .optional()
                .nullable(),
              fastestOrnamentalNotesPerBar: zodPositiveNumber
                .optional()
                .nullable(),
              comment: z.string().optional().nullable(),
              tempoIndication: zodOption,
            }),
          )
          .min(1),
      }),
    )
    .min(1),
});

export default function PieceVersionEditForm({
  pieceVersion,
  onSubmit,
  onCancel,
}: Readonly<{
  pieceVersion?: PieceVersionState;
  onCancel: () => void;
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
  } = useForm({
    defaultValues: pieceVersion
      ? getPieceVersionInputFromPieceVersionState(pieceVersion)
      : {
          category: { value: undefined, label: undefined },
          movements: [getMovementDefaultValues()],
        },
    resolver: zodResolver(PieceVersionSchema),
  });

  const [tempoIndicationList, setTempoIndicationList] = useState<
    TempoIndicationState[]
  >([]);
  const { state: feedFormState, dispatch: feedFormDispatch } = useFeedForm();

  // Fetch tempoIndicationSelectList from API
  useEffect(() => {
    getTempoIndicationSelectList().then((data) => setTempoIndicationList(data));
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

  // @ts-ignore
  return (
    <div>
      <h1 className="mb-4 text-4xl font-bold">
        Create a piece{" "}
        <span className="block text-xl font-normal">
          Content details (a.k.a. piece version)
        </span>
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
        <div className="flex gap-4 items-center mt-6">
          <button
            className="btn btn-neutral"
            type="button"
            disabled={isSubmitting}
            onClick={onCancel}
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Cancel
          </button>
          <button
            className="btn btn-primary w-full max-w-xs"
            type="submit"
            disabled={isSubmitting}
          >
            Submit
            {isSubmitting && (
              <span className="loading loading-spinner loading-md"></span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
