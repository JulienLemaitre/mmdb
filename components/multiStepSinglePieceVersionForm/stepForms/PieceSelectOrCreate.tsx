import React, { useEffect, useState } from "react";
import { PieceState } from "@/types/formTypes";
import { Piece } from "@prisma/client";
import {
  getNewEntities,
  useFeedForm,
} from "@/components/context/feedFormContext";
import Loader from "@/components/Loader";
import PieceEditForm from "@/components/entities/piece/PieceEditForm";
import PieceSelectForm from "@/components/entities/piece/PieceSelectForm";
import { URL_API_GETALL_COMPOSER_PIECES } from "@/utils/routes";

function PieceSelectOrCreate({
  state,
  onPieceCreated,
  onPieceSelect,
  deleteSelectedPieceIfNew,
}) {
  const [pieces, setPieces] = useState<Piece[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreation, setIsCreation] = useState(false);
  const { state: feedFormState } = useFeedForm();
  const selectedComposerId = state?.composer?.id;
  const selectedPieceId = state?.piece?.id;
  const newPieces = getNewEntities(feedFormState, "pieces");
  const newSelectedPiece = newPieces?.find(
    (piece) => piece.id === selectedPieceId,
  );
  const isPieceSelectedNew = !!newSelectedPiece;
  let pieceFullList = [...(pieces || []), ...(newPieces || [])];

  // If we have new pieces, we need to sort the pieceFullList
  if (newPieces?.length) {
    pieceFullList = pieceFullList.sort((a, b) => {
      if (a.title < b.title) return -1;
      if (a.title > b.title) return 1;
      return 0;
    });
  }

  // If composer is newly created, we shift in creation mode directly
  const newPersons = getNewEntities(feedFormState, "persons");
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

    // If we selected an existing composer, we fetch all his pieces
    if (typeof isNewComposer === "boolean" && !isNewComposer) {
      fetch(
        URL_API_GETALL_COMPOSER_PIECES + "?composerId=" + selectedComposerId,
        { cache: "no-store" },
      )
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
            `[fetch("URL_API_GETALL_COMPOSER_PIECES?composerId=${selectedComposerId}")] err :`,
            err,
          );
          setIsLoading(false);
        });
    }

    // If we have created a new composer, we don't fetch anything and set loading to false
    if (typeof isNewComposer === "boolean" && isNewComposer) {
      setIsLoading(false);
    }
  }, [isNewComposer]);

  const onPieceCreationClick = () => {
    setIsCreation(true);
  };

  const onCancelPieceCreation = () => {
    deleteSelectedPieceIfNew();
    setIsCreation(false);
  };

  if (isLoading) return <Loader />;

  const selectedPiece: PieceState | undefined = pieceFullList?.find(
    (piece) => piece.id === selectedPieceId,
  );

  if (isCreation || isPieceSelectedNew)
    return (
      <PieceEditForm
        piece={newSelectedPiece}
        onSubmit={onPieceCreated}
        onCancel={onCancelPieceCreation}
      />
    );

  if (!pieceFullList)
    return (
      <p>{`Oups, something went wrong with data fetching. Can't continue...`}</p>
    );

  return (
    <PieceSelectForm
      pieces={pieceFullList}
      value={selectedPiece}
      onPieceSelect={onPieceSelect}
      onPieceCreationClick={onPieceCreationClick}
    />
  );
}

export default PieceSelectOrCreate;
