import { CollectionInput, CollectionState } from "@/types/formTypes";

export default function getCollectionStateFromInput(
  collectionInput: CollectionInput,
): CollectionState {
  const collectionState: CollectionState = {
    id: collectionInput.id,
    title: collectionInput.title,
    composerId: collectionInput.composerId,
  };

  return collectionState;
}
