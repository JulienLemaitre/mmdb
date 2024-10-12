import { useFieldArray } from "react-hook-form";
import ControlledSelect from "@/components/ReactHookForm/ControlledSelect";
import TrashIcon from "@/components/svg/TrashIcon";
import PlusIcon from "@/components/svg/PlusIcon";
import { FormInput } from "@/components/ReactHookForm/FormInput";
import { REFERENCE_TYPE } from "@prisma/client";
import getReferenceTypeLabel from "@/utils/getReferenceTypeLabel";

export default function ReferenceArray({
  control,
  register,
  errors,
  onReferenceBlur,
  onReferenceInputChange,
  isCheckingReference,
  isReferenceDirty,
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "references",
  });

  return (
    <>
      <h3 className="text-xl font-bold text-accent mt-4">References</h3>
      <ul>
        {fields.map((item, index) => (
          <li key={item.id}>
            <h4 className="mt-6 text-lg font-bold text-secondary">{`Reference ${
              index + 1
            }`}</h4>
            <div className="flex items-end gap-3">
              <div className="flex-shrink-0 min-w-40">
                <ControlledSelect
                  name={`references[${index}].type` as const}
                  label={`Type`}
                  id={`references[${index}].type` as const}
                  control={control}
                  options={Object.values(REFERENCE_TYPE).map((refType) => ({
                    value: refType,
                    label: getReferenceTypeLabel(refType),
                  }))}
                  isRequired={true}
                  errors={errors}
                />
              </div>
              <FormInput
                name={`references[${index}].reference` as const}
                isRequired
                label="Value"
                onBlur={() => onReferenceBlur(index)}
                onInputChange={() => onReferenceInputChange(index)}
                {...{ register, control, errors }}
                isLoading={isCheckingReference}
              />
              <button
                type="button"
                className="btn btn-error btn-sm"
                onClick={() => remove(index)}
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </li>
        ))}
        <button
          type="button"
          className="btn btn-secondary btn-sm mt-4"
          disabled={isReferenceDirty}
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
