import { useFieldArray } from "react-hook-form";
import ControlledSelect from "@/components/ReactHookForm/ControlledSelect";
import TrashIcon from "@/components/svg/TrashIcon";
import { FormInput } from "@/components/ReactHookForm/FormInput";
import { NOTE_VALUE } from "@prisma/client";
import { useState } from "react";

export default function MetronomeMarkArray({
  control,
  register,
  errors,
  watch,
  sectionList,
  setValue,
}) {
  const { fields, append, prepend, remove, swap, move, insert } = useFieldArray(
    {
      control,
      name: "metronomeMarks",
    },
  );
  const [commentToShow, setCommentToShow] = useState<number[]>([]);

  return (
    <>
      <h3 className="text-xl font-bold text-accent mt-4">MetronomeMarks</h3>
      <ul>
        {fields.map((item, index) => {
          console.log(`[MetronomeMarkArray] item ${index} :`, item);
          const section = sectionList[index];
          console.log(`[MetronomeMarkArray] section :`, section);
          const rank = section.movement.rank;
          const key = section.movement.key;
          const tempoIndication = section.tempoIndication?.text;

          return (
            <li key={item.id}>
              <h4 className="mt-6 text-lg font-bold text-secondary">
                {`Mvt ${rank} in ${key.replaceAll("_", " ")} - Section ${
                  index + 1
                }`}
                <span className="italic">
                  {tempoIndication && ` - ${tempoIndication}`}
                </span>
              </h4>
              <div className="flex items-end gap-3">
                <ControlledSelect
                  name={`metronomeMarks[${index}].beatUnit` as const}
                  label={`Beat unit`}
                  id={`metronomeMarks[${index}].beatUnit` as const}
                  control={control}
                  options={Object.keys(NOTE_VALUE).map((key) => ({
                    value: key,
                    label: key.replaceAll("_", " "),
                  }))}
                  isRequired={true}
                  errors={errors}
                />
                <FormInput
                  name={`metronomeMarks[${index}].bpm` as const}
                  isRequired
                  label="BPM"
                  type="number"
                  {...{ register, watch, errors }}
                />
                {!commentToShow.includes(index) && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setCommentToShow((prev) => [...prev, index])}
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
                    onClick={() => {
                      setValue(`metronomeMarks[${index}].comment`, "");
                      setCommentToShow((prev) =>
                        prev.filter((item) => item !== index),
                      );
                    }}
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
