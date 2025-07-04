import upsertEntityInState from "@/utils/upsertEntityInState";
import {
  CollectionPieceVersionsFormAction,
  CollectionPieceVersionsFormState,
} from "@/types/collectionPieceVersionFormTypes";
import { collectionFormSteps as steps } from "@/components/multiStepCollectionPieceVersionsForm/stepsUtils";
import { COLLECTION_PIECE_VERSION_FORM_INITIAL_STATE } from "@/utils/constants";

const allowedActions = new Set();
steps.forEach((step) =>
  step.actionTypes.forEach((actionType) => allowedActions.add(actionType)),
);

const arrayEntities = [
  "persons",
  "pieces",
  "pieceVersions",
  "tempoIndications",
  "mMSourcePieceVersions",
];

export function collectionPieceVersionsFormReducer(
  state: CollectionPieceVersionsFormState,
  action: CollectionPieceVersionsFormAction,
) {
  console.group(`[collectionPieceVersionsFormReducer]`);
  console.log(`[] action.type :`, action.type);

  // Navigation back
  if (action.type === "goToPrevStep") {
    const currentStepRank = state?.formInfo?.currentStepRank || 1;
    console.groupEnd();
    return {
      ...state,
      formInfo: {
        ...state.formInfo,
        currentStepRank: currentStepRank - 1,
      },
    };
  }

  console.log(`[] action.payload :`, action.payload);

  // Navigation to specific step
  if (action.type === "goToStep") {
    const { stepRank } = action.payload;
    console.groupEnd();
    return {
      ...state,
      formInfo: {
        ...state.formInfo,
        currentStepRank: stepRank,
      },
    };
  }

  // if (action.type === "collection") {
  //   console.log(`[] UPDATE collection :`, action.payload);
  //   console.groupEnd();
  //   return {
  //     ...state,
  //     collection: action.payload,
  //   };
  // }

  const isActionAllowed = allowedActions.has(action.type);

  // Entries created
  if (isActionAllowed) {
    const { array, deleteIdArray, idKey, next, replace, value } =
      action.payload || {};

    let newState = state;

    // If payload is an entity array and replace = false, we update the state accordingly
    if (array && !replace) {
      // For each entity in the array
      array.forEach((entity) => {
        const id = idKey || "id";

        newState = upsertEntityInState({
          state: newState,
          entityName: action.type,
          entity,
          idKey: id,
        });

        if (entity.person) {
          newState = upsertEntityInState({
            state: newState,
            entityName: "persons",
            entity: entity.person,
          });
        }
        if (entity.organization) {
          newState = upsertEntityInState({
            state: newState,
            entityName: "organizations",
            entity: entity.organization,
          });
        }
      });
    }

    // If payload is an entity array and replace = true, we replace the entity in state
    if (array && replace) {
      newState = {
        ...newState,
        [action.type]: array,
      };
      // For each entity in the array
      array.forEach((entity) => {
        if (entity.person) {
          console.log(`[ADD IN CONTEXT] person:`, entity.person);
          newState = upsertEntityInState({
            state: newState,
            entityName: "persons",
            entity: entity.person,
          });
        }
        if (entity.organization) {
          console.log(`[ADD IN CONTEXT] organization:`, entity.organization);
          newState = upsertEntityInState({
            state: newState,
            entityName: "organizations",
            entity: entity.organization,
          });
        }
      });
    }

    // If payload is a deleteIdArray, we update the state accordingly
    if (deleteIdArray) {
      // For each entity in the array
      deleteIdArray.forEach((idToDelete) => {
        const id = idKey || "id";
        // If we find an entity in state with the same id, we remove it
        const isEntityInState = newState[action.type]?.find(
          (stateEntity) => idToDelete && stateEntity[id] === idToDelete,
        );
        if (isEntityInState) {
          console.log(`[] REMOVE entity in array with id :`, idToDelete);
          newState = {
            ...newState,
            [action.type]: newState[action.type]!.filter(
              (stateEntity) => stateEntity[id] !== idToDelete,
            ),
          };
        } else {
          // otherwise, we warn entity was not found
          console.log(`[] NOT FOUND - entity to REMOVE with id :`, idToDelete);
        }
      });
    }

    // Handle moving a piece up or down
    if (action.payload?.movePiece && action.type === "mMSourcePieceVersions") {
      const { pieceVersionId, direction } = action.payload.movePiece;

      // Find the mMSourcePieceVersion to move
      const mMSourcePieceVersionToMove = newState.mMSourcePieceVersions?.find(
        (spv) => spv.pieceVersionId === pieceVersionId,
      );

      if (!mMSourcePieceVersionToMove) {
        console.warn(
          `[collectionPieceVersionsFormReducer] Cannot find mMSourcePieceVersion to move for pieceVersionId: ${pieceVersionId}`,
        );
        console.groupEnd();
        return state;
      }

      // Find the target rank
      const targetRank =
        direction === "up"
          ? mMSourcePieceVersionToMove.rank - 1
          : mMSourcePieceVersionToMove.rank + 1;

      // Find the piece at the target rank
      const pieceAtTargetRank = newState.mMSourcePieceVersions?.find(
        (spv) => spv.rank === targetRank,
      );

      if (!pieceAtTargetRank) {
        console.warn(
          `[collectionPieceVersionsFormReducer] Cannot find piece version at rank ${targetRank}`,
        );
        console.groupEnd();
        return state;
      }

      // Simple case: swap with a single piece
      const updatedPieces = newState.mMSourcePieceVersions
        ?.map((spv) => {
          if (spv.pieceVersionId === pieceVersionId) {
            return { ...spv, rank: targetRank };
          }
          if (spv.pieceVersionId === pieceAtTargetRank.pieceVersionId) {
            return { ...spv, rank: mMSourcePieceVersionToMove.rank };
          }
          return spv;
        })
        .sort((a, b) => a.rank - b.rank);

      newState = {
        ...newState,
        mMSourcePieceVersions: updatedPieces,
      };

      console.groupEnd();
      return newState;
    }

    // otherwise, the payload is an object, we update the state object accordingly
    if (value) {
      newState = {
        ...state,
        [action.type]: { ...(state[action.type] || {}), ...value },
      };
      const hasComposerChanged =
        newState.collection?.composerId !== state.collection?.composerId;
      const hasCollectionIdChanged =
        newState.collection?.id !== state.collection?.id;

      if (
        action.type === "collection" &&
        (hasComposerChanged || hasCollectionIdChanged)
      ) {
        for (const entity of arrayEntities) {
          if (newState[entity]?.length) {
            console.log(
              `[composer or collection Id changed] reset ${entity} -`,
            );
            newState[entity] = [];
          }
        }

        // If composer has changed, we delete collection.id and collection.title if exists
        if (hasComposerChanged && newState.collection?.id) {
          console.log(
            `[composer changed] delete collection.id and collection.title -`,
          );
          delete newState.collection.id;
          delete newState.collection.title;
        }
      }
    }

    // We increment currentStep of we are told to with the property 'next = true' in any payload
    if (next === true && typeof state?.formInfo?.currentStepRank === "number") {
      newState = {
        ...newState,
        formInfo: {
          ...newState.formInfo,
          currentStepRank: state.formInfo.currentStepRank + 1,
        },
      };
    }

    console.groupEnd();
    return newState;
  }

  if (action.type === "init") {
    console.log(`[] INIT state :`, action.payload);
    console.groupEnd();
    return action.payload || COLLECTION_PIECE_VERSION_FORM_INITIAL_STATE;
  }
  console.groupEnd();
  throw new Error(`[CollectionContext] Unhandled action type: ${action.type}`);
}
