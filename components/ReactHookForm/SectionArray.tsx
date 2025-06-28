import { useFieldArray } from "react-hook-form";
import { FormInput } from "@/components/ReactHookForm/FormInput";
import PlusIcon from "@/components/svg/PlusIcon";
import TrashIcon from "@/components/svg/TrashIcon";
import { getSectionDefaultValues } from "@/components/ReactHookForm/formUtils";
import ArrowUpIcon from "@/components/svg/ArrowUpIcon";
import ArrowDownIcon from "@/components/svg/ArrowDownIcon";
import ControlledCreatableSelect from "@/components/ReactHookForm/ControlledCreatableSelect";
import { TempoIndicationState } from "@/types/formTypes";
import CommonTimeIcon from "@/components/svg/CommonTimeIcon";
import React from "react";
import CutTimeIcon from "@/components/svg/CutTimeIcon";

export default function SectionArray({
  control,
  register,
  setValue,
  getValues,
  errors,
  nestIndex,
  tempoIndicationList,
  onTempoIndicationCreated,
  watch,
}) {
  const { fields, append, remove, swap, insert } = useFieldArray({
    control,
    name: `movements[${nestIndex}].sections`,
  });

  return (
    <div className="my-4">
      <ul>
        {fields.map((item, index, sectionArray) => {
          const isLastItem = index === sectionArray.length - 1;
          const isMetreFieldDisabled =
            watch(`movements[${nestIndex}].sections[${index}].isCommonTime`) ||
            watch(`movements[${nestIndex}].sections[${index}].isCutTime`);

          return (
            <li key={item.id} className="px-4 border-accent border-2 my-3">
              <h6 className="my-4 text-lg font-normal text-accent">{`Section ${
                index + 1
              }`}</h6>
              <input
                {...register(
                  `movements[${nestIndex}].sections[${index}].id` as const,
                )}
                hidden
              />
              <div className="flex gap-2 items-center">
                <div>
                  Time Signature :<span className="text-red-500 ml-1">*</span>
                </div>
                <div className="flex flex-col gap-1">
                  <FormInput
                    name={
                      `movements[${nestIndex}].sections[${index}].metreNumerator` as const
                    }
                    // label="Metre numerator"
                    inputMode="numeric"
                    inputClassName="w-20"
                    disabled={isMetreFieldDisabled}
                    // defaultValue={``}
                    {...{ register, control, errors }}
                  />
                  <div className="divider border-black my-0" />
                  <div className="mt-[-0.5rem]">
                    <FormInput
                      name={
                        `movements[${nestIndex}].sections[${index}].metreDenominator` as const
                      }
                      inputMode="numeric"
                      inputClassName="w-20"
                      disabled={isMetreFieldDisabled}
                      {...{ register, control, errors }}
                    />
                  </div>
                </div>
                <label className="text-5xl flex items-center">
                  <input
                    {...register(
                      `movements[${nestIndex}].sections[${index}].isCommonTime` as const,
                      { required: "This is required" },
                    )}
                    name={
                      `movements[${nestIndex}].sections[${index}].isCommonTime` as const
                    }
                    onClick={(e) => {
                      // @ts-ignore
                      const isChecked = e?.target?.checked;

                      if (
                        isChecked &&
                        getValues(`movements[${nestIndex}].sections[${index}]`)
                      ) {
                        setValue(
                          `movements[${nestIndex}].sections[${index}].isCutTime`,
                          false,
                        );
                        setValue(
                          `movements[${nestIndex}].sections[${index}].metreNumerator`,
                          4,
                        );
                        setValue(
                          `movements[${nestIndex}].sections[${index}].metreDenominator`,
                          4,
                        );
                      }
                    }}
                    type="checkbox"
                    className="mr-2"
                  />
                  <CommonTimeIcon className="h-6" />
                </label>
                <label className="text-5xl flex items-center">
                  <input
                    {...register(
                      `movements[${nestIndex}].sections[${index}].isCutTime` as const,
                      { required: "This is required" },
                    )}
                    name={
                      `movements[${nestIndex}].sections[${index}].isCutTime` as const
                    }
                    onClick={(e) => {
                      // @ts-ignore
                      const isChecked = e?.target?.checked;

                      if (
                        isChecked &&
                        getValues(`movements[${nestIndex}].sections[${index}]`)
                      ) {
                        setValue(
                          `movements[${nestIndex}].sections[${index}].isCommonTime`,
                          false,
                        );
                        setValue(
                          `movements[${nestIndex}].sections[${index}].metreNumerator`,
                          2,
                        );
                        setValue(
                          `movements[${nestIndex}].sections[${index}].metreDenominator`,
                          2,
                        );
                      }
                    }}
                    type="checkbox"
                    className="mr-2 ml-4"
                  />
                  <CutTimeIcon className="h-8" />
                </label>
              </div>
              <ControlledCreatableSelect
                name={
                  `movements[${nestIndex}].sections[${index}].tempoIndication` as const
                }
                label={`Tempo indication`}
                isRequired
                id={
                  `movements[${nestIndex}].sections[${index}].tempoIndication` as const
                }
                control={control}
                options={tempoIndicationList.map(
                  (ti: TempoIndicationState) => ({
                    value: ti.id,
                    label: ti.text,
                  }),
                )}
                onOptionCreated={onTempoIndicationCreated}
                fieldError={
                  errors?.movements?.[nestIndex]?.sections?.[index]
                    ?.tempoIndication
                }
              />
              <FormInput
                isRequired={true}
                name={
                  `movements[${nestIndex}].sections[${index}].fastestStructuralNotesPerBar` as const
                }
                label={`Fastest structural notes per bar`}
                inputMode="numeric"
                {...{ register, control, errors }}
              />
              <label>
                <input
                  {...register(
                    `movements[${nestIndex}].sections[${index}].isFastestStructuralNoteBelCanto` as const,
                  )}
                  name={
                    `movements[${nestIndex}].sections[${index}].isFastestStructuralNoteBelCanto` as const
                  }
                  type="checkbox"
                  className="mr-2"
                />
                Is bel canto
              </label>
              <FormInput
                name={
                  `movements[${nestIndex}].sections[${index}].fastestStaccatoNotesPerBar` as const
                }
                label={`Fastest staccato notes per bar`}
                inputMode="numeric"
                {...{ register, control, errors }}
              />
              <FormInput
                name={
                  `movements[${nestIndex}].sections[${index}].fastestRepeatedNotesPerBar` as const
                }
                label={`Fastest repeated notes per bar`}
                inputMode="numeric"
                {...{ register, control, errors }}
              />
              <FormInput
                name={
                  `movements[${nestIndex}].sections[${index}].fastestOrnamentalNotesPerBar` as const
                }
                label={`Fastest ornamental notes per bar`}
                inputMode="numeric"
                {...{ register, control, errors }}
              />
              <FormInput
                name={
                  `movements[${nestIndex}].sections[${index}].comment` as const
                }
                label={`Comment`}
                defaultValue={``}
                {...{ register, control, errors }}
              />
              <FormInput
                name={
                  `movements[${nestIndex}].sections[${index}].commentForReview` as const
                }
                label={`Comment for review`}
                defaultValue={``}
                {...{ register, control, errors }}
              />
              <section className="my-4 flex gap-2 w-full justify-between">
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn btn-accent btn-sm"
                    onClick={() =>
                      isLastItem
                        ? append(getSectionDefaultValues())
                        : insert(index + 1, getSectionDefaultValues())
                    }
                  >
                    <PlusIcon className="w-5 h-5" />
                    Add Section
                  </button>
                  <button
                    type="button"
                    className="btn btn-error btn-sm"
                    onClick={() => remove(index)}
                  >
                    <TrashIcon className="w-5 h-5" />
                    {`Delete Section ${index + 1}`}
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
                      Move Section up
                    </button>
                  )}

                  {index < sectionArray.length - 1 && (
                    <button
                      type="button"
                      className="btn btn-move btn-sm"
                      onClick={() => {
                        swap(index, index + 1);
                      }}
                    >
                      <ArrowDownIcon className="w-5 h-5" />
                      Move Section down
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
                className="btn btn-accent btn-sm"
                onClick={() => {
                  append(getSectionDefaultValues());
                }}
              >
                <PlusIcon className="w-5 h-5" />
                Add section
              </button>
            </div>
          </section>
        )}
      </ul>
    </div>
  );
}
