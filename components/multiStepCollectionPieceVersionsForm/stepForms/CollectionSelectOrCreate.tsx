import React, { useEffect, useState } from "react";
import { Collection } from "@prisma/client";
import Loader from "@/components/Loader";
import CollectionSelectForm from "@/components/entities/collection/CollectionSelectForm";
import CollectionEditForm from "@/components/entities/collection/CollectionEditForm";
import { CollectionState } from "@/types/formTypes";
import {
  useFeedForm,
  getNewEntities,
} from "@/components/context/feedFormContext";
import { URL_API_GETALL_COMPOSER_COLLECTION } from "@/utils/routes";

const CollectionSelectOrCreate = ({
  state,
  onCollectionCreated,
  onCollectionSelect,
}) => {
  const [collections, setCollections] = useState<Collection[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreation, setIsCreation] = useState(false);
  const { state: feedFormState } = useFeedForm();
  const selectedCollectionId = state?.collection?.id;
  const selectedComposerId = state?.collection?.composerId;
  const newCollections = getNewEntities(feedFormState, "collections");
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
  if (!collectionFullList)
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
