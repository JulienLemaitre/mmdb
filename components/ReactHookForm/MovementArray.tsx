import { useFieldArray } from "react-hook-form";
import { KEY } from "@prisma/client";
import ControlledSelect from "@/components/ReactHookForm/ControlledSelect";
import SectionArray from "@/components/ReactHookForm/SectionArray";
import PlusIcon from "@/components/svg/PlusIcon";
import TrashIcon from "@/components/svg/TrashIcon";
import { getMovementDefaultValues } from "@/components/ReactHookForm/formUtils";
import ArrowDownIcon from "@/components/svg/ArrowDownIcon";
import ArrowUpIcon from "@/components/svg/ArrowUpIcon";
import formatToPhraseCase from "@/utils/formatToPhraseCase";

export default function MovementArray({
  control,
  register,
  setValue,
  getValues,
  errors,
  tempoIndicationList,
  onTempoIndicationCreated,
  watch,
}) {
  const { fields, append, remove, swap, insert } = useFieldArray({
    control,
    name: "movements",
  });

  return (
    <>
      <ul>
        {fields.map((item, index, mvtArray) => {
          const isLastItem = index === mvtArray.length - 1;
          return (
            <li
              key={item.id}
              className="mt-6 px-4 pt-3 border border-base-300 rounded-lg hover:border-secondary/25 hover:shadow-xs hover:bg-primary/5 transition-all duration-150"
            >
              <div className="flex justify-between">
                <h5 className="text-xl font-normal text-secondary">{`Movement ${
                  index + 1
                }${
                  mvtArray.length === 1
                    ? ` (or whole piece if not divided in movements)`
                    : ""
                }`}</h5>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost hover:bg-error hover:text-neutral"
                    onClick={() => remove(index)}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost disabled:bg-transparent"
                    onClick={() => {
                      swap(index, index - 1);
                    }}
                    disabled={index === 0}
                  >
                    <ArrowUpIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost disabled:bg-transparent"
                    onClick={() => {
                      swap(index, index + 1);
                    }}
                    disabled={index === mvtArray.length - 1}
                  >
                    <ArrowDownIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <input {...register(`movements[${index}].id` as const)} hidden />
              <ControlledSelect
                name={`movements[${index}].key` as const}
                label={`Key`}
                id={`movements[${index}].key` as const}
                control={control}
                options={Object.values(KEY).map((key) => ({
                  value: key,
                  label: formatToPhraseCase(key),
                }))}
                isRequired={true}
                fieldError={errors?.movements?.[index]?.key}
              />

              <SectionArray
                nestIndex={index}
                {...{ control, register, getValues, setValue, errors, watch }}
                tempoIndicationList={tempoIndicationList}
                onTempoIndicationCreated={onTempoIndicationCreated}
              />
              <section className="my-4 flex gap-2 w-full justify-between">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() =>
                    isLastItem
                      ? append(getMovementDefaultValues())
                      : insert(index + 1, getMovementDefaultValues())
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
                onClick={() => {
                  append(getMovementDefaultValues());
                }}
              >
                <PlusIcon className="w-4 h-4" />
                Add Movement
              </button>
            </div>
          </section>
        )}
      </ul>
    </>
  );
}
