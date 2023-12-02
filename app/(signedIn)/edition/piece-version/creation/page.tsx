"use client";
import { z } from "zod";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  updateEditForm,
  useEditForm,
} from "@/components/context/editFormContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PIECE_CATEGORY, TempoIndication } from "@prisma/client";
import ControlledSelect from "@/components/ReactHookForm/ControlledSelect";
import { Option, PieceVersionInput } from "@/types/editFormTypes";
import { CREATION_SOURCE_URL } from "@/utils/routes";
import MovementArray from "@/components/ReactHookForm/MovementArray";
import { MOVEMENT_DEFAULT_VALUE } from "@/components/ReactHookForm/formUtils";

const PieceVersionSchema = z.object({
  category: z.object({
    value: z.string(),
    label: z.string(),
  }),
  movements: z
    .array(
      z.object({
        rank: z.number(),
        key: z.object({
          value: z.string(),
          label: z.string(),
        }),
        sections: z
          .array(
            z.object({
              rank: z.number(),
              metreNumerator: z.number(),
              metreDenominator: z.number(),
              isCommonTime: z.string().optional(),
              isCutTime: z.string().optional(),
              fastestStructuralNotesPerBar: z.number(),
              isFastestStructuralNoteBelCanto: z.string().optional(),
              fastestStaccatoNotesPerBar: z.number().or(z.nan()),
              fastestRepeatedNotesPerBar: z.number().or(z.nan()),
              fastestOrnamentalNotesPerBar: z.number().or(z.nan()),
              comment: z.string().optional(),
              tempoIndication: z
                .object({
                  value: z.string(),
                  label: z.string(),
                })
                .optional(),
            }),
          )
          .nonempty(),
      }),
    )
    .nonempty(),
});

export default function CreatePieceVersion() {
  const router = useRouter();
  const { dispatch, state } = useEditForm();
  const {
    formState: { errors, isSubmitting },
    control,
    register,
    handleSubmit,
    getValues,
    reset,
    setValue,
    watch,
  } = useForm<PieceVersionInput>({
    defaultValues: {
      movements: [MOVEMENT_DEFAULT_VALUE],
    },
    resolver: zodResolver(PieceVersionSchema),
  });

  const [tempoIndicationList, setTempoIndicationList] = useState<
    TempoIndication[]
  >([]);
  // Fetch tempoIndicationList from API
  useEffect(() => {
    fetch("/api/tempoIndicationList/get")
      .then((res) => res.json())
      .then((data) => {
        setTempoIndicationList(data);
      });
  }, []);

  const onTempoIndicationCreated = async (
    inputValue: string,
  ): Promise<Option | void> => {
    return await fetch("/api/tempoIndication/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: inputValue,
      }),
    })
      .then(async (response) => {
        const newTempoIndication = await response.json();
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

  const onSubmit = async (data: PieceVersionInput) => {
    // Front input values validation is successful at this point.
    console.log("data", data);

    const pieceVersionData = data;
    // Remove null values from pieceVersionData
    Object.keys(pieceVersionData).forEach(
      (key) => pieceVersionData[key] == null && delete pieceVersionData[key],
    );

    if (!state.piece) {
      console.warn("No piece in state to link to the piece version");
      return;
    }

    // post data to api route to create a piece version
    const pieceVersion = await fetch("/api/piece-version/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...pieceVersionData,
        pieceId: state.piece.id,
      }),
    })
      .then((res) => res.json())
      .catch((err) => console.log(err));

    if (!pieceVersion) {
      console.warn("ERROR - NO piece version created");
      return;
    }

    console.log("Piece version created", pieceVersion);

    updateEditForm(dispatch, "pieceVersion", pieceVersion);
    router.push(CREATION_SOURCE_URL);
  };

  console.log(`[CreatePieceVersion] errors :`, errors);

  return (
    <div>
      <h1 className="mb-4 text-4xl font-bold">
        Create a piece
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
            <span className="loading loading-spinner loading-sm"></span>
          )}
        </button>
      </form>
    </div>
  );
}
