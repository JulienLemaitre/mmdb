import React, { useEffect, useState } from "react";
import MetronomeMarksForm from "@/components/entities/metronome-marks/MetronomeMarksForm";
import { useFeedForm } from "@/components/context/feedFormContext";
import { URL_API_GETMANY_PIECEVERSIONS } from "@/utils/routes";
import Loader from "@/components/Loader";
import {
  PieceVersionState,
  SectionStateExtendedForMMForm,
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
  }, [state.mMSourcePieceVersions, state.pieceVersions]);

  if (!pieceVersions || pieceVersions.length === 0) {
    return <Loader />;
  }

  const sectionList = state.mMSourcePieceVersions!.reduce<
    SectionStateExtendedForMMForm[]
  >((sectionList, mMSourceOnPieceVersion) => {
    const pieceVersion = pieceVersions.find(
      (pv) => pv.id === mMSourceOnPieceVersion.pieceVersionId,
    );
    if (!pieceVersion) {
      throw new Error(
        `[MetronomeMarks] NO pieceVersion for mMSourceOnPieceVersion.pieceVersionId: ${mMSourceOnPieceVersion.pieceVersionId}`,
      );
    }

    return [
      ...sectionList,
      ...pieceVersion.movements.reduce<SectionStateExtendedForMMForm[]>(
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
                mMSourceOnPieceVersion,
                pieceId: pieceVersion.pieceId,
              };
            }),
          ];
        },
        [],
      ),
    ];
  }, []);

  // If there are metronome marks in state but not the same number as sectionList, we raise an error
  const metronomeMarks = state.metronomeMarks;
  if (metronomeMarks?.length && metronomeMarks.length !== sectionList.length) {
    console.warn(
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
