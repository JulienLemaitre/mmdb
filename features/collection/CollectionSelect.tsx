// "use client";
import Select from "@/ui/form/reactSelect/Select";
import { CollectionState } from "@/types/formTypes";
import getNoOptionsMessage from "@/ui/form/reactSelect/getNoOptionsMessage";

type CollectionSelectProps = {
  collections: CollectionState[];
  onSelect: (collectionId: string) => void;
  selectedCollection: CollectionState | null;
  onInitCollectionCreation: () => void;
};
export default function CollectionSelect({
  collections,
  onSelect,
  selectedCollection,
  onInitCollectionCreation,
}: Readonly<CollectionSelectProps>) {
  const collectionOptions = collections.map((collection) =>
    getCollectionOption(collection),
  );
  const defaultOption = selectedCollection
    ? getCollectionOption(selectedCollection)
    : null;

  return (
    <Select
      className="react-select-container"
      classNamePrefix="react-select"
      instanceId="collection-select"
      placeholder="Enter collection name..."
      isSearchable={true}
      name="collection"
      options={collectionOptions}
      defaultValue={defaultOption}
      autoFocus
      onChange={(collectionOption) => {
        if (!collectionOption) return;
        onSelect(collectionOption?.value);
      }}
      noOptionsMessage={getNoOptionsMessage({
        entityName: "collection",
        onClick: onInitCollectionCreation,
      })}
    />
  );
}

function getCollectionOption(collection: CollectionState) {
  return {
    value: collection.id,
    label: `${collection.title}`,
  };
}
