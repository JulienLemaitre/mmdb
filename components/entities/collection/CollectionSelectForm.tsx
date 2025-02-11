import CollectionSelect from "@/components/entities/collection/CollectionSelect";
import { useCallback, useEffect, useState } from "react";
import { CollectionState } from "@/types/formTypes";

type CollectionSelectFormProps = {
  collections: CollectionState[];
  value?: CollectionState;
  onCollectionSelect: (event: any) => void;
  onCollectionCreationClick: () => void;
};
export default function CollectionSelectForm({
  collections,
  value,
  onCollectionSelect,
  onCollectionCreationClick,
}: CollectionSelectFormProps) {
  const [selectedCollection, setSelectedCollection] =
    useState<CollectionState | null>(value || null);

  const onSelect = useCallback(
    (collectionId: string) => {
      const collection = collections.find(
        (collection) => collection.id === collectionId,
      );
      console.log(`[CollectionSelectForm] onSelect:`, collection);
      if (!collection) return;
      setSelectedCollection(collection);
    },
    [collections],
  );

  // Reset the form context when the component is mounted
  useEffect(() => {
    // Init the form with context value if exists
    if (value?.id) {
      onSelect(value.id);
    }
  }, [onSelect, value?.id]);

  // If we have a default value to set, we prevent an initial render of react-select that would prevent its use
  if (value && !selectedCollection) {
    return null;
  }

  return (
    <>
      <CollectionSelect
        collections={collections}
        onSelect={onSelect}
        selectedCollection={selectedCollection}
        onCollectionCreationClick={onCollectionCreationClick}
      />
      <button
        className="btn btn-primary mt-4"
        onClick={() => onCollectionSelect(selectedCollection)}
        {...(selectedCollection ? { disabled: false } : { disabled: true })}
      >
        Choose Collection
      </button>
    </>
  );
}
