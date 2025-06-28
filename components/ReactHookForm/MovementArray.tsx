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
            <li key={item.id}>
              <h5 className="mt-6 text-xl font-normal text-secondary">{`Movement ${
                index + 1
              }${
                mvtArray.length === 1
                  ? ` (or whole piece if not divided in movements)`
                  : ""
              }`}</h5>
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
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() =>
                      isLastItem
                        ? append(getMovementDefaultValues())
                        : insert(index + 1, getMovementDefaultValues())
                    }
                  >
                    <PlusIcon className="w-5 h-5" />
                    Add Movement
                  </button>
                  <button
                    type="button"
                    className="btn btn-error btn-sm"
                    onClick={() => remove(index)}
                  >
                    <TrashIcon className="w-5 h-5" />
                    {`Delete Movement ${index + 1}`}
                  </button>
                </div>

                <div className="flex gap-2">
                  {index > 0 && (
                    <button
                      type="button"
                      className="btn btn-move btn-sm"
                      onClick={() => {
                        swap(index, index - 1);
                      }}
                    >
                      <ArrowUpIcon className="w-5 h-5" />
                      Move Movement up
                    </button>
                  )}

                  {index < mvtArray.length - 1 && (
                    <button
                      type="button"
                      className="btn btn-move btn-sm"
                      onClick={() => {
                        swap(index, index + 1);
                      }}
                    >
                      <ArrowDownIcon className="w-5 h-5" />
                      Move Movement down
                    </button>
                  )}
                </div>
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
                <PlusIcon className="w-5 h-5" />
                Add Movement
              </button>
            </div>
          </section>
        )}
      </ul>
    </>
  );
}
