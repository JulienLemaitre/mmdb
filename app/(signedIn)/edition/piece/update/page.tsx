"use client";

import PieceEditForm from "@/app/(signedIn)/edition/piece/PieceEditForm";
import { useEditForm } from "@/components/context/editFormContext";
import { useEffect, useState } from "react";
import { PieceState } from "@/types/editFormTypes";
import Loader from "@/components/Loader";

export default function PieceUpdate({ searchParams: { pieceId } }) {
  const { state } = useEditForm();
  const [piece, setPiece] = useState<PieceState | null>(null);
  const [isPieceInitialized, setIsPieceInitialized] = useState(false);

  useEffect(() => {
    const statePiece = state.piece;

    // If no pieceId is provided, we get the piece initial value from the form context
    if (!pieceId) {
      console.log(`[PieceUpdate] pieceId is undefined, get context value`);
      if (!statePiece) {
        console.log(`[PieceUpdate] ERROR: context piece is undefined`);
        setIsPieceInitialized(true);
        return;
      }
      setPiece(statePiece);
      setIsPieceInitialized(true);
      return;
    }

    // if a pieceId is provided, we check if it is already in the form context to initialize the piece value
    if (statePiece && statePiece.id === pieceId) {
      console.log(`[PieceUpdate] pieceId is in context`);
      setPiece(statePiece);
      setIsPieceInitialized(true);
      return;
    }

    // If we didn't find the provided pieceId in context, we fetch the piece data from db
    fetch(`/api/piece/get/${pieceId}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        console.log(`[PieceUpdate getData] piece :`, data);
        setPiece(data);
        setIsPieceInitialized(true);
      })
      .catch((error) => {
        console.log(`[PieceUpdate] ERROR:`, error);
        setIsPieceInitialized(true);
      });
  }, []);

  if (!isPieceInitialized) {
    return <Loader />;
  }

  if (!piece) {
    return (
      <div className="w-full max-w-md">
        <h1 className="mb-4 text-4xl font-bold">Piece update error</h1>
        <p className="mb-4 text-lg">
          The piece you are trying to update was not found.
        </p>
      </div>
    );
  }

  console.log(`[PieceUpdate] initial piece value :`, piece);

  return <PieceEditForm piece={piece} />;
}
