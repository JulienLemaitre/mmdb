import React, { useEffect, useState } from "react";
import MetronomeMarksForm from "@/components/entities/metronome-marks/MetronomeMarksForm";
import { useFeedForm } from "@/components/context/feedFormContext";
import { URL_API_GETMANY_PIECEVERSIONS } from "@/utils/routes";
import Loader from "@/components/Loader";
import {
  MovementState,
  PieceVersionState,
  SectionState,
} from "@/types/formTypes";

function MetronomeMarks() {
  const { state } = useFeedForm();
  const [pieceVersions, setPieceVersions] = useState<PieceVersionState[]>();

  useEffect(() => {
    const statePieceVersionIds: string[] = [];
    const dbPieceVersionIds: string[] = [];
    state.mMSourcePieceVersions!.forEach((SoPV) => {
      if (state.pieceVersions!.some((pv) => pv.id === SoPV.pieceVersionId)) {
        statePieceVersionIds.push(SoPV.pieceVersionId);
      } else {
        dbPieceVersionIds.push(SoPV.pieceVersionId);
      }
    });

    const pieceVersionsFromState = statePieceVersionIds
      .map((id) => state.pieceVersions!.find((pv) => pv.id === id))
      .filter((pv) => pv !== undefined) as PieceVersionState[];

    if (dbPieceVersionIds.length > 0) {
      fetch(URL_API_GETMANY_PIECEVERSIONS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idList: dbPieceVersionIds,
        }),
      })
        .then((res) => res.json())
        .then((pieceVersions) => {
          if (!pieceVersions) {
            console.log(
              `[Fetch] NO pieceVersions for idList:`,
              dbPieceVersionIds,
            );
            return;
          }

          setPieceVersions([...pieceVersionsFromState, ...pieceVersions]);
        });
    } else {
      setPieceVersions(pieceVersionsFromState);
    }
  }, []);

  if (!pieceVersions || pieceVersions.length === 0) {
    return <Loader />;
  }

  const sectionList = pieceVersions
    .reduce<(SectionState & { movement: Omit<MovementState, "sections"> })[]>(
      (sectionList, pieceVersion) => {
        return [
          ...sectionList,
          ...pieceVersion.movements.reduce<
            (SectionState & { movement: Omit<MovementState, "sections"> })[]
          >((sectionList, movement) => {
            return [
              ...sectionList,
              ...movement.sections.map((section, index) => {
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
          }, []),
        ];
      },
      [],
    )
    .sort((a, b) =>
      a.movement.rank - b.movement.rank === 0
        ? a.rank - b.rank
        : a.movement.rank - b.movement.rank,
    );

  // If there are metronome marks in state but not the same number as sectionList, we raise an error
  const metronomeMarks = state.metronomeMarks;
  if (metronomeMarks?.length && metronomeMarks.length !== sectionList.length) {
    console.log(
      `[ERROR] metronomeMarks.length (${metronomeMarks.length}) !== sectionList.length (${sectionList.length})`,
    );
  }

  return (
    <div>
      <h1 className="mb-4 text-4xl font-bold">Enter metronome marks</h1>
      <MetronomeMarksForm
        metronomeMarks={metronomeMarks}
        sectionList={sectionList}
      />
    </div>
  );
}

export default MetronomeMarks;
