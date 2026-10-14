import { CollectionPieceVersionsFormState } from "@/types/collectionPieceVersionFormTypes";
import { CollectionState } from "@/types/formTypes";
import { prodLog } from "@/utils/debugLogger";

export function handleCollectionAction(
  state: CollectionPieceVersionsFormState,
  payload: {
    value: Partial<CollectionState & { isComposerNew?: boolean }> | undefined;
    reset?: boolean;
    next?: boolean;
  },
): CollectionPieceVersionsFormState {
  const { value, reset } = payload;

  let newState = {
    ...state,
    collection: reset ? value : { ...state.collection, ...value },
  };

  const hasComposerChanged =
    newState.collection?.composerId !== state.collection?.composerId;
  const hasCollectionIdChanged =
    newState.collection?.id !== state.collection?.id;

  // If composer has changed
  if (hasComposerChanged) {
    // Remove data that belongs to the previous composer and collection.
    if (newState.collection) {
      const isComposerNew = value?.isComposerNew === true;
      prodLog.log(
        `[composer changed] clear collection details from previous composer -`,
      );
      delete newState.collection.id;
      delete newState.collection.title;
      delete newState.collection.isNew;
      delete newState.collection.pieceCount;
      delete newState.collection.isComposerNew;
      if (isComposerNew) {
        newState.collection.isComposerNew = true;
      }
    }

    newState = {
      ...newState,
      // Keep only the new composer person entity
      persons: (newState.persons || []).filter(
        (p) => p.id === newState.collection?.composerId,
      ),
      // Reset other entity arrays
      mMSourceOnPieceVersions: [],
      pieces: [],
      pieceVersions: [],
      tempoIndications: [],
    };
  }

  if (hasCollectionIdChanged) {
    newState = {
      ...newState,
      // Reset all entity arrays but persons
      mMSourceOnPieceVersions: [],
      pieces: [],
      pieceVersions: [],
      tempoIndications: [],
    };
  }

  return newState;
}
