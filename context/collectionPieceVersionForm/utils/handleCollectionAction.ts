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
    // Delete collection.id, .title and .isNew if exists
    if (newState.collection?.id) {
      prodLog.log(
        `[composer changed] delete collection.id, .title and .isNew -`,
      );
      delete newState.collection.id;
      delete newState.collection.title;
      delete newState.collection.isNew;
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
