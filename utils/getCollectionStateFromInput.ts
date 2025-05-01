import { CollectionInput, CollectionState } from "@/types/formTypes";
import { v4 as uuidv4 } from "uuid";

export default function getCollectionStateFromInput(
  collectionInput: CollectionInput,
): CollectionState {
  return {
    id: uuidv4(),
    title: collectionInput.title,
    composerId: collectionInput.composerId,
  };
}
