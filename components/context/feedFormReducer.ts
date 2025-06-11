import { FeedFormState, PieceFormAction } from "@/types/feedFormTypes";
import upsertEntityInState from "@/utils/upsertEntityInState";
import { localStorageSetItem } from "@/utils/localStorage";
import { steps } from "@/components/multiStepMMSourceForm/stepsUtils";
import {
  FEED_FORM_INITIAL_STATE,
  FEED_FORM_LOCAL_STORAGE_KEY,
} from "@/utils/constants";
import { cleanFeedFormState } from "@/components/context/cleanFeedFormState";

const allowedActions = new Set();
steps.forEach((step) =>
  step.actionTypes.forEach((actionType) => allowedActions.add(actionType)),
);

export function feedFormReducer(state: FeedFormState, action: PieceFormAction) {
  // Navigation back
  if (action.type === "goToPrevStep") {
    console.log(`[feedFormReducer]`, action.type);
    const currentStepRank = state?.formInfo?.currentStepRank || 1;
    return {
      ...state,
      formInfo: {
        ...state.formInfo,
        currentStepRank: currentStepRank - 1,
      },
    };
  }

  console.log(`[feedFormReducer]`, action.type, action.payload);

  // Reset
  if (action.type === "init") {
    localStorageSetItem(
      FEED_FORM_LOCAL_STORAGE_KEY,
      action.payload || FEED_FORM_INITIAL_STATE,
    );
    return action.payload || FEED_FORM_INITIAL_STATE;
  }

  // Navigation to specific step
  if (action.type === "goToStep") {
    const { stepRank } = action.payload;
    const newState = {
      ...state,
      formInfo: {
        ...state.formInfo,
        currentStepRank: stepRank,
      },
    };
    localStorageSetItem(FEED_FORM_LOCAL_STORAGE_KEY, newState);
    return;
  }

  const isActionAllowed = allowedActions.has(action.type);

  if (isActionAllowed) {
    const {
      array,
      deleteIdArray,
      idKey,
      next,
      reset,
      value,
      isCollectionUpdate,
    } = action.payload || {};

    let newState = state;

    // If payload is an entity array and reset = false, we update the entity in state if exists, or create it otherwise.
    if (array && !reset && !isCollectionUpdate) {
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

    // If payload is an entity array and reset = true, we reset the entity array in state with the given array
    if (array && reset && !isCollectionUpdate) {
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

    // In case of a collection update, we receive:
    //  - the sourceOnPieceVersion array, that can have a different length than before update.
    //  - the first sourceOnPieceVersion has the same starting rank as before update
    //  => We need to do the following:
    //    - compare the collection length before and after update.
    //    - adjust the rank of sourceOnPieceVersions that come after the collection items accordingly.
    if (
      array &&
      isCollectionUpdate &&
      action.type === "mMSourcePieceVersions"
    ) {
      // Find the collectionId from the first item in the sourceOnPieceVersion array
      if (array.length === 0) {
        // If the array is empty, we can't proceed with collection update
        console.warn(
          "[feedFormReducer] Cannot perform collection update with empty array",
        );
        return state;
      }

      const firstSourceOnPieceVersion = array[0];
      const firstPieceVersion = state.pieceVersions?.find(
        (pv) => pv.id === firstSourceOnPieceVersion.pieceVersionId,
      );

      if (!firstPieceVersion) {
        console.warn(
          "[feedFormReducer] Cannot find piece version for collection update",
        );
        return state;
      }

      const firstPiece = state.pieces?.find(
        (p) => p.id === firstPieceVersion.pieceId,
      );

      if (!firstPiece?.collectionId) {
        console.warn(
          "[feedFormReducer] Cannot find piece.collectionId for collection update",
        );
        return state;
      }

      const collectionId = firstPiece.collectionId;
      const startingRank = firstSourceOnPieceVersion.rank;

      // Count how many items the collection had in state before update
      const collectionPieceVersionIds =
        state.pieces
          ?.filter((p) => p.collectionId === collectionId)
          ?.map(
            (p) => state.pieceVersions?.find((pv) => pv.pieceId === p.id)?.id,
          )
          ?.filter(Boolean) || [];

      const existingCollectionSourceOnPieceVersions = (
        state.mMSourcePieceVersions || []
      ).filter((spv) => collectionPieceVersionIds.includes(spv.pieceVersionId));

      const collectionCountBefore =
        existingCollectionSourceOnPieceVersions.length;
      const collectionCountAfter = array.length;
      console.log(
        `[feedFormReducer] Collection length before: ${collectionCountBefore} - after: ${collectionCountAfter}`,
      );

      // Items that come before this collection
      const itemsBeforeCollection = (state.mMSourcePieceVersions || []).filter(
        (spv) => spv.rank < startingRank,
      );
      console.log(
        `[feedFormReducer] itemsBeforeCollection length :`,
        itemsBeforeCollection.length,
      );

      // Get items that come after this collection in the source
      const itemsAfterCollection = (state.mMSourcePieceVersions || []).filter(
        (spv) => spv.rank > startingRank + collectionCountBefore - 1,
      );
      console.log(
        `[feedFormReducer] itemsAfterCollection length :`,
        itemsAfterCollection.length,
      );

      // If the collection size has changed, we need to adjust the rank of items that come after
      const rankDifference = collectionCountAfter - collectionCountBefore;

      // Items that come after with adjusted ranks
      const adjustedItemsAfter = itemsAfterCollection.map((item) => ({
        ...item,
        rank: item.rank + rankDifference,
      }));

      // Remove existing collection items
      let finalArray = [
        ...itemsBeforeCollection,
        ...array,
        ...adjustedItemsAfter,
      ];

      newState = {
        ...newState,
        [action.type]: finalArray,
      };
    }

    // If the payload is a deleteIdArray, we update the state accordingly
    if (deleteIdArray) {
      // For each entity in the array
      deleteIdArray.forEach((idToDelete) => {
        const id = idKey || "id";
        // If we find an entity in state with the same id, we remove it
        const isEntityInState = newState[action.type]?.some(
          (stateEntity) => idToDelete && stateEntity[id] === idToDelete,
        );
        if (isEntityInState) {
          console.log(`[] REMOVE entity in array with id :`, idToDelete);
          newState = {
            ...newState,
            [action.type]: newState[action.type].filter(
              (stateEntity) => stateEntity[id] !== idToDelete,
            ),
          };
        } else {
          // otherwise, we warn entity was not found
          console.log(`[] NOT FOUND - entity to REMOVE with id :`, idToDelete);
        }
      });
    }

    // otherwise, the payload is an object, we update the state object accordingly
    if (value) {
      newState = {
        ...state,
        [action.type]: { ...(state[action.type] || {}), ...value },
      };
    }

    // We increment currentStep if we are told to with the property 'next' in any payload
    if (next === true && typeof state?.formInfo?.currentStepRank === "number") {
      newState = {
        ...newState,
        formInfo: {
          ...newState.formInfo,
          currentStepRank: state.formInfo.currentStepRank + 1,
        },
      };
    }

    // Cleaning the state from unused entities, except while adding a piece or collection form is opened
    const isSourceOnPieceVersionFormOpen =
      state?.formInfo?.isSourceOnPieceVersionformOpen;
    const closeSourceOnPieceVersionFormAction =
      action.type === "formInfo" &&
      action.payload?.value?.isSourceOnPieceVersionformOpen === false;
    const otherFormInfoAction =
      action.type === "formInfo" &&
      action.payload?.value?.isSourceOnPieceVersionformOpen === undefined;
    if (
      !otherFormInfoAction &&
      // We don't clean state during single or collection piece version form, except at its closing.
      (!isSourceOnPieceVersionFormOpen || closeSourceOnPieceVersionFormAction)
    ) {
      newState = cleanFeedFormState(newState);
    } else {
      console.log(`NOT Cleaning state`, {
        condition1: !otherFormInfoAction,
        condition2:
          !isSourceOnPieceVersionFormOpen ||
          closeSourceOnPieceVersionFormAction,
      });
    }

    // Make sure mMSourcePieceVersions ranks are continuous and begin at 1
    newState.mMSourcePieceVersions = (newState.mMSourcePieceVersions || []).map(
      (mMSourcePieceVersion, index) => ({
        ...mMSourcePieceVersion,
        rank: index + 1,
      }),
    );

    localStorageSetItem(FEED_FORM_LOCAL_STORAGE_KEY, newState);
    return newState;
  } else {
    console.log(`[] Action not allowed: action.type`, action.type);
  }
  throw new Error(
    `[FeedFormContext] Unhandled${!isActionAllowed ? ` (Not allowed)` : ""} action type: ${action.type}`,
  );
}
