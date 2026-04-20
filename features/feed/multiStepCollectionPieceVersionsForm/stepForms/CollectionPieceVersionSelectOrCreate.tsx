import React from "react";
import { MMSourceOnPieceVersionsState } from "@/types/formTypes";
import CollectionPieceVersionsEditForm from "@/features/pieceVersion/CollectionPieceVersionsEditForm";
import { useCollectionPieceVersionsForm } from "@/context/collectionPieceVersionsFormContext";

type CollectionPieceVersionSelectOrCreateProps = {
  onSubmitSourceOnPieceVersions: (
    piecePieceVersions: MMSourceOnPieceVersionsState[],
  ) => void;
  isUpdateMode: boolean;
};

export default function CollectionPieceVersionSelectOrCreate({
  onSubmitSourceOnPieceVersions,
  isUpdateMode,
}: CollectionPieceVersionSelectOrCreateProps) {
  const { state } = useCollectionPieceVersionsForm();
  const isCollectionNew = !!state.collection?.isNew;

  return (
    <CollectionPieceVersionsEditForm
      onSubmitSourceOnPieceVersions={onSubmitSourceOnPieceVersions}
      isUpdateMode={isUpdateMode}
      isPreexistingCollectionUpdate={isUpdateMode && !isCollectionNew}
    />
  );
}
