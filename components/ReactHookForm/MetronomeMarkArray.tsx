import { useFieldArray } from "react-hook-form";
import ControlledSelect from "@/components/ReactHookForm/ControlledSelect";
import TrashIcon from "@/components/svg/TrashIcon";
import { FormInput } from "@/components/ReactHookForm/FormInput";
import { NOTE_VALUE } from "@prisma/client";
import { Fragment, useState } from "react";

export default function MetronomeMarkArray({
  control,
  register,
  errors,
  watch,
  sectionList,
  setValue,
  getValues,
}) {
  const { fields } = useFieldArray({
    control,
    name: "metronomeMarks",
  });
  const [commentToShow, setCommentToShow] = useState<number[]>([]);

  const onRemoveComment = (index: number) => {
    setValue(`metronomeMarks[${index}].comment`, "");
    setCommentToShow((prev) => prev.filter((idx) => idx !== index));
  };

  const resetValue = (index: number, valueName: string) => {
    if (getValues(`metronomeMarks[${index}].[${valueName}]`)) {
      setValue(`metronomeMarks[${index}].[${valueName}]`, undefined);
    }
  };

  return (
    <>
      <ul>
        {sectionList.map((section, index) => {
          const movementRank = section.movement.rank;
          const key = section.movement.key;
          const tempoIndication = section.tempoIndication?.text;
          const isNoMMChecked = !!watch(`metronomeMarks[${index}].noMM`);

          return (
            <Fragment key={section.id}>
              {section.rank === 1 ? (
                <h3 className="text-xl font-bold text-accent mt-6">
                  {`Movement ${movementRank} in ${key.replaceAll("_", " ")}`}
                </h3>
              ) : null}
              <li key={section.id}>
                <h4 className="mt-4 text-lg font-bold text-secondary">
                  {`Section ${section.rank}`}
                  <span className="italic">
                    {tempoIndication && ` - ${tempoIndication}`}
                  </span>
                </h4>
                <input
                  {...register(`metronomeMarks[${index}].sectionId`, {
                    value: section.id,
                  })}
                  type="hidden"
                />
                <div className="flex items-end gap-3">
                  <label className="text-md flex items-center btn btn-outline mt-9">
                    <input
                      {...register(
                        `metronomeMarks[${index}].noMM` as const,
                        // { required: "This is required" },
                      )}
                      name={`metronomeMarks[${index}].noMM` as const}
                      onClick={(e) => {
                        // @ts-ignore
                        const isChecked = e?.target?.checked;

                        if (isChecked) {
                          setValue(`metronomeMarks[${index}].noMM`, true);
                          resetValue(index, "beatUnit");
                          resetValue(index, "bpm");
                          resetValue(index, "comment");
                        }
                        if (!isChecked) {
                          setValue(`metronomeMarks[${index}].noMM`, false);
                        }
                      }}
                      type="checkbox"
                      className="mr-2"
                    />
                    {`No Metronome Mark`}
                  </label>
                  <ControlledSelect
                    name={`metronomeMarks[${index}].beatUnit` as const}
                    label={`Beat unit`}
                    id={`metronomeMarks[${index}].beatUnit` as const}
                    control={control}
                    options={Object.keys(NOTE_VALUE).map((key) => ({
                      value: key,
                      label: key.replaceAll("_", " "),
                    }))}
                    isRequired={!isNoMMChecked}
                    isDisabled={isNoMMChecked}
                    errors={errors}
                  />
                  <FormInput
                    name={`metronomeMarks[${index}].bpm` as const}
                    isRequired={!isNoMMChecked}
                    disabled={isNoMMChecked}
                    label="BPM"
                    type="number"
                    {...{ register, watch, errors }}
                  />
                  {!commentToShow.includes(index) && (
                    <button
                      type="button"
                      className="btn btn-secondary mt-9"
                      disabled={isNoMMChecked}
                      onClick={() =>
                        setCommentToShow((prev) => [...prev, index])
                      }
                    >
                      Add a Comment
                    </button>
                  )}
                </div>
                {commentToShow.includes(index) && (
                  <div className="flex items-end gap-3">
                    <FormInput
                      name={`metronomeMarks[${index}].comment` as const}
                      label={`Comment`}
                      controlClassName="max-w-xl"
                      defaultValue={``}
                      {...{ register, errors }}
                    />
                    <button
                      type="button"
                      className="btn btn-error"
                      onClick={() => onRemoveComment(index)}
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </li>
            </Fragment>
          );
        })}
      </ul>
    </>
  );
}
