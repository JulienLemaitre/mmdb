import React, { ChangeEvent, useState } from "react";
import { REFERENCE_TYPE } from "@prisma/client";
import { ReferenceInput } from "@/types/formTypes";
import getReferenceTypeLabel from "@/utils/getReferenceTypeLabel";
import SimpleSelect from "@/ui/form/SimpleSelect";
import { SimpleInput } from "@/ui/form/SimpleInput";
import dynamic from "next/dynamic";

const DuplicatePlateNumberWarningModal = dynamic(
  () => import("@/ui/modal/DuplicatePlateNumberWarningModal"),
  { ssr: false },
);
const duplicatePlateNumberWarningModalId = "duplicate-plate-number-modal";

type NewReferenceFormProps = {
  onReferenceCreated: (reference: ReferenceInput) => void;
  onCancel: () => void;
  currentReferences: ReferenceInput[];
};

const refTypeOptionList = Object.values(REFERENCE_TYPE).map((refType) => ({
  value: refType,
  label: getReferenceTypeLabel(refType),
}));
const ERROR_INIT = { type: "", value: "" };

function NewReferenceForm({
  onReferenceCreated,
  onCancel,
  currentReferences,
}: NewReferenceFormProps) {
  const [error, setError] = useState(ERROR_INIT);
  const [refType, setRefType] = useState<REFERENCE_TYPE>();
  const [refValue, setRefValue] = useState<string>();
  const [isCheckingReference, setIsCheckingReference] = useState(false);
  const [mMSourceListToCheck, setMMSourceListToCheck] = useState<any[]>([]);

  const onRefTypeSelect = (option) => {
    setError((er) => ({ ...er, type: "" }));
    setRefType(option.value as REFERENCE_TYPE);
  };

  const onRefValueChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError((er) => ({ ...er, value: "" }));
    setRefValue(e.target.value);
  };

  const onDuplicatePlateNumberModalWarning = () => {
    //@ts-ignore => Daisy UI modal has an unconventional showModal method
    document?.getElementById(duplicatePlateNumberWarningModalId)?.showModal();
  };

  const createNewReference = () => {
    const data = {
      type: refTypeOptionList.find(
        (typeOption) => typeOption.value === refType,
      ),
      reference: refValue,
    } as ReferenceInput;
    onReferenceCreated(data);
    setError(ERROR_INIT);
  };

  const onCancelDuplicatePlateNumberReference = () => {
    console.log(`[onCancelDuplicatePlateNumberReference] `);
    setRefType(undefined);
    setRefValue(undefined);
    onCancel();
  };

  const onNewReferenceSubmit = async (e) => {
    e.preventDefault();
    let hasError = false;
    if (!refType) {
      setError((er) => ({ ...er, type: "Missing reference type" }));
      hasError = true;
    }
    if (!refValue) {
      setError((er) => ({ ...er, value: "Missing reference value" }));
      hasError = true;
    }
    if (refType && refValue && !hasError) {
      setIsCheckingReference(true);

      // Check if the reference already exists in new values
      if (
        currentReferences?.some(
          (ref) => ref.type.value === refType && ref.reference === refValue,
        )
      ) {
        setError((er) => ({
          ...er,
          value: "This reference already exists here around",
        }));
        setIsCheckingReference(false);
        return;
      }

      // Check if the reference is already in the database
      const existingReference = await fetch(
        `/api/reference/get?type=${refType}&reference=${refValue}`,
      ).then((response) => response.json());

      if (existingReference?.error) {
        setError({
          value: "",
          type: existingReference.error,
        });
        setIsCheckingReference(false);
        return;
      }

      if (existingReference) {
        //If reference already exists :
        // - for ISBN and ISMN reference, display an error message
        if (
          refType === REFERENCE_TYPE.ISBN ||
          refType === REFERENCE_TYPE.ISMN
        ) {
          setError((er) => ({
            ...er,
            value: "This reference is already in the database",
          }));
          setIsCheckingReference(false);
          return;
        }
        if (refType === REFERENCE_TYPE.PLATE_NUMBER) {
          await fetch(`/api/mMSource/getForPlateNumber?plateNumber=${refValue}`)
            .then((response) => {
              if (!response.ok)
                throw new Error(
                  `Error ${response.status} when fetching mMSource for plate number ${refValue}`,
                );
              return response.json();
            })
            .then((mMSourceList) => {
              if (mMSourceList && mMSourceList.length > 0) {
                setMMSourceListToCheck(mMSourceList);
                onDuplicatePlateNumberModalWarning();
              } else {
                console.warn(
                  `[useEffect] No mMSource found for plate number ${refValue}`,
                );
              }
            })
            .catch((error) => {
              console.error(
                `[useEffect] Error when fetching mMSource for plate number ${refValue}`,
                error.status,
                error.statusMessage,
              );
              setMMSourceListToCheck([]);
              onDuplicatePlateNumberModalWarning();
            });
        }

        setIsCheckingReference(false);
        return;
      }

      // If reference is unique, create new reference
      if (!existingReference) {
        createNewReference();
      }

      setIsCheckingReference(false);
    }
  };

  return (
    <div className="border-accent border-1 rounded-md px-6 pt-4 pb-6 my-3">
      <h6 className="mb-2 text-lg font-normal text-accent">
        {`Add a reference`}
      </h6>

      <div className="flex items-end gap-3">
        <div className="shrink-0 min-w-[230px]">
          <SimpleSelect
            name={`type` as const}
            label={`Type`}
            id={`type` as const}
            options={refTypeOptionList}
            isRequired={true}
            error={error.type}
            value={refTypeOptionList.find(
              (typeOption) => typeOption.value === refType,
            )}
            onChange={onRefTypeSelect}
            // defaultValue={}
          />
        </div>
        <SimpleInput
          name={`reference` as const}
          isRequired
          label="Reference Value"
          error={error.value}
          onInputChange={onRefValueChange}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 items-center mt-6">
        <button className="btn btn-neutral" type="button" onClick={onCancel}>
          Cancel
        </button>
        <button
          className="btn btn-primary"
          onClick={onNewReferenceSubmit}
          disabled={isCheckingReference}
        >
          Submit
          {isCheckingReference && (
            <span className="loading loading-spinner loading-sm"></span>
          )}
        </button>
      </div>
      <DuplicatePlateNumberWarningModal
        modalId={duplicatePlateNumberWarningModalId}
        onConfirm={createNewReference}
        onCancel={onCancelDuplicatePlateNumberReference}
        refValue={refValue}
        mMSourceListToCheck={mMSourceListToCheck}
      />
    </div>
  );
}

export default NewReferenceForm;
