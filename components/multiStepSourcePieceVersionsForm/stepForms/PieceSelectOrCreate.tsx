import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  updateSourceOnPieceVersionsForm,
  useSourceOnPieceVersionsForm,
} from "@/components/context/SourceOnPieceVersionFormContext";
import { PieceInput, PieceState } from "@/types/formTypes";
import getPieceStateFromInput from "@/utils/getPieceStateFromInput";
import { Piece } from "@prisma/client";
import {
  updateFeedForm,
  useFeedForm,
} from "@/components/context/feedFormContext";
import Loader from "@/components/Loader";
import PieceEditForm from "@/components/entities/piece/PieceEditForm";
import PieceSelectForm from "@/components/entities/piece/PieceSelectForm";

function PieceSelectOrCreate() {
  const [pieces, setPieces] = useState<Piece[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreation, setIsCreation] = useState(false);
  const { dispatch, state } = useSourceOnPieceVersionsForm();

  const { state: feedFormState, dispatch: feedFormDispatch } = useFeedForm();
  const selectedComposerId = state?.composer?.id;
  const selectedPieceId = state?.piece?.id;
  const newPersons = feedFormState.persons;
  const selectedPiece: PieceState | undefined = pieces?.find(
    (piece) => piece.id === selectedPieceId,
  );

  // If composer is newly created, we shift in creation mode directly
  const isNewComposer =
    selectedComposerId &&
    newPersons?.some((person) => person.id === selectedComposerId);
  useEffect(() => {
    if (typeof isNewComposer !== "boolean")
      console.log(`[useEffect 1] isNewComposer not boolean:`, isNewComposer);
    if (typeof isNewComposer === "boolean" && isNewComposer) {
      setIsCreation(true);
    }
  }, [isNewComposer]);

  // If composer is not new, we fetch all his composition pieces
  useEffect(() => {
    if (typeof isNewComposer !== "boolean")
      console.log(`[useEffect 2] isNewComposer not boolean:`, isNewComposer);
    if (typeof isNewComposer === "boolean" && !isNewComposer) {
      fetch("/api/getAll/composerPieces?composerId=" + selectedComposerId)
        .then((res) => res.json())
        .then((data) => {
          const pieces: Piece[] = data?.pieces;
          if (!pieces?.length) {
            console.log(
              `[useEffect 2] No composition pieces found for composer ${selectedComposerId}`,
            );
            setIsCreation(true);
            setIsLoading(false);
          } else {
            setPieces(data?.pieces);
            setIsLoading(false);
          }
        })
        .catch((err) => {
          console.log(
            `[fetch("/api/getAll/composerPieces?composerId=${selectedComposerId}")] err :`,
            err,
          );
          setIsLoading(false);
        });
    }
  }, [isNewComposer]);

  const onPieceCreated = async (data: PieceInput) => {
    // Front input values validation is successful at this point.
    console.log("[onPieceCreated] data", data);

    const pieceData = data;
    // Remove null values from pieceData
    Object.keys(pieceData).forEach(
      (key) => pieceData[key] == null && delete pieceData[key],
    );

    const pieceState = getPieceStateFromInput({
      ...pieceData,
      // pieceVersions: [state.pieceVersion.id],
    });
    pieceState.isNew = true;
    console.log("New piece to be stored in state", pieceState);
    updateFeedForm(feedFormDispatch, "pieces", { array: [pieceState] });
    updateSourceOnPieceVersionsForm(dispatch, "piece", {
      value: { id: pieceState.id },
      next: true,
    });
  };

  const onPieceSelect = (piece: PieceInput) => {
    updateSourceOnPieceVersionsForm(dispatch, "piece", {
      value: {
        id: piece.id,
      },
      next: true,
    });
  };

  const onPieceCreationClick = () => {
    setIsCreation(true);
  };

  if (isLoading) return <Loader />;

  if (isCreation) return <PieceEditForm onSubmit={onPieceCreated} />;

  if (!pieces)
    return (
      <p>{`Oups, something went wrong with data fetching. Can't continue...`}</p>
    );

  return (
    <PieceSelectForm
      pieces={pieces}
      value={selectedPiece}
      onPieceSelect={onPieceSelect}
      onPieceCreationClick={onPieceCreationClick}
    />
  );
}

export default PieceSelectOrCreate;
