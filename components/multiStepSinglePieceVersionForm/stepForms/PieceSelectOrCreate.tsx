import React, { useEffect, useState } from "react";
import { PieceInput, PieceState } from "@/types/formTypes";
import { Piece } from "@prisma/client";
import { getNewEntities } from "@/components/context/feedFormContext";
import Loader from "@/components/Loader";
import PieceEditForm from "@/components/entities/piece/PieceEditForm";
import PieceSelectForm from "@/components/entities/piece/PieceSelectForm";
import { URL_API_GETALL_COMPOSER_PIECES } from "@/utils/routes";
import { FeedFormState } from "@/types/feedFormTypes";
import { SinglePieceVersionFormState } from "@/components/context/SinglePieceVersionFormContext";

type PieceSelectOrCreate = {
  feedFormState: FeedFormState;
  singlePieceVersionFormState: SinglePieceVersionFormState;
  onPieceCreated: (piece: PieceInput) => void;
  onPieceSelect: (piece: PieceState) => void;
  onInitPieceCreation: () => void;
  onCancelPieceCreation: () => void;
  selectedComposerId?: string;
  selectedPieceId?: string;
  isCollectionCreationMode?: boolean;
  newPieceDefaultTitle?: string;
};

function PieceSelectOrCreate({
  feedFormState,
  singlePieceVersionFormState,
  onPieceCreated,
  onPieceSelect,
  onInitPieceCreation: onInitPieceCreationFn,
  onCancelPieceCreation,
  selectedComposerId,
  selectedPieceId,
  isCollectionCreationMode,
  newPieceDefaultTitle,
}: PieceSelectOrCreate) {
  const hasComposerJustBeenCreated =
    !!singlePieceVersionFormState.composer?.isNew;
  const hasPieceJustBeenCreated = !!singlePieceVersionFormState.piece?.isNew;
  const [pieces, setPieces] = useState<Piece[] | null>(null);
  const [isLoading, setIsLoading] = useState(!hasPieceJustBeenCreated);
  const [isCreation, setIsCreation] = useState(
    !!isCollectionCreationMode || hasPieceJustBeenCreated,
  );
  const newPieces = getNewEntities(feedFormState, "pieces", {
    includeUnusedInFeedForm: true,
  }).filter((piece) => piece.composerId === selectedComposerId);
  const newSelectedPiece = newPieces?.find(
    (piece) => piece.id === selectedPieceId,
  );
  // const isSelectedPieceNew = !!newSelectedPiece;
  let pieceFullList = [...(pieces || []), ...(newPieces || [])];
  console.log(`[PieceSelectOrCreate] pieceFullList :`, pieceFullList);

  // If we have new pieces, we need to sort the pieceFullList
  if (newPieces?.length) {
    pieceFullList = pieceFullList.sort((a, b) => {
      if (a.title < b.title) return -1;
      if (a.title > b.title) return 1;
      return 0;
    });
  }

  // If composer has not been created in this singlePieceVersionForm, we fetch all his composition pieces
  useEffect(() => {
    if (!isLoading) return;

    if (isCollectionCreationMode) {
      setIsLoading(false);
      return;
    }
    if (hasComposerJustBeenCreated) {
      setIsLoading(false);
      return;
    }

    // If we selected an existing composer, we fetch all his pieces
    if (selectedComposerId) {
      fetch(
        URL_API_GETALL_COMPOSER_PIECES + "?composerId=" + selectedComposerId,
        { cache: "no-store" },
      )
        .then((res) => res.json())
        .then((data) => {
          const pieces: Piece[] = data?.pieces;
          if (!pieces?.length) {
            // TODO: give this information to the user with a toast
            console.log(
              `[PieceSelectOrCreate useEffect] No composition pieces found for composer ${selectedComposerId}`,
            );
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
  }, [
    hasComposerJustBeenCreated,
    isCollectionCreationMode,
    selectedComposerId,
    pieceFullList.length,
    isLoading,
  ]);

  // If pieces have been loaded, and we found none in db or in state, we shift to piece creation mode
  useEffect(() => {
    if (!isLoading && pieceFullList.length === 0) {
      setIsCreation(true);
    }
  }, [isLoading, pieceFullList.length]);

  const onInitPieceCreation = () => {
    onInitPieceCreationFn();
    setIsCreation(true);
  };

  const onCancelPieceEdition = () => {
    if (hasPieceJustBeenCreated) {
      onCancelPieceCreation();
    }
    setIsLoading(true);
    setIsCreation(false);
  };

  if (isLoading) return <Loader />;

  const selectedPiece: PieceState | undefined = pieceFullList?.find(
    (piece) => piece.id === selectedPieceId,
  );

  if (isCreation)
    // if (isCreation || isSelectedPieceNew)
    return (
      <PieceEditForm
        piece={newSelectedPiece}
        onSubmit={onPieceCreated}
        onCancel={onCancelPieceEdition}
        newPieceDefaultTitle={newPieceDefaultTitle}
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
      onInitPieceCreation={onInitPieceCreation}
    />
  );
}

export default PieceSelectOrCreate;
