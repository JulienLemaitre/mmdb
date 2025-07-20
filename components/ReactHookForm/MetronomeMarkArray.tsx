import { useFieldArray } from "react-hook-form";
import ControlledSelect from "@/components/ReactHookForm/ControlledSelect";
import TrashIcon from "@/components/svg/TrashIcon";
import { FormInput } from "@/components/ReactHookForm/FormInput";
import { NOTE_VALUE } from "@prisma/client";
import React, { Fragment, useEffect, useState } from "react";
import { useFeedForm } from "@/components/context/feedFormContext";
import formatToPhraseCase from "@/utils/formatToPhraseCase";
import { SectionStateExtendedForMMForm } from "@/types/formTypes";
import CommonTimeIcon from "@/components/svg/CommonTimeIcon";
import CutTimeIcon from "@/components/svg/CutTimeIcon";

export default function MetronomeMarkArray({
  control,
  register,
  errors,
  watch,
  sectionList,
  setValue,
  getValues,
}) {
  useFieldArray({
    control,
    name: "metronomeMarks",
  });
  const [commentToShow, setCommentToShow] = useState<number[]>([]);
  const { state } = useFeedForm();

  // show previously saved comments on mount
  useEffect(() => {
    getValues("metronomeMarks").forEach((mm: any, index: number) =>
      mm.comment
        ? setCommentToShow((prev) =>
            prev.indexOf(index) > -1 ? prev : [...prev, index],
          )
        : null,
    );
  }, [getValues]);

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
        {sectionList.map(
          (section: SectionStateExtendedForMMForm, index: number) => {
            const isPieceBeginning =
              index === 0 ||
              section.pieceId !== sectionList[index - 1].pieceId ||
              section.mMSourceOnPieceVersion.pieceVersionId !==
                sectionList[index - 1].mMSourceOnPieceVersion.pieceVersionId;
            const movementRank = section.movement.rank;
            const key = section.movement.key.replaceAll("_", " ");
            const tempoIndication = section.tempoIndication?.text;
            const comment = section.comment;
            const isNoMMChecked = !!watch(`metronomeMarks[${index}].noMM`);
            const piece = state.pieces?.find(
              (piece) => piece.id === section.pieceId,
            );
            const pieceVersion = state.pieceVersions?.find(
              (pv) => pv.id === section.mMSourceOnPieceVersion.pieceVersionId,
            );
            const movementCount = (pieceVersion?.movements || []).length;
            const isMonoMovementPiece = movementCount === 1;
            const { isCommonTime, isCutTime } = section;
            const isCommonOrCutTime = isCommonTime || isCutTime;

            return (
              <Fragment key={section.pieceId + section.id}>
                {isPieceBeginning ? (
                  <h3 className="text-xl font-bold text-accent mt-14">
                    {`${piece?.title}${isMonoMovementPiece ? ` in ${key}` : ""}`}
                  </h3>
                ) : null}
                {section.rank === 1 && !isMonoMovementPiece ? (
                  <h4 className="text-lg font-bold text-primary mt-6">
                    {`Movement ${movementRank} in ${key}`}
                  </h4>
                ) : null}
                <li>
                  <h5 className="mt-4 text-md font-bold text-secondary">
                    {`Section ${section.rank}\u2002-\u2002`}
                    {isCommonOrCutTime ? (
                      <>
                        <span className="common-time align-middle inline-block">
                          {isCommonTime ? (
                            <CommonTimeIcon className="h-3.5 relative bottom-0.5" />
                          ) : (
                            <CutTimeIcon className="h-5 relative bottom-0.5" />
                          )}
                        </span>
                        <b>{` (${section.metreNumerator}/${section.metreDenominator})`}</b>
                      </>
                    ) : (
                      <b>
                        {`${section.metreNumerator}/${section.metreDenominator}`}
                      </b>
                    )}
                    <span className="italic">
                      {tempoIndication && `\u2002-\u2002${tempoIndication}`}
                    </span>
                    <span className="font-normal italic text-neutral-content">
                      {comment && `\u2002-\u2002${comment}`}
                    </span>
                  </h5>
                  <input
                    {...register(`metronomeMarks[${index}].sectionId`, {
                      value: section.id,
                    })}
                    type="hidden"
                  />
                  <div className="flex items-end gap-3">
                    <label className="text-md flex items-center btn btn-outline btn-sm mt-9">
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
                        label: formatToPhraseCase(key),
                      }))}
                      isRequired={!isNoMMChecked}
                      isDisabled={isNoMMChecked}
                      fieldError={errors?.metronomeMarks?.[index]?.beatUnit}
                    />
                    <FormInput
                      name={`metronomeMarks[${index}].bpm` as const}
                      isRequired={!isNoMMChecked}
                      disabled={isNoMMChecked}
                      label="BPM"
                      inputMode="numeric"
                      {...{ register, control, errors }}
                    />
                    {!commentToShow.includes(index) && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm mt-9"
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
                        {...{ register, control, errors }}
                      />
                      <button
                        type="button"
                        className="btn btn-error btn-sm"
                        onClick={() => onRemoveComment(index)}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </li>
              </Fragment>
            );
          },
        )}
      </ul>
    </>
  );
}
