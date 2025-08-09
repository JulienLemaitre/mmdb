import React, { useEffect, useMemo, useState } from "react";
import MetronomeMarksForm from "@/components/entities/metronome-marks/MetronomeMarksForm";
import { useFeedForm } from "@/components/context/feedFormContext";
import { URL_API_GETMANY_PIECEVERSIONS } from "@/utils/routes";
import Loader from "@/components/Loader";
import { PieceVersionState } from "@/types/formTypes";
import { getSectionList } from "@/utils/getSectionList";

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

  const sectionList = useMemo(() => {
    if (!pieceVersions || pieceVersions.length === 0) return [];
    return getSectionList(state, pieceVersions);
  }, [pieceVersions, state]);

  if (!pieceVersions || pieceVersions.length === 0) {
    return <Loader />;
  }

  return (
    <div>
      <h1 className="mb-4 text-4xl font-bold">Enter metronome marks</h1>
      <MetronomeMarksForm sectionList={sectionList} />
    </div>
  );
}

export default MetronomeMarks;
