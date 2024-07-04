// "use client";
import Select from "@/components/ReactSelect/Select";
import { PersonState } from "@/types/formTypes";
import { useRouter } from "next/navigation";
import getNoOptionsMessage from "@/components/ReactSelect/getNoOptionsMessage";

type CollectionSelectProps = {
  collections: PersonState[];
  onSelect: (collectionId: string) => void;
  selectedCollection: PersonState | null;
  onCollectionCreationClick: () => void;
};
export default function CollectionSelect({
  collections,
  onSelect,
  selectedCollection,
  onCollectionCreationClick,
}: Readonly<CollectionSelectProps>) {
  const collectionOptions = collections.map((collection) =>
    getCollectionOption(collection),
  );
  const router = useRouter();
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
        onClick: onCollectionCreationClick,
      })}
    />
  );
}

function getCollectionOption(collection: PersonState) {
  return {
    value: collection.id,
    label: `${collection.firstName} ${collection.lastName}`,
  };
}
