import React, { useEffect, useState } from "react";
import Loader from "@/components/Loader";
import CollectionSelectForm from "@/components/entities/collection/CollectionSelectForm";
import CollectionEditForm from "@/components/entities/collection/CollectionEditForm";
import { CollectionState, CollectionTitleInput } from "@/types/formTypes";
import {
  getNewEntities,
  FeedFormState,
} from "@/components/context/feedFormContext";
import { URL_API_GETALL_COMPOSER_COLLECTION } from "@/utils/routes";

type CollectionSelectOrCreateProps = {
  feedFormState: FeedFormState;
  selectedCollectionId?: string;
  selectedComposerId?: string;
  onCollectionCreated: (collection: CollectionTitleInput) => void;
  onCollectionSelect: (collection: CollectionState) => void;
};

const CollectionSelectOrCreate = ({
  feedFormState,
  selectedCollectionId,
  selectedComposerId,
  onCollectionCreated,
  onCollectionSelect,
}: CollectionSelectOrCreateProps) => {
  const [collections, setCollections] = useState<CollectionState[] | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isCreation, setIsCreation] = useState(false);
  const newCollections = getNewEntities(feedFormState, "collections");
  let collectionFullList = [
    ...(collections || []),
    ...(newCollections || []),
  ]?.filter((collection) => collection.composerId === selectedComposerId);

  // If we have new collections, we need to sort the collectionFullList
  if (newCollections?.length) {
    collectionFullList = collectionFullList.sort((a, b) => {
      if (a.title < b.title) return -1;
      if (a.title > b.title) return 1;
      return 0;
    });
  }

  // If composer is newly created, we shift in creation mode directly
  const newPersons = getNewEntities(feedFormState, "persons");
  const isNewComposer =
    !!selectedComposerId &&
    newPersons?.some((person) => person.id === selectedComposerId);
  useEffect(() => {
    if (typeof isNewComposer !== "boolean")
      console.log(`[useEffect 1] isNewComposer not boolean:`, isNewComposer);
    if (typeof isNewComposer === "boolean" && isNewComposer) {
      setIsCreation(true);
    }
  }, [isNewComposer]);

  const selectedCollection: CollectionState | undefined =
    collectionFullList.find(
      (collection) => collection.id === selectedCollectionId,
    );

  useEffect(() => {
    if (selectedComposerId) {
      fetch(
        URL_API_GETALL_COMPOSER_COLLECTION +
          "?composerId=" +
          selectedComposerId,
        { cache: "no-store" },
      )
        .then((res) => res.json())
        .then((data) => {
          setCollections(data?.collections);
          setIsLoading(false);
        })
        .catch((err) => {
          console.log(`[fetch(URL_API_GETALL_COMPOSERS)] err :`, err);
          setIsLoading(false);
        });
    }
  }, [selectedComposerId]);

  const onCollectionCreationClick = () => {
    setIsCreation(true);
  };

  if (isLoading) return <Loader />;

  if (!selectedComposerId) {
    return <p>{`Please select a composer first...`}</p>;
  }
  if (!isCreation && !collectionFullList)
    return <p>{`Oups, No data could be fetched. Can't continue...`}</p>;

  return isCreation ? (
    <CollectionEditForm onSubmit={onCollectionCreated} />
  ) : (
    <CollectionSelectForm
      collections={collectionFullList}
      value={selectedCollection}
      onCollectionSelect={onCollectionSelect}
      onCollectionCreationClick={onCollectionCreationClick}
    />
  );
};

export default CollectionSelectOrCreate;
