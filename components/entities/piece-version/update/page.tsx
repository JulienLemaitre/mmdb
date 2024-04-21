"use client";

import { useEffect, useState } from "react";
import { PieceVersionState } from "@/types/formTypes";
import Loader from "@/components/Loader";
import PieceVersionEditForm from "@/components/entities/piece-version/PieceVersionEditForm";
import { useEditForm } from "@/components/context/editFormContext";
import getPieceVersionInputFromPieceVersionState from "@/utils/getPieceVersionInputFromPieceVersionState";

export default function PieceVersionUpdate({
  searchParams: { pieceVersionId },
}) {
  const { state } = useEditForm();
  const [pieceVersion, setPieceVersion] = useState<PieceVersionState | null>(
    null,
  );
  const [isPieceVersionInitialized, setIsPieceVersionInitialized] =
    useState(false);

  useEffect(() => {
    const statePieceVersion = state.pieceVersion;

    if (!pieceVersionId) {
      console.log(
        `[PieceVersionUpdate] pieceVersionId is undefined, get context value`,
      );
      if (!statePieceVersion) {
        console.log(
          `[PieceVersionUpdate] ERROR: context pieceVersion is undefined`,
        );
        setIsPieceVersionInitialized(true);
        return;
      }
      setPieceVersion(statePieceVersion);
      setIsPieceVersionInitialized(true);
      return;
    }

    if (statePieceVersion && statePieceVersion.id === pieceVersionId) {
      console.log(`[PieceVersionUpdate] pieceVersionId is in context`);
      setPieceVersion(statePieceVersion);
      setIsPieceVersionInitialized(true);
      return;
    }

    fetch(`/api/piece-version/get/${pieceVersionId}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        console.log(`[PieceVersionUpdate getData] pieceVersion :`, data);
        setPieceVersion(data);
        setIsPieceVersionInitialized(true);
      })
      .catch((error) => {
        console.log(`[PieceVersionUpdate] ERROR:`, error);
        setIsPieceVersionInitialized(true);
      });
  }, []);

  if (!isPieceVersionInitialized) {
    return <Loader />;
  }

  if (!pieceVersion) {
    return (
      <div className="w-full max-w-md">
        <h1 className="mb-4 text-4xl font-bold">Piece version update error</h1>
        <p className="mb-4 text-lg">
          The piece version you are trying to update was not found.
        </p>
      </div>
    );
  }

  console.log(
    `[PieceVersionUpdate] initial pieceVersion value :`,
    pieceVersion,
  );
  const pieceVersionInput =
    getPieceVersionInputFromPieceVersionState(pieceVersion);

  return (
    <PieceVersionEditForm
      pieceVersion={pieceVersionInput}
      onSubmit={() => console.log("submit")}
    />
  );
}
