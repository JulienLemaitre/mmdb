// 'use client'
import { useFieldArray } from "react-hook-form";
import ControlledSelect from "@/components/ReactHookForm/ControlledSelect";
import { FormInput } from "@/components/ReactHookForm/FormInput";
import PlusIcon from "@/components/svg/PlusIcon";
import TrashIcon from "@/components/svg/TrashIcon";

export default function SectionArray({
  control,
  register,
  setValue,
  getValues,
  errors,
  nestIndex,
  tempoIndicationList,
  watch,
}) {
  const { fields, append, prepend, remove, swap, move, insert } = useFieldArray(
    {
      control,
      name: `movements[${nestIndex}].sections`,
    },
  );

  return (
    <div className="pl-4 border-l-accent border-l-2 my-4">
      <ul>
        {fields.map((item, index, sectionArray) => {
          const isMetreFieldDisabled =
            watch(`movements[${nestIndex}].sections.${index}.isCommonTime`) ===
              "true" ||
            watch(`movements[${nestIndex}].sections.${index}.isCutTime`) ===
              "true";

          return (
            <li key={item.id}>
              <h4 className="my-4 text-xl font-bold text-accent">{`Section ${
                index + 1
              }`}</h4>
              <input
                value={index + 1}
                {...register(
                  `movements[${nestIndex}].sections.${index}.rank` as const,
                )}
                hidden
              />
              <div className="flex gap-2 items-center">
                <div className="text-lg font-bold">Metre :</div>
                <div className="flex flex-col gap-1">
                  <FormInput
                    name={
                      `movements[${nestIndex}].sections.${index}.metreNumerator` as const
                    }
                    // label="Metre numerator"
                    type="number"
                    inputClassName="w-20"
                    disabled={isMetreFieldDisabled}
                    // defaultValue={``}
                    {...{ register, errors }}
                  />
                  <div className="divider border-black my-0" />
                  <FormInput
                    name={
                      `movements[${nestIndex}].sections.${index}.metreDenominator` as const
                    }
                    // label="Metre denominator"
                    type="number"
                    inputClassName="w-20"
                    disabled={isMetreFieldDisabled}
                    // defaultValue={``}
                    {...{ register, errors }}
                  />
                </div>
                <label className="text-5xl flex items-center">
                  <input
                    {...register(
                      `movements[${nestIndex}].sections.${index}.isCommonTime` as const,
                      { required: "This is required" },
                    )}
                    name={
                      `movements[${nestIndex}].sections.${index}.isCommonTime` as const
                    }
                    value={true}
                    onClick={(e) => {
                      // @ts-ignore
                      const isChecked = e?.target?.checked;

                      if (
                        isChecked &&
                        getValues(`movements[${nestIndex}].sections.${index}`)
                      ) {
                        setValue(
                          `movements[${nestIndex}].sections.${index}.isCutTime`,
                          undefined,
                        );
                        setValue(
                          `movements[${nestIndex}].sections.${index}.metreNumerator`,
                          4,
                        );
                        setValue(
                          `movements[${nestIndex}].sections.${index}.metreDenominator`,
                          4,
                        );
                      }
                    }}
                    type="checkbox"
                    className="mr-2"
                  />
                  {`\u{1D134}`}
                </label>
                <label className="text-5xl flex items-center">
                  <input
                    {...register(
                      `movements[${nestIndex}].sections.${index}.isCutTime` as const,
                      { required: "This is required" },
                    )}
                    name={
                      `movements[${nestIndex}].sections.${index}.isCutTime` as const
                    }
                    value={true}
                    onClick={(e) => {
                      // @ts-ignore
                      const isChecked = e?.target?.checked;

                      if (
                        isChecked &&
                        getValues(`movements[${nestIndex}].sections.${index}`)
                      ) {
                        setValue(
                          `movements[${nestIndex}].sections.${index}.isCommonTime`,
                          undefined,
                        );
                        setValue(
                          `movements[${nestIndex}].sections.${index}.metreNumerator`,
                          2,
                        );
                        setValue(
                          `movements[${nestIndex}].sections.${index}.metreDenominator`,
                          2,
                        );
                      }
                    }}
                    type="checkbox"
                    className="mr-2 ml-4"
                  />
                  <span>{`\u{1D135}`}</span>
                </label>
              </div>
              <FormInput
                name={
                  `movements[${nestIndex}].sections.${index}.fastestStructuralNotesPerBar` as const
                }
                label={`Fastest structural notes per bar`}
                type="number"
                {...{ register, errors }}
              />
              <label>
                <input
                  {...register(
                    `movements[${nestIndex}].sections.${index}.isFastestStructuralNoteBelCanto` as const,
                  )}
                  name={
                    `movements[${nestIndex}].sections.${index}.isFastestStructuralNoteBelCanto` as const
                  }
                  value={true}
                  type="checkbox"
                  className="mr-2"
                />
                Is bel canto
              </label>
              <FormInput
                name={
                  `movements[${nestIndex}].sections.${index}.fastestStaccatoNotesPerBar` as const
                }
                label={`Fastest staccato notes per bar`}
                type="number"
                {...{ register, errors }}
              />
              <FormInput
                name={
                  `movements[${nestIndex}].sections.${index}.fastestRepeatedNotesPerBar` as const
                }
                label={`Fastest repeated notes per bar`}
                type="number"
                {...{ register, errors }}
              />
              <FormInput
                name={
                  `movements[${nestIndex}].sections.${index}.fastestOrnamentalNotesPerBar` as const
                }
                label={`Fastest ornamental notes per bar`}
                type="number"
                {...{ register, errors }}
              />
              <FormInput // TODO: button "add a comment" and a textarea
                name={
                  `movements[${nestIndex}].sections.${index}.comment` as const
                }
                label={`Comment`}
                defaultValue={``}
                {...{ register, errors }}
              />
              <ControlledSelect
                name={
                  `movements[${nestIndex}].sections.${index}.tempoIndication` as const
                }
                label={`Tempo indication`}
                id={
                  `movements[${nestIndex}].sections.${index}.tempoIndication` as const
                }
                control={control}
                options={tempoIndicationList.map((ti) => ({
                  value: ti.id,
                  label: ti.text,
                }))}
                isRequired={true}
                errors={errors}
              />
              {index === sectionArray.length - 1 && (
                <section className="my-4 flex gap-2 w-full justify-between">
                  <button
                    type="button"
                    className="btn btn-accent"
                    onClick={() => {
                      append({ rank: "append" });
                    }}
                  >
                    <PlusIcon className="w-5 h-5" />
                    Add section
                  </button>
                  <button
                    type="button"
                    className="btn btn-error"
                    onClick={() => remove(index)}
                  >
                    <TrashIcon className="w-5 h-5" />
                    {`Delete section ${index + 1}`}
                  </button>
                </section>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
