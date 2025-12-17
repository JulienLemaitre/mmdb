import React, { useEffect, useState } from "react";
import { PieceInput, PieceState } from "@/types/formTypes";
import { Piece } from "@/prisma/client";
import { getNewEntities } from "@/context/feedFormContext";
import Loader from "@/ui/Loader";
import PieceEditForm from "@/features/piece/form/PieceEditForm";
import PieceSelectForm from "@/features/piece/form/PieceSelectForm";
import { URL_API_GETALL_COMPOSER_PIECES } from "@/utils/routes";
import { FeedFormState } from "@/types/feedFormTypes";

type PieceSelectOrCreateProps = {
  feedFormState: FeedFormState;
  onPieceCreated: (piece: PieceInput) => void;
  onPieceSelect: (piece: PieceState) => void;
  onInitPieceCreation: () => void;
  onCancelPieceCreation: () => void;
  selectedComposerId?: string;
  selectedPieceId?: string;
  isCollectionMode?: boolean;
  newPieceDefaultTitle?: string;
  isUpdateMode?: boolean;
  hasComposerJustBeenCreated: boolean;
  hasPieceJustBeenCreated: boolean;
};

function PieceSelectOrCreate({
  feedFormState,
  onPieceCreated,
  onPieceSelect,
  onInitPieceCreation: onInitPieceCreationFn,
  onCancelPieceCreation,
  selectedComposerId,
  selectedPieceId,
  isCollectionMode,
  newPieceDefaultTitle,
  isUpdateMode,
  hasComposerJustBeenCreated,
  hasPieceJustBeenCreated,
}: PieceSelectOrCreateProps) {
  const isCollectionCreation = !!isCollectionMode && !isUpdateMode;

  const [pieces, setPieces] = useState<Piece[] | null>(null);
  const [isLoading, setIsLoading] = useState(!hasPieceJustBeenCreated);

  const newPieces = getNewEntities(feedFormState, "pieces", {
    includeUnusedInFeedForm: true,
  }).filter((piece) => piece.composerId === selectedComposerId);
  const newSelectedPiece = newPieces?.find(
    (piece) => piece.id === selectedPieceId,
  );
  const isNewPieceUpdate = isUpdateMode && !!newSelectedPiece;
  const [isEditModeInternal, setIsEditModeInternal] = useState(false);
  let pieceFullList = [...(pieces || []), ...(newPieces || [])];

  // If we have new pieces, we need to sort the pieceFullList
  if (newPieces?.length) {
    pieceFullList = pieceFullList.sort((a, b) => {
      if (a.title < b.title) return -1;
      if (a.title > b.title) return 1;
      return 0;
    });
  }

  // Derived state: we are in edit mode if internal state is true,
  // OR if we are in a specific initial state (creation/update),
  // OR if loading is finished and we have no pieces to show.
  const isEditMode =
    isEditModeInternal ||
    isCollectionCreation ||
    hasComposerJustBeenCreated ||
    hasPieceJustBeenCreated ||
    isNewPieceUpdate ||
    (!isLoading && pieceFullList.length === 0);

  // If composer has not been created in this singlePieceVersionForm, we fetch all his composition pieces
  useEffect(() => {
    if (!isLoading) return;

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
  }, [selectedComposerId, isLoading]);

  const onInitPieceCreation = () => {
    onInitPieceCreationFn();
    setIsEditModeInternal(true);
  };

  const onCancelPieceEdition = () => {
    if (hasPieceJustBeenCreated) {
      onCancelPieceCreation();
    }
    setIsLoading(true);
    setIsEditModeInternal(false);
  };

  if (isLoading) return <Loader />;

  const selectedPiece: PieceState | undefined = pieceFullList?.find(
    (piece) => piece.id === selectedPieceId,
  );

  if (isEditMode)
    return (
      <PieceEditForm
        piece={newSelectedPiece}
        onSubmit={onPieceCreated}
        onCancel={onCancelPieceEdition}
        {...(!isUpdateMode && { newPieceDefaultTitle })}
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
