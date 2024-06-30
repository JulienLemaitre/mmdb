import React, { useEffect, useState } from "react";
import { PieceVersionState } from "@/types/formTypes";
import {
  getNewEntities,
  useFeedForm,
} from "@/components/context/feedFormContext";
import Loader from "@/components/Loader";
import PieceVersionEditForm from "@/components/entities/piece-version/PieceVersionEditForm";
import PieceVersionSelectForm from "@/components/entities/piece-version/PieceVersionSelectForm";
import { URL_API_GETALL_PIECE_PIECE_VERSIONS } from "@/utils/routes";

function PieceVersionSelectOrCreate({
  state,
  onPieceVersionCreated,
  onPieceVersionSelect,
}) {
  const [pieceVersions, setPieceVersions] = useState<
    PieceVersionState[] | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreation, setIsCreation] = useState(false);

  const { state: feedFormState } = useFeedForm();
  const selectedPieceId = state?.piece?.id;
  const selectedPieceVersionId = state?.pieceVersion?.id;
  const newPieces = getNewEntities(feedFormState, "pieces");
  const newPieceVersions = getNewEntities(feedFormState, "pieceVersions");
  let pieceVersionFullList = [
    ...(pieceVersions || []),
    ...(newPieceVersions || []),
  ];

  const selectedPieceVersion: PieceVersionState | undefined =
    pieceVersionFullList?.find(
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
  }, [isNewPiece, selectedPieceId]);

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
      pieceVersions={pieceVersionFullList}
      value={selectedPieceVersion}
      onPieceVersionSelect={onPieceVersionSelect}
      onPieceVersionCreationClick={onPieceVersionCreationClick}
    />
  );
}

export default PieceVersionSelectOrCreate;
