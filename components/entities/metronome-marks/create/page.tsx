"use client";
import { useEditForm } from "@/components/context/editFormContext";
import { MovementState, SectionState } from "@/types/editFormTypes";
import MetronomeMarksForm from "@/components/MetronomeMarksForm";

export default function CreateMetronomeMarks() {
  const { state } = useEditForm();

  if (!state) {
    return <div>{`Chargement...`}</div>;
  }

  const sectionList =
    state.pieceVersion?.movements
      .reduce<(SectionState & { movement: Omit<MovementState, "sections"> })[]>(
        (sectionList, movement) => {
          return [
            ...sectionList,
            ...movement.sections.map((section) => {
              // Insert in section the properties of movement except "sections"
              return {
                ...section,
                movement: {
                  ...movement,
                  sections: undefined,
                },
              };
            }),
          ];
        },
        [],
      )
      .sort((a, b) =>
        a.movement.rank - b.movement.rank === 0
          ? a.rank - b.rank
          : a.movement.rank - b.movement.rank,
      ) || [];

  const sourceId = state?.sourceDescription?.id;

  if (!sourceId) {
    console.warn("ERROR - NO sourceId found in Context");
    return <div>{`Cannot find the source of metronome mark to edit.`}</div>;
  }
  if (!sectionList || sectionList.length === 0) {
    console.warn("ERROR - NO or empty sectionList found in Context");
    return (
      <div>{`Cannot find the piece sections on which to enter metronome marks.`}</div>
    );
  }

  return (
    <div>
      <h1 className="mb-4 text-4xl font-bold">Enter metronome marks</h1>
      <MetronomeMarksForm sectionList={sectionList} sourceId={sourceId} />
    </div>
  );
}
