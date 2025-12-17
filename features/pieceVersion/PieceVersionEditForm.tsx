import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KEY, PIECE_CATEGORY } from "@/prisma/client/enums";
import ControlledSelect from "@/ui/form/ControlledSelect";
import {
  OptionInput,
  PieceVersionInput,
  PieceVersionState,
  TempoIndicationState,
} from "@/types/formTypes";
import MovementArray from "@/features/movement/form/MovementArray";
import { getMovementDefaultValues } from "@/features/movement/utils/getMovementDefaultValues";
import {
  getZodOptionFromEnum,
  zodOption,
  zodPositiveNumber,
  zodPositiveNumberOrEmpty,
} from "@/types/zodTypes";
import { updateFeedForm, useFeedForm } from "@/context/feedFormContext";
import preventEnterKeySubmission from "@/utils/preventEnterKeySubmission";
import formatToPhraseCase from "@/utils/formatToPhraseCase";
import getTempoIndicationSelectList from "@/utils/getTempoIndicationSelectList";
import ArrowLeftIcon from "@/ui/svg/ArrowLeftIcon";
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
              fastestStaccatoNotesPerBar: zodPositiveNumberOrEmpty
                .optional()
                .nullable(),
              fastestRepeatedNotesPerBar: zodPositiveNumberOrEmpty
                .optional()
                .nullable(),
              fastestOrnamentalNotesPerBar: zodPositiveNumberOrEmpty
                .optional()
                .nullable(),
              comment: z.string().optional().nullable(),
              commentForReview: z.string().optional().nullable(),
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
  } = useForm<PieceVersionInput>({
    defaultValues: pieceVersion
      ? getPieceVersionInputFromPieceVersionState(pieceVersion)
      : {
          movements: [getMovementDefaultValues()],
        },
    resolver: zodResolver(PieceVersionSchema) as any,
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
    <div className="mt-4">
      <h3 className="mb-4 text-2xl font-bold">
        Piece version<div className="badge badge-soft badge-info mx-3">New</div>
      </h3>
      <form
        onSubmit={handleSubmit(onSubmit)}
        onKeyDown={preventEnterKeySubmission}
      >
        <fieldset className="fieldset border border-base-300 rounded-lg hover:border-base-400 hover:shadow-xs hover:bg-primary/5 transition-all duration-150 px-4 pb-4">
          <legend className="fieldset-legend">Piece</legend>
          <ControlledSelect
            name="category"
            label="Category"
            id="category"
            classNames="mt-0"
            control={control}
            options={Object.values(PIECE_CATEGORY).map((category) => ({
              value: category,
              label: formatToPhraseCase(category),
            }))}
            isRequired={true}
            fieldError={errors?.category}
          />
        </fieldset>

        <MovementArray
          {...{ control, register, getValues, setValue, errors, watch }}
          tempoIndicationList={fullTempoIndicationList}
          onTempoIndicationCreated={onTempoIndicationCreated}
        />

        <div className="grid grid-cols-2 gap-4 items-center mt-6">
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
            className="btn btn-primary"
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
