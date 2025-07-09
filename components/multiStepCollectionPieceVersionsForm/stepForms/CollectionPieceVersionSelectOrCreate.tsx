import React from "react";
import { MMSourcePieceVersionsState } from "@/types/formTypes";
import { getNewEntities } from "@/components/context/feedFormContext";
import CollectionPieceVersionsEditForm from "@/components/entities/piece-version/CollectionPieceVersionsEditForm";
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
