import React, { useEffect, useState } from "react";
import Loader from "@/components/Loader";
import CollectionSelectForm from "@/components/entities/collection/CollectionSelectForm";
import CollectionEditForm from "@/components/entities/collection/CollectionEditForm";
import { CollectionState, CollectionTitleInput } from "@/types/formTypes";
import { getNewEntities } from "@/components/context/feedFormContext";
import { FeedFormState } from "@/types/feedFormTypes";
import { URL_API_GETALL_COMPOSER_COLLECTION } from "@/utils/routes";

type CollectionSelectOrCreateProps = {
  feedFormState: FeedFormState;
  selectedCollectionId?: string;
  selectedComposerId?: string;
  onCollectionCreated: (collection: CollectionTitleInput) => void;
  onCollectionSelect: (collection: CollectionState) => void;
  onInitCollectionCreation: () => void;
  onCancelCollectionCreation: () => void;
  hasComposerJustBeenCreated: boolean;
  hasCollectionJustBeenCreated: boolean;
  isUpdateMode: boolean;
};

const CollectionSelectOrCreate = ({
  feedFormState,
  selectedCollectionId,
  selectedComposerId,
  onCollectionCreated,
  onCollectionSelect,
  hasComposerJustBeenCreated,
  hasCollectionJustBeenCreated,
  onInitCollectionCreation: onInitCollectionCreationFn,
  onCancelCollectionCreation,
  isUpdateMode,
}: CollectionSelectOrCreateProps) => {
  const [collections, setCollections] = useState<CollectionState[] | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(!hasComposerJustBeenCreated);
  const newCollections = getNewEntities(feedFormState, "collections", {
    includeUnusedInFeedForm: true,
  }).filter((collection) => collection.composerId === selectedComposerId);
  const isNewCollectionUpdate =
    isUpdateMode && newCollections.some((c) => c.id === selectedCollectionId);
  const [isCreation, setIsCreation] = useState(
    hasComposerJustBeenCreated || isNewCollectionUpdate,
  );
  let collectionFullList = [...(collections || []), ...(newCollections || [])];

  // If we have new collections, we need to sort the collectionFullList
  if (newCollections?.length) {
    collectionFullList = collectionFullList.sort((a, b) => {
      if (a.title < b.title) return -1;
      if (a.title > b.title) return 1;
      return 0;
    });
  }

  const selectedCollection: CollectionState | undefined =
    collectionFullList.find(
      (collection) => collection.id === selectedCollectionId,
    );

  useEffect(() => {
    if (!isLoading || !selectedComposerId) return;

    fetch(
      URL_API_GETALL_COMPOSER_COLLECTION + "?composerId=" + selectedComposerId,
      { cache: "no-store" },
    )
      .then((res) => res.json())
      .then((data) => {
        setCollections(data?.collections);
        setIsLoading(false);
      })
      .catch((err) => {
        console.log(
          `[fetch(${URL_API_GETALL_COMPOSER_COLLECTION}?composerId=${selectedComposerId})] err :`,
          err,
        );
        setIsLoading(false);
      });
  }, [isLoading, selectedComposerId]);

  const onInitCollectionCreation = () => {
    onInitCollectionCreationFn();
    setIsCreation(true);
  };
  const onCancelCollectionEdition = () => {
    if (hasCollectionJustBeenCreated) {
      onCancelCollectionCreation();
    }
    setIsLoading(true);
    setIsCreation(false);
  };

  if (isLoading) return <Loader />;

  if (!selectedComposerId) {
    return <p>{`Please select a composer first...`}</p>;
  }
  if (!isCreation && !collectionFullList)
    return <p>{`Oups, No data could be fetched. Can't continue...`}</p>;

  return isCreation ? (
    <CollectionEditForm
      collection={selectedCollection}
      onCancel={onCancelCollectionEdition}
      onSubmit={onCollectionCreated}
    />
  ) : (
    <CollectionSelectForm
      collections={collectionFullList}
      value={selectedCollection}
      onCollectionSelect={onCollectionSelect}
      onInitCollectionCreation={onInitCollectionCreation}
    />
  );
};

export default CollectionSelectOrCreate;
