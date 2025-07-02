import { Control, useFieldArray } from "react-hook-form";
import TrashIcon from "@/components/svg/TrashIcon";
import PlusIcon from "@/components/svg/PlusIcon";
import NewReferenceForm from "@/components/entities/reference/NewReferenceForm";
import { ReferenceInput, SourceDescriptionInput } from "@/types/formTypes";
import getReferenceTypeLabel from "@/utils/getReferenceTypeLabel";

type FormValues = SourceDescriptionInput;
type ReferenceArrayProps<TFormValues extends { references: ReferenceInput[] }> =
  {
    control: Control<TFormValues>;
    currentReferences: ReferenceInput[];
    isReferenceFormOpen: boolean;
    onReferenceFormOpen: () => void;
    onReferenceFormClose: () => void;
  };

export default function ReferenceArray({
  control,
  currentReferences,
  onReferenceFormOpen,
  onReferenceFormClose,
  isReferenceFormOpen,
}: ReferenceArrayProps<FormValues>) {
  const { fields, append, remove } = useFieldArray<FormValues>({
    control,
    name: "references",
  });

  const onReferenceCreated = (reference: ReferenceInput) => {
    append(reference as any);
    onReferenceFormClose();
  };

  const onCancelReferenceCreation = () => {
    onReferenceFormClose();
  };

  return (
    <>
      <h3 className="text-xl font-bold text-accent mt-4">References</h3>
      <ul>
        {fields.map((field, index) => (
          <li key={field.id} className="mt-4 w-full max-w-md">
            <div className="flex w-full justify-between gap-3 items-end">
              <div>
                <h4 className="text-lg font-bold text-secondary">{`Reference ${
                  index + 1
                }`}</h4>
                <div className="flex gap-3 items-center">
                  <div>
                    {getReferenceTypeLabel(
                      (field as ReferenceInput).type?.value,
                    )}
                  </div>
                  <div>{(field as ReferenceInput).reference}</div>
                </div>
              </div>
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
      </ul>
      {isReferenceFormOpen ? (
        <NewReferenceForm
          currentReferences={currentReferences}
          onCancel={onCancelReferenceCreation}
          onReferenceCreated={onReferenceCreated}
        />
      ) : (
        <button
          type="button"
          className="btn btn-secondary btn-sm mt-4"
          disabled={isReferenceFormOpen}
          onClick={onReferenceFormOpen}
        >
          <PlusIcon className="w-5 h-5" />
          Add a reference (plate number, ISBN, ISMN...)
        </button>
      )}
    </>
  );
}
