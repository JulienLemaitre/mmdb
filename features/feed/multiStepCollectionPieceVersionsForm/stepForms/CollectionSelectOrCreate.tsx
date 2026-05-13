import React, { useEffect, useState } from "react";
import CollectionSelectForm from "@/features/collection/CollectionSelectForm";
import CollectionEditForm from "@/features/collection/CollectionEditForm";
import { CollectionState, CollectionTitleInput } from "@/types/formTypes";
import { URL_API_GETALL_COMPOSER_COLLECTION } from "@/utils/routes";
import { LoaderCentered } from "@/ui/LoaderCentered";

type CollectionSelectOrCreateProps = {
  selectedCollectionId?: string;
  selectedComposerId?: string;
  collection?: Partial<CollectionState>;
  onCollectionCreated: (collection: CollectionTitleInput) => void;
  onCollectionSelect: (collection: CollectionState) => void;
  onInitCollectionCreation: () => void;
  onCancelCollectionCreation: () => void;
  hasComposerJustBeenCreated: boolean;
  hasCollectionJustBeenCreated: boolean;
  isUpdateMode: boolean;
};

const CollectionSelectOrCreate = ({
  selectedCollectionId,
  selectedComposerId,
  collection,
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
  const isCollectionNewInWorkflow = !!collection?.isNew;
  const localCollection =
    collection?.id && collection?.composerId === selectedComposerId
      ? (collection as CollectionState)
      : undefined;
  const isNewCollectionUpdate =
    isUpdateMode && isCollectionNewInWorkflow && !!selectedCollectionId;
  const [isCreation, setIsCreation] = useState(
    hasComposerJustBeenCreated ||
      hasCollectionJustBeenCreated ||
      isNewCollectionUpdate,
  );
  let collectionFullList = [...(collections || [])];

  if (
    localCollection &&
    !collectionFullList.some((existing) => existing.id === localCollection.id)
  ) {
    collectionFullList = [...collectionFullList, localCollection];
  }

  // If we have local workflow collection, we need to sort the collectionFullList
  if (localCollection) {
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

  if (isLoading) return <LoaderCentered />;

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
