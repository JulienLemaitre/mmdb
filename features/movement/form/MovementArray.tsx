import React, { useState } from "react";
import { useFieldArray } from "react-hook-form";
import dynamic from "next/dynamic";
import { KEY } from "@/prisma/client/enums";
import ControlledSelect from "@/ui/form/ControlledSelect";
import SectionArray from "@/features/section/form/SectionArray";
import PlusIcon from "@/ui/svg/PlusIcon";
import TrashIcon from "@/ui/svg/TrashIcon";
import { getMovementDefaultValues } from "@/features/movement/utils/getMovementDefaultValues";
import ArrowDownIcon from "@/ui/svg/ArrowDownIcon";
import ArrowUpIcon from "@/ui/svg/ArrowUpIcon";
import getKeyLabel from "@/utils/getKeyLabel";
import { NEED_CONFIRMATION_MODAL_ID } from "@/utils/constants";
import ChevronDownIcon from "@/ui/svg/ChevronDownIcon";

const NeedConfirmationModal = dynamic(
  () => import("@/ui/modal/NeedConfirmationModal"),
  { ssr: false },
);

export default function MovementArray({
  control,
  register,
  setValue,
  getValues,
  errors,
  tempoIndicationList,
  onTempoIndicationSelected,
  onTempoIndicationCreated,
  watch,
}) {
  const { fields, append, remove, swap, insert } = useFieldArray({
    control,
    name: "movements",
  });

  const [movementIndexToRemove, setMovementIndexToRemove] = useState<
    number | null
  >(null);
  const [closedMovements, setClosedMovements] = useState<boolean[]>(
    new Array(fields.length).fill(false),
  );

  const onMovementOpen = (index: number) => {
    const newClosedMovements = [...closedMovements];
    newClosedMovements[index] =
      typeof newClosedMovements[index] === "boolean"
        ? !newClosedMovements[index]
        : false;
    setClosedMovements(newClosedMovements);
  };

  const onAppendMovement = () => {
    setClosedMovements((prev) => [...prev, false]);
    append(getMovementDefaultValues());
  };

  const onInsertMovement = (index: number) => {
    setClosedMovements((prev) => {
      let newClosedMovements = [...prev];
      const arrayBefore = newClosedMovements.slice(0, index + 1);
      newClosedMovements = [
        ...arrayBefore,
        false,
        ...newClosedMovements.slice(index + 1),
      ];
      return newClosedMovements;
    });
    insert(index + 1, getMovementDefaultValues());
  };

  const onSwapMovements = (index1: number, index2: number) => {
    setClosedMovements((prev) => {
      const newClosedMovements = [...prev];
      const temp = newClosedMovements[index1];
      newClosedMovements[index1] = newClosedMovements[index2];
      newClosedMovements[index2] = temp;
      return newClosedMovements;
    });
    swap(index1, index2);
  };

  const onRemoveMovement = () => {
    if (movementIndexToRemove !== null) {
      setClosedMovements((prev) =>
        prev.filter((_, i) => i !== movementIndexToRemove),
      );
      remove(movementIndexToRemove);
      setMovementIndexToRemove(null);
    }
  };

  return (
    <ul>
      {fields.map((item, index, mvtArray) => {
        const isLastItem = index === mvtArray.length - 1;
        const isMovementOpen = !closedMovements[index];

        return (
          <li
            key={item.id}
            className="mt-6 px-4 pt-3 border border-base-300 rounded-lg hover:border-secondary/25 hover:shadow-xs hover:bg-primary/5 transition-all duration-150"
          >
            <div className="flex justify-between w-full pl-0">
              <div className="flex items-center gap-2">
                <button
                  className={`btn btn-circle btn-ghost hover:bg-secondary/80 transition-all duration-150 ${isMovementOpen ? "" : "-rotate-90"}`}
                  onClick={() => onMovementOpen(index)}
                  onKeyDown={(
                    event: React.KeyboardEvent<HTMLButtonElement>,
                  ) => {
                    if (event.key === "Enter" || event.key === " ") {
                      onMovementOpen(index);
                    }
                  }}
                >
                  <ChevronDownIcon className="w-4 h-4" />
                </button>
                <h5 className="text-xl font-normal text-secondary">{`Movement ${
                  index + 1
                }${
                  mvtArray.length === 1
                    ? ` (or whole piece if not divided in movements)`
                    : ""
                }`}</h5>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-ghost hover:bg-error hover:text-neutral"
                  onClick={() => setMovementIndexToRemove(index)}
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost disabled:bg-transparent"
                  onClick={() => {
                    onSwapMovements(index, index - 1);
                  }}
                  disabled={index === 0}
                >
                  <ArrowUpIcon className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost disabled:bg-transparent"
                  onClick={() => {
                    onSwapMovements(index, index + 1);
                  }}
                  disabled={index === mvtArray.length - 1}
                >
                  <ArrowDownIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div
              className={`${isMovementOpen ? "" : "hidden transition-all duration-150"}`}
            >
              <input {...register(`movements[${index}].id` as const)} hidden />
              <ControlledSelect
                name={`movements[${index}].key` as const}
                label={`Key`}
                id={`movements[${index}].key` as const}
                control={control}
                options={Object.values(KEY).map((key) => ({
                  value: key,
                  label: getKeyLabel(key),
                }))}
                isRequired={true}
                fieldError={errors?.movements?.[index]?.key}
              />

              <SectionArray
                nestIndex={index}
                {...{ control, register, getValues, setValue, errors, watch }}
                tempoIndicationList={tempoIndicationList}
                onTempoIndicationSelected={onTempoIndicationSelected}
                onTempoIndicationCreated={onTempoIndicationCreated}
              />
            </div>
            <section className="my-4 flex gap-2 w-full justify-between">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() =>
                  isLastItem ? onAppendMovement() : onInsertMovement(index)
                }
              >
                <PlusIcon className="w-4 h-4" />
                Add Movement
              </button>
            </section>
          </li>
        );
      })}
      {fields.length === 0 && (
        <section className="my-4 flex gap-2 w-full justify-between">
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onAppendMovement}
            >
              <PlusIcon className="w-4 h-4" />
              Add Movement
            </button>
          </div>
        </section>
      )}
      <NeedConfirmationModal
        modalId={`${NEED_CONFIRMATION_MODAL_ID}-movement`}
        onConfirm={onRemoveMovement}
        onCancel={() => setMovementIndexToRemove(null)}
        description={`Delete this movement and all its sections`}
        isOpened={movementIndexToRemove !== null}
      />
    </ul>
  );
}
