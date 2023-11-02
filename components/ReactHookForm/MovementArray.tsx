// 'use client'
import { useFieldArray } from "react-hook-form";
import { KEY } from "@prisma/client";
import ControlledSelect from "@/components/ReactHookForm/ControlledSelect";
import SectionArray from "@/components/ReactHookForm/SectionArray";
import PlusIcon from "@/components/svg/PlusIcon";
import TrashIcon from "@/components/svg/TrashIcon";
import { getMovementDefaultValues } from "@/components/ReactHookForm/formUtils";

export default function MovementArray({
  control,
  register,
  setValue,
  getValues,
  errors,
  tempoIndicationList,
  watch,
}) {
  const { fields, append, prepend, remove, swap, move, insert } = useFieldArray(
    {
      control,
      name: "movements",
    },
  );

  return (
    <>
      <ul>
        {fields.map((item, index, mvtArray) => (
          <li key={item.id}>
            <h4 className="mt-6 text-2xl font-bold text-secondary">{`Movement ${
              index + 1
            }${
              mvtArray.length === 1
                ? ` (or whole piece if not divided in movements)`
                : ""
            }`}</h4>
            <input
              value={index + 1}
              {...register(`movements[${index}].rank` as const)}
              hidden
            />
            <ControlledSelect
              name={`movements[${index}].key` as const}
              label={`Key`}
              id={`movements[${index}].key` as const}
              control={control}
              options={Object.values(KEY).map((key) => ({
                value: key,
                label: key,
              }))}
              isRequired={true}
              errors={errors}
            />

            <SectionArray
              nestIndex={index}
              {...{ control, register, getValues, setValue, errors, watch }}
              tempoIndicationList={tempoIndicationList}
            />
            {index === mvtArray.length - 1 && (
              <section className="my-4 flex gap-2 w-full justify-between">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    append(getMovementDefaultValues(index));
                  }}
                >
                  <PlusIcon className="w-5 h-5" />
                  Add movement
                </button>
                <button
                  type="button"
                  className="btn btn-error"
                  onClick={() => remove(index)}
                >
                  <TrashIcon className="w-5 h-5" />
                  {`Delete Movement ${index + 1}`}
                </button>
              </section>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
