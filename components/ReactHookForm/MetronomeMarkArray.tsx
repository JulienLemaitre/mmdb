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

// Utility function to organize sections into groups by collection, piece, movement
function processSectionsForDisplay(
  sectionList: SectionStateExtendedForMMForm[],
  feedFormState: any,
) {
  const processedGroups: Array<{
    type: "collection" | "single";
    collection?: any;
    pieces: Array<{
      piece: any;
      pieceVersion: any;
      composer: any;
      movements: Array<{
        movement: any;
        sections: Array<{
          section: SectionStateExtendedForMMForm;
          index: number;
        }>;
      }>;
    }>;
  }> = [];

  let currentGroup: (typeof processedGroups)[0] | null = null;
  console.log(`[] sectionList :`, sectionList);

  sectionList.forEach((section, index) => {
    const piece = feedFormState.pieces?.find(
      (p: any) => p.id === section.pieceId,
    );
    const pieceVersion = feedFormState.pieceVersions?.find(
      (pv: any) => pv.id === section.mMSourceOnPieceVersion.pieceVersionId,
    );
    const collection = piece?.collectionId
      ? feedFormState.collections?.find((c: any) => c.id === piece.collectionId)
      : null;
    const composer = feedFormState.persons?.find(
      (p: any) => p.id === piece?.composerId,
    );

    // Determine if we need a new group
    const needNewGroup =
      !currentGroup ||
      (collection &&
        (currentGroup.type !== "collection" ||
          currentGroup.collection?.id !== collection.id)) ||
      (!collection &&
        (currentGroup.type !== "single" ||
          currentGroup.pieces.some((p) => p.piece.id !== piece.id)));

    if (needNewGroup) {
      currentGroup = {
        type: collection ? "collection" : "single",
        collection,
        pieces: [],
      };
      processedGroups.push(currentGroup);
    }

    // Find or create piece in current group
    let pieceGroup = currentGroup?.pieces.find(
      (p) => p.piece.id === piece.id && p.pieceVersion.id === pieceVersion.id,
    );
    if (!pieceGroup) {
      pieceGroup = {
        piece,
        pieceVersion,
        composer,
        movements: [],
      };
      currentGroup?.pieces.push(pieceGroup);
    }

    // Find or create movement in piece
    let movementGroup = pieceGroup.movements.find(
      (m) => m.movement.rank === section.movement.rank,
    );
    if (!movementGroup) {
      movementGroup = {
        movement: section.movement,
        sections: [],
      };
      pieceGroup.movements.push(movementGroup);
    }

    // Add section to movement with the original index in sectionList for form
    movementGroup.sections.push({ section, index });
  });

  return processedGroups;
}

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
    getValues("metronomeMarks").forEach((mm: any, idx: number) => {
      if (mm.comment) {
        setCommentToShow((prev) =>
          prev.includes(idx) ? prev : [...prev, idx],
        );
      }
    });
  }, [getValues]);

  const onRemoveComment = (idx: number) => {
    setValue(`metronomeMarks.${idx}.comment`, "");
    setCommentToShow((prev) => prev.filter((i) => i !== idx));
  };

  const resetValue = (idx: number, valueName: string) => {
    const path = `metronomeMarks.${idx}.${valueName}` as const;

    if (getValues(path)) {
      setValue(path, undefined);
    }
  };

  const organizedData = processSectionsForDisplay(sectionList, state);
  console.log(`[] organizedData :`, organizedData);

  const renderSectionForm = ({
    section,
    index,
  }: {
    section: SectionStateExtendedForMMForm;
    index: number;
  }) => {
    const formIndex = index;

    // const key = section.movement.key.replaceAll("_", " ");
    const tempoIndication = section.tempoIndication?.text;
    const comment = section.comment;
    const isNoMMChecked = !!watch(`metronomeMarks.${formIndex}.noMM`);
    const { isCommonTime, isCutTime } = section;
    const isCommonOrCutTime = isCommonTime || isCutTime;

    return (
      <div
        key={section.id}
        className="px-4 py-3 border-l-2 border-l-secondary/10 hover:border-l-secondary bg-secondary/5"
      >
        <div className="flex justify-between mb-2">
          <h6 className="text-sm font-bold text-secondary">
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
              <b>{`${section.metreNumerator}/${section.metreDenominator}`}</b>
            )}
            <span className="italic">
              {tempoIndication && `\u2002-\u2002${tempoIndication}`}
            </span>
            <span className="font-normal italic text-neutral-content">
              {comment && `\u2002-\u2002${comment}`}
            </span>
          </h6>
          <button
            type="button"
            className="btn btn-accent btn-xs"
            disabled={isNoMMChecked || commentToShow.includes(formIndex)}
            onClick={() => setCommentToShow((prev) => [...prev, formIndex])}
          >
            Add a Comment
          </button>
        </div>
        {commentToShow.includes(formIndex) && (
          <div className="flex items-end gap-3 mb-2">
            <FormInput
              name={`metronomeMarks.${formIndex}.comment` as const}
              label={`Comment`}
              controlClassName="max-w-none mt-0"
              defaultValue={``}
              {...{ register, control, errors }}
            />
            <button
              type="button"
              className="btn btn-error btn-sm"
              onClick={() => onRemoveComment(formIndex)}
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        <input
          {...register(`metronomeMarks.${formIndex}.sectionId`, {
            value: section.id,
          })}
          type="hidden"
        />

        <div className="flex items-end gap-3 mb-3">
          <label className="text-md flex items-center btn btn-outline btn-sm">
            <input
              {...register(`metronomeMarks.${formIndex}.noMM` as const)}
              name={`metronomeMarks.${formIndex}.noMM` as const}
              onClick={(e) => {
                const checked = (e.target as HTMLInputElement).checked;
                setValue(`metronomeMarks.${formIndex}.noMM`, checked);

                if (checked) {
                  resetValue(formIndex, "beatUnit");
                  resetValue(formIndex, "bpm");
                  resetValue(formIndex, "comment");
                }
              }}
              type="checkbox"
              className="mr-2"
            />
            {`No Metronome Mark`}
          </label>
          <ControlledSelect
            name={`metronomeMarks.${formIndex}.beatUnit` as const}
            id={`metronomeMarks.${formIndex}.beatUnit` as const}
            label={`Beat unit`}
            classNames="mt-0"
            control={control}
            options={Object.keys(NOTE_VALUE).map((key) => ({
              value: key,
              label: formatToPhraseCase(key),
            }))}
            isRequired={!isNoMMChecked}
            isDisabled={isNoMMChecked}
            fieldError={errors?.metronomeMarks?.[formIndex]?.beatUnit}
          />
          <FormInput
            name={`metronomeMarks.${formIndex}.bpm` as const}
            isRequired={!isNoMMChecked}
            disabled={isNoMMChecked}
            label="BPM"
            inputMode="numeric"
            controlClassName="flex-1 mt-none"
            {...{ register, control, errors }}
          />
        </div>
      </div>
    );
  };

  const getPersonName = (person: any) => {
    return person ? `${person.firstName} ${person.lastName}` : "";
  };

  return (
    <>
      <ul className="space-y-6">
        {organizedData.map((group, groupIndex) => {
          if (group.type === "collection") {
            // Get composer from the first piece (since all pieces in collection have same composer)
            const composer = group.pieces[0]?.composer;

            return (
              <li key={`collection-${group.collection.id}-${groupIndex}`}>
                {/* Collection Container with unified border */}
                <div className="border-l-4 border-l-primary rounded-lg border border-base-300 hover:shadow-md hover:bg-primary/5 transition-all duration-150">
                  {/* Collection Header */}
                  <div className="px-4 py-3 bg-primary/10 border-b border-primary/20">
                    <div className="flex gap-4 items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-primary mb-1">
                          {group.collection.title}
                          <span className="text-base font-normal">
                            {composer && ` - ${getPersonName(composer)}`}
                          </span>
                        </h3>
                        <div className="text-sm text-primary/70 font-medium">
                          Collection • {group.pieces.length} piece
                          {group.pieces.length > 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Collection Pieces */}
                  <div className="py-2">
                    {group.pieces.map((pieceGroup) => {
                      const movementCount = pieceGroup.movements.length;
                      const isMonoMovementPiece = movementCount === 1;

                      return (
                        <div
                          key={`${pieceGroup.piece.id}-${pieceGroup.pieceVersion.id}`}
                          className="mb-4"
                        >
                          {/* Piece Header */}
                          <div className="px-4 py-2 bg-accent/10">
                            <h4 className="text-base font-bold text-accent">
                              {pieceGroup.piece.title}
                              {isMonoMovementPiece &&
                                pieceGroup.movements[0] &&
                                ` in ${pieceGroup.movements[0].movement.key.replaceAll("_", " ")}`}
                            </h4>
                          </div>

                          {/* Movements */}
                          {pieceGroup.movements.map((movementGroup) => (
                            <div
                              key={movementGroup.movement.id}
                              className="ml-4"
                            >
                              {!isMonoMovementPiece && (
                                <div className="px-4 py-2 bg-primary/5">
                                  <h5 className="text-sm font-bold text-primary">
                                    Movement {movementGroup.movement.rank} in{" "}
                                    {movementGroup.movement.key.replaceAll(
                                      "_",
                                      " ",
                                    )}
                                  </h5>
                                </div>
                              )}

                              {/* Sections */}
                              <div className="ml-2">
                                {movementGroup.sections.map(
                                  ({ section, index }) =>
                                    renderSectionForm({ section, index }),
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </li>
            );
          } else {
            // Single piece (not part of a collection)
            const pieceGroup = group.pieces[0];
            const movementCount = pieceGroup.movements.length;
            const isMonoMovementPiece = movementCount === 1;

            return (
              <li
                key={`single-${pieceGroup.piece.id}-${pieceGroup.pieceVersion.id}`}
                className="border border-base-300 rounded-lg hover:border-base-400 hover:shadow-md hover:bg-primary/5 transition-all duration-150"
              >
                <div className="rounded-lg border-l-2 border-l-accent/10 hover:border-l-accent">
                  {/* Single Piece Header */}
                  <div className="px-4 py-3 bg-accent/10 border-b border-accent/20">
                    <div className="flex gap-4 items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-accent">
                          {pieceGroup.piece.title}
                          {isMonoMovementPiece &&
                            pieceGroup.movements[0] &&
                            ` in ${pieceGroup.movements[0].movement.key.replaceAll("_", " ")}`}
                          <span className="text-base font-normal">
                            {pieceGroup.composer &&
                              ` - ${getPersonName(pieceGroup.composer)}`}
                          </span>
                        </h3>
                        {/*
                        <div className="text-sm text-accent/70 font-medium">
                          Single piece
                        </div>
*/}
                      </div>
                    </div>
                  </div>

                  {/* Movements */}
                  <div className="py-2">
                    {pieceGroup.movements.map((movementGroup, mvtIndex) => (
                      <div
                        key={movementGroup.movement.rank}
                        className={
                          isMonoMovementPiece
                            ? ""
                            : `ml-2 rounded-tl-lg border-l-2 border-l-primary/10 hover:border-l-primary`
                        }
                      >
                        {!isMonoMovementPiece && (
                          <div
                            className={`px-4 py-2 ${mvtIndex > 0 ? "mt-3" : ""} bg-primary/5`}
                          >
                            <h4 className="text-sm font-bold text-primary">
                              Movement {movementGroup.movement.rank} in{" "}
                              {movementGroup.movement.key.replaceAll("_", " ")}
                            </h4>
                          </div>
                        )}

                        {/* Sections */}
                        <div
                          className={`ml-2 ${isMonoMovementPiece ? "" : "pt-2"} grid-cols-1 space-y-1`}
                        >
                          {movementGroup.sections.map(({ section, index }) =>
                            renderSectionForm({ section, index }),
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </li>
            );
          }
        })}
      </ul>
    </>
  );
}
