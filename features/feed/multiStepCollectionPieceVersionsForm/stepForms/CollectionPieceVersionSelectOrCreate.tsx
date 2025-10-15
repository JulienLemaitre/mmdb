import React from "react";
import { MMSourcePieceVersionsState } from "@/types/formTypes";
import { getNewEntities } from "@/context/feedFormContext";
import CollectionPieceVersionsEditForm from "@/features/pieceVersion/CollectionPieceVersionsEditForm";
import { FeedFormState } from "@/types/feedFormTypes";

type CollectionPieceVersionSelectOrCreateProps = {
  feedFormState: FeedFormState;
  selectedCollectionId: string;
  onSubmitSourceOnPieceVersions: (
    piecePieceVersions: MMSourcePieceVersionsState[],
  ) => void;
  isUpdateMode: boolean;
};

export default function CollectionPieceVersionSelectOrCreate({
  feedFormState,
  onSubmitSourceOnPieceVersions,
  selectedCollectionId,
  isUpdateMode,
}: CollectionPieceVersionSelectOrCreateProps) {
  const isCollectionNew = (
    getNewEntities(feedFormState, "collections", {
      includeUnusedInFeedForm: true,
    }) || []
  ).some((c) => c.id === selectedCollectionId);

  return (
    <CollectionPieceVersionsEditForm
      onSubmitSourceOnPieceVersions={onSubmitSourceOnPieceVersions}
      isUpdateMode={isUpdateMode}
      isPreexistingCollectionUpdate={isUpdateMode && !isCollectionNew}
    />
  );
}
