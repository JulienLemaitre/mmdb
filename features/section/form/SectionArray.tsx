import React, { useState } from "react";
import { useFieldArray } from "react-hook-form";
import dynamic from "next/dynamic";
import { FormInput, FormTextarea } from "@/ui/form/FormInput";
import PlusIcon from "@/ui/svg/PlusIcon";
import TrashIcon from "@/ui/svg/TrashIcon";
import ArrowUpIcon from "@/ui/svg/ArrowUpIcon";
import ArrowDownIcon from "@/ui/svg/ArrowDownIcon";
import ControlledCreatableSelect from "@/ui/form/ControlledCreatableSelect";
import { SectionInput, TempoIndicationState } from "@/types/formTypes";
import CommonTimeIcon from "@/ui/svg/CommonTimeIcon";
import CutTimeIcon from "@/ui/svg/CutTimeIcon";
import { getSectionDefaultValues } from "@/features/section/utils/getSectionDefaultValues";
import { NEED_CONFIRMATION_MODAL_ID } from "@/utils/constants";
import ChevronDownIcon from "@/ui/svg/ChevronDownIcon";
import SectionOverview from "@/features/section/ui/SectionOverview";

const NeedConfirmationModal = dynamic(
  () => import("@/ui/modal/NeedConfirmationModal"),
  { ssr: false },
);

export default function SectionArray({
  control,
  register,
  setValue,
  getValues,
  errors,
  nestIndex,
  tempoIndicationList,
  onTempoIndicationSelected,
  onTempoIndicationCreated,
}) {
  const { fields, append, remove, swap, insert } = useFieldArray({
    control,
    name: `movements[${nestIndex}].sections` as "movements.0.sections",
  });

  const [sectionIndexToRemove, setSectionIndexToRemove] = useState<
    number | null
  >(null);
  const [closedSections, setClosedSections] = useState<boolean[]>(
    new Array(fields.length).fill(false),
  );

  const onSectionOpen = (index: number) => {
    const newClosedSections = [...closedSections];
    newClosedSections[index] =
      typeof newClosedSections[index] === "boolean"
        ? !newClosedSections[index]
        : false;
    setClosedSections(newClosedSections);
  };

  const onAppendSection = () => {
    setClosedSections((prev) => [...prev, false]);
    append(getSectionDefaultValues());
  };

  const onInsertSection = (index: number) => {
    setClosedSections((prev) => {
      let newClosedSections = [...prev];
      const arrayBefore = newClosedSections.slice(0, index + 1);
      newClosedSections = [
        ...arrayBefore,
        false,
        ...newClosedSections.slice(index + 1),
      ];
      return newClosedSections;
    });
    insert(index + 1, getSectionDefaultValues());
  };

  const onSwapSections = (index1: number, index2: number) => {
    setClosedSections((prev) => {
      const newClosedSections = [...prev];
      const temp = newClosedSections[index1];
      newClosedSections[index1] = newClosedSections[index2];
      newClosedSections[index2] = temp;
      return newClosedSections;
    });
    swap(index1, index2);
  };

  const onRemoveSection = () => {
    if (sectionIndexToRemove !== null) {
      setClosedSections((prev) =>
        prev.filter((_, i) => i !== sectionIndexToRemove),
      );
      remove(sectionIndexToRemove);
      setSectionIndexToRemove(null);
    }
  };

  return (
    <div className="my-4">
      <ul>
        {fields.map((item, index, sectionArray) => {
          const isLastItem = index === sectionArray.length - 1;
          const isMetreFieldDisabled =
            getValues(
              `movements[${nestIndex}].sections[${index}].isCommonTime`,
            ) ||
            getValues(`movements[${nestIndex}].sections[${index}].isCutTime`);
          const isSectionOpen = !closedSections[index];
          const sectionInfos = getValues(
            `movements[${nestIndex}].sections[${index}]`,
          ) as SectionInput;

          return (
            <li
              key={item.id}
              className={`my-3 px-4 pt-3 border border-base-300 rounded-lg hover:border-accent/25 hover:shadow-xs hover:bg-accent/5 transition-all duration-150`}
            >
              <div className="flex justify-between w-full pl-0">
                <div className="flex items-center gap-2">
                  <button
                    className={`btn btn-circle btn-ghost hover:bg-accent/80 transition-all duration-150 ${isSectionOpen ? "" : "-rotate-90"}`}
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                      event.preventDefault();
                      onSectionOpen(index);
                    }}
                    onKeyDown={(
                      event: React.KeyboardEvent<HTMLButtonElement>,
                    ) => {
                      event.preventDefault();
                      if (event.key === "Enter" || event.key === " ") {
                        onSectionOpen(index);
                      }
                    }}
                  >
                    <ChevronDownIcon className="w-4 h-4" />
                  </button>
                  <h6 className="text-lg font-normal text-accent">{`Section ${
                    index + 1
                  }`}</h6>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost hover:bg-error hover:text-neutral"
                    onClick={() => setSectionIndexToRemove(index)}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost disabled:bg-transparent"
                    onClick={() => {
                      onSwapSections(index, index - 1);
                    }}
                    disabled={index === 0}
                  >
                    <ArrowUpIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost disabled:bg-transparent"
                    onClick={() => {
                      onSwapSections(index, index + 1);
                    }}
                    disabled={index === sectionArray.length - 1}
                  >
                    <ArrowDownIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <input
                {...register(
                  `movements[${nestIndex}].sections[${index}].id` as const,
                )}
                hidden
              />
              <div
                className={`${isSectionOpen ? "hidden" : ""} transition-all duration-150`}
              >
                <SectionOverview section={sectionInfos} />
              </div>
              <div
                className={`${isSectionOpen ? "" : "hidden transition-all duration-150"}`}
              >
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
                    <div className="-mt-2">
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
                          getValues(
                            `movements[${nestIndex}].sections[${index}]`,
                          )
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
                          getValues(
                            `movements[${nestIndex}].sections[${index}]`,
                          )
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
                  onOptionSelected={onTempoIndicationSelected}
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
                <FormInput
                  name={
                    `movements[${nestIndex}].sections[${index}].fastestBelCantoNotesPerBar` as const
                  }
                  label={`Fastest bel canto notes per bar`}
                  inputMode="numeric"
                  {...{ register, control, errors }}
                />
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
                <FormTextarea
                  name={
                    `movements[${nestIndex}].sections[${index}].comment` as const
                  }
                  label={`Comment`}
                  {...{ register, control, errors }}
                />
                <FormTextarea
                  name={
                    `movements[${nestIndex}].sections[${index}].commentForReview` as const
                  }
                  label={`Comment for review`}
                  {...{ register, control, errors }}
                />
              </div>
              <section className="my-4 flex gap-2 w-full justify-between">
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn btn-accent btn-sm"
                    onClick={() =>
                      isLastItem ? onAppendSection() : onInsertSection(index)
                    }
                  >
                    <PlusIcon className="w-4 h-4" />
                    Add Section
                  </button>
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
                  onAppendSection();
                }}
              >
                <PlusIcon className="w-4 h-4" />
                Add section
              </button>
            </div>
          </section>
        )}
        <NeedConfirmationModal
          modalId={`${NEED_CONFIRMATION_MODAL_ID}-section-${nestIndex}`}
          onConfirm={onRemoveSection}
          onCancel={() => setSectionIndexToRemove(null)}
          description={`Delete this section`}
          isOpened={sectionIndexToRemove !== null}
        />
      </ul>
    </div>
  );
}
