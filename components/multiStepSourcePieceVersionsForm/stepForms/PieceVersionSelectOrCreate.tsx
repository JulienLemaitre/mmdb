import React, { useEffect, useState } from "react";
import {
  updateSourceOnPieceVersionsForm,
  useSourceOnPieceVersionsForm,
} from "@/components/context/SourceOnPieceVersionFormContext";
import { PieceVersionInput, PieceVersionState } from "@/types/formTypes";
import {
  updateFeedForm,
  useFeedForm,
} from "@/components/context/feedFormContext";
import Loader from "@/components/Loader";
import PieceVersionEditForm from "@/components/entities/piece-version/PieceVersionEditForm";
import PieceVersionSelectForm from "@/components/entities/piece-version/PieceVersionSelectForm";
import getPieceVersionStateFromInput from "@/utils/getPieceVersionStateFromInput";
import { URL_API_GETALL_PIECE_PIECE_VERSIONS } from "@/utils/routes";

function PieceVersionSelectOrCreate() {
  const [pieceVersions, setPieceVersions] = useState<
    PieceVersionState[] | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreation, setIsCreation] = useState(false);
  const { dispatch, state } = useSourceOnPieceVersionsForm();

  const { state: feedFormState, dispatch: feedFormDispatch } = useFeedForm();
  const selectedPieceId = state?.piece?.id;
  const selectedPieceVersionId = state?.piece?.id;
  const newPieces = feedFormState.pieces;
  const selectedPieceVersion: PieceVersionState | undefined =
    pieceVersions?.find(
      (pieceVersion) => pieceVersion.id === selectedPieceVersionId,
    );

  // If piece is newly created, we shift in creation mode directly
  const isNewPiece =
    selectedPieceId && newPieces?.some((piece) => piece.id === selectedPieceId);
  useEffect(() => {
    if (typeof isNewPiece !== "boolean")
      console.log(`[useEffect 1] isNewComposer not boolean:`, isNewPiece);
    if (typeof isNewPiece === "boolean" && isNewPiece) {
      setIsCreation(true);
    }
  }, [isNewPiece]);

  // If piece is not new, we fetch all related pieceVersions
  useEffect(() => {
    if (typeof isNewPiece !== "boolean")
      console.log(`[useEffect 2] isNewComposer not boolean:`, isNewPiece);

    // If we selected an existing piece, we fetch all its pieceVersions
    if (typeof isNewPiece === "boolean" && !isNewPiece) {
      fetch(
        URL_API_GETALL_PIECE_PIECE_VERSIONS + "?pieceId=" + selectedPieceId,
        { cache: "no-store" },
      )
        .then((res) => res.json())
        .then((data) => {
          const pieceVersions: PieceVersionState[] = data?.pieceVersions;
          if (!pieceVersions?.length) {
            console.log(
              `[useEffect 2] No piece version found for piece ${selectedPieceId}`,
            );
            setIsCreation(true);
            setIsLoading(false);
          } else {
            setPieceVersions(pieceVersions);
            setIsLoading(false);
          }
        })
        .catch((err) => {
          console.log(
            `[fetch("URL_API_GETALL_PIECE_PIECE_VERSIONS?pieceId=${selectedPieceId}")] err :`,
            err,
          );
          setIsLoading(false);
        });
    }

    // If we have created a new piece, we don't fetch anything and set loading to false
    if (typeof isNewPiece === "boolean" && isNewPiece) {
      setIsLoading(false);
    }
  }, [isNewPiece]);

  const onPieceVersionCreated = (data: PieceVersionInput) => {
    // Front input values validation is successful at this point.
    console.log("[onPieceVersionCreated] data", data);

    if (!selectedPieceId) {
      console.log(
        `[onPieceVersionCreated] No selectedPieceId found - cannot create pieceVersion`,
      );
      return;
    }

    const pieceVersionData = data;
    // Remove null values from pieceVersionData
    Object.keys(pieceVersionData).forEach(
      (key) => pieceVersionData[key] == null && delete pieceVersionData[key],
    );

    const pieceVersionState = getPieceVersionStateFromInput({
      ...pieceVersionData,
      pieceId: selectedPieceId,
    });
    pieceVersionState.isNew = true;
    console.log("New pieceVersion to be stored in state", pieceVersionState);
    updateFeedForm(feedFormDispatch, "pieceVersions", {
      array: [pieceVersionState],
    });
    updateSourceOnPieceVersionsForm(dispatch, "pieceVersion", {
      value: { id: pieceVersionState.id },
      next: true,
    });
  };

  const onPieceVersionSelect = (pieceVersion: PieceVersionInput) => {
    updateSourceOnPieceVersionsForm(dispatch, "pieceVersion", {
      value: {
        id: pieceVersion.id,
      },
      next: true,
    });
  };

  const onPieceVersionCreationClick = () => {
    setIsCreation(true);
  };

  if (isLoading) return <Loader />;

  if (isCreation)
    return <PieceVersionEditForm onSubmit={onPieceVersionCreated} />;

  if (!pieceVersions)
    return (
      <p>{`Oups, something went wrong with data fetching. Can't continue...`}</p>
    );

  return (
    <PieceVersionSelectForm
      pieceVersions={pieceVersions}
      value={selectedPieceVersion}
      onPieceVersionSelect={onPieceVersionSelect}
      onPieceVersionCreationClick={onPieceVersionCreationClick}
    />
  );
}

export default PieceVersionSelectOrCreate;
