import { useFieldArray } from "react-hook-form";
import ControlledSelect from "@/components/ReactHookForm/ControlledSelect";
import TrashIcon from "@/components/svg/TrashIcon";
import PlusIcon from "@/components/svg/PlusIcon";
import { FormInput } from "@/components/ReactHookForm/FormInput";

const REFERENCE_TYPE = {
  PLATE_NUMBER: "Plate number",
  ISBN: "ISBN",
  ISMN: "ISMN",
} as const;

export default function MetronomeMarkArray({
  control,
  register,
  errors,
  watch,
  sectionList,
}) {
  const { fields, append, prepend, remove, swap, move, insert } = useFieldArray(
    {
      control,
      name: "metronomeMarks",
    },
  );

  return (
    <>
      <h3 className="text-xl font-bold text-accent mt-4">MetronomeMarks</h3>
      <ul>
        {fields.map((item, index) => {
          console.log(`[MetronomeMarkArray] item ${index} :`, item);
          const section = sectionList[index];
          console.log(`[MetronomeMarkArray] section :`, section);
          return (
            <li key={item.id}>
              <h4 className="mt-6 text-lg font-bold text-secondary">{`Mvt ${
                section.movement.rank
              } - Section ${index + 1}`}</h4>
              <div className="flex items-end gap-3">
                <ControlledSelect
                  name={`metronomeMarks[${index}].type` as const}
                  label={`MetronomeMark type`}
                  id={`metronomeMarks[${index}].type` as const}
                  control={control}
                  options={Object.entries(REFERENCE_TYPE).map(
                    ([key, value]) => ({
                      value: key,
                      label: value,
                    }),
                  )}
                  isRequired={true}
                  errors={errors}
                />
                <FormInput
                  name={`metronomeMarks[${index}].reference` as const}
                  isRequired
                  label="MetronomeMark"
                  {...{ register, watch, errors }}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => remove(index)}
                >
                  <TrashIcon />
                </button>
              </div>
            </li>
          );
        })}
        <button
          type="button"
          className="btn btn-secondary mt-3"
          onClick={() => {
            append({});
          }}
        >
          <PlusIcon className="w-5 h-5" />
          Add a reference (plate number, ISBN, ISMN...)
        </button>
      </ul>
    </>
  );
}
