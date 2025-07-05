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
    return newState;
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

    // Handle moving a piece up or down
    if (action.payload?.movePiece && action.type === "mMSourcePieceVersions") {
      const { pieceVersionId, direction } = action.payload.movePiece;

      // Find the mMSourcePieceVersions to move
      const mMSourcePieceVersionsToMove = newState.mMSourcePieceVersions?.find(
        (spv) => spv.pieceVersionId === pieceVersionId,
      );

      if (!mMSourcePieceVersionsToMove) {
        console.warn(
          `[feedFormReducer] Cannot find mMSourcePieceVersions to move for pieceVersionId: ${pieceVersionId}`,
        );
        return state;
      }

      // Find the target rank
      const targetRank =
        direction === "up"
          ? mMSourcePieceVersionsToMove.rank - 1
          : mMSourcePieceVersionsToMove.rank + 1;

      // Find the piece at the target rank
      const pieceAtTargetRank = newState.mMSourcePieceVersions?.find(
        (spv) => spv.rank === targetRank,
      );

      if (!pieceAtTargetRank) {
        console.warn(
          `[feedFormReducer] Cannot find piece version at rank ${targetRank}`,
        );
        return state;
      }

      // Check if the piece at target rank is part of a collection
      const pieceVersion = newState.pieceVersions?.find(
        (pv) => pv.id === pieceAtTargetRank.pieceVersionId,
      );

      if (!pieceVersion) {
        console.warn(
          `[feedFormReducer] Cannot find piece version for pieceVersionId: ${pieceAtTargetRank.pieceVersionId}`,
        );
        return state;
      }

      const piece = newState.pieces?.find((p) => p.id === pieceVersion.pieceId);

      if (!piece) {
        console.warn(
          `[feedFormReducer] Cannot find piece for pieceId: ${pieceVersion.pieceId}`,
        );
        return state;
      }

      // If the piece at target rank is part of a collection, we need to swap with the entire collection
      if (
        piece.collectionId &&
        state.collections?.find((c) => c.id === piece.collectionId) // This prevents from triggering this collection handling behavior if a piece of a collection has been added as a single piece
      ) {
        // Find all pieces in the collection
        const collectionPieceVersionIds =
          newState.pieceVersions
            ?.filter((pv) =>
              newState.pieces?.some(
                (p) =>
                  p.id === pv.pieceId && p.collectionId === piece.collectionId,
              ),
            )
            ?.map((pv) => pv.id) || [];

        // Find all mMSourcePieceVersions for this collection
        const collectionMMSourcePieceVersions =
          newState.mMSourcePieceVersions?.filter((spv) =>
            collectionPieceVersionIds.includes(spv.pieceVersionId),
          );

        if (
          !collectionMMSourcePieceVersions ||
          collectionMMSourcePieceVersions.length === 0
        ) {
          console.warn(
            `[feedFormReducer] Cannot find mMSourcePieceVersions for collection: ${piece.collectionId}`,
          );
          return state;
        }

        // Find the first and last ranks in the collection
        const collectionFirstRank = Math.min(
          ...collectionMMSourcePieceVersions.map((spv) => spv.rank),
        );
        const collectionLastRank = Math.max(
          ...collectionMMSourcePieceVersions.map((spv) => spv.rank),
        );
        const collectionLength = collectionLastRank - collectionFirstRank + 1;
        console.log(`[] collectionLength :`, collectionLength);

        console.log(
          `[] collectionPieceVersionIds :`,
          collectionPieceVersionIds,
        );

        // Update the ranks - true swap between single piece and collection
        const updatedMMSourcePieceVersions = newState.mMSourcePieceVersions
          ?.map((spv) => {
            // If this is the mMSourcePieceVersion being moved (single piece)
            if (spv.pieceVersionId === pieceVersionId) {
              // Move the single mMSourcePieceVersion by the length of the collection being swapped with
              return {
                ...spv,
                rank:
                  direction === "up"
                    ? spv.rank - collectionLength
                    : spv.rank + collectionLength,
              };
            }

            // If this mMSourcePieceVersion is in the swapped collection
            if (collectionPieceVersionIds.includes(spv.pieceVersionId)) {
              // Move the entire collection one rank up or down
              return {
                ...spv,
                rank: spv.rank + (direction === "up" ? 1 : -1),
              };
            }

            return spv;
          })
          .sort((a, b) => a.rank - b.rank);

        newState = {
          ...newState,
          mMSourcePieceVersions: updatedMMSourcePieceVersions,
        };

        return newState;
      } else {
        // Simple case: swap with a single piece
        const updatedPieces = newState.mMSourcePieceVersions
          ?.map((spv) => {
            if (spv.pieceVersionId === pieceVersionId) {
              return { ...spv, rank: targetRank };
            }
            if (spv.pieceVersionId === pieceAtTargetRank.pieceVersionId) {
              return { ...spv, rank: mMSourcePieceVersionsToMove.rank };
            }
            return spv;
          })
          .sort((a, b) => a.rank - b.rank);

        newState = {
          ...newState,
          mMSourcePieceVersions: updatedPieces,
        };

        return newState;
      }
    }

    // Handle moving a collection up or down
    if (
      action.payload?.moveCollection &&
      action.type === "mMSourcePieceVersions"
    ) {
      const { collectionId, direction } = action.payload.moveCollection;
      console.log(`[moveCollection] :`, {
        collectionId,
        direction,
      });

      // Find all pieces in the collection being moved
      const collectionPieceVersionIds =
        newState.pieceVersions
          ?.filter((pv) =>
            newState.pieces?.some(
              (p) => p.id === pv.pieceId && p.collectionId === collectionId,
            ),
          )
          ?.map((pv) => pv.id) || [];

      // Find all mMSourcePieceVersions for this collection
      const collectionPieces = newState.mMSourcePieceVersions?.filter((spv) =>
        collectionPieceVersionIds.includes(spv.pieceVersionId),
      );

      if (!collectionPieces || collectionPieces.length === 0) {
        console.warn(
          `[feedFormReducer] Cannot find pieces for collection: ${collectionId}`,
        );
        return state;
      }

      // Find the first and last ranks in the collection
      const firstRank = Math.min(...collectionPieces.map((spv) => spv.rank));
      const lastRank = Math.max(...collectionPieces.map((spv) => spv.rank));

      // Find the target rank (before or after the collection)
      const targetRank = direction === "up" ? firstRank - 1 : lastRank + 1;

      // Find the mMSourcePieceVersion at the target rank
      const mMSourcePieceVersionAtTargetRank =
        newState.mMSourcePieceVersions?.find((spv) => spv.rank === targetRank);

      if (!mMSourcePieceVersionAtTargetRank) {
        console.warn(
          `[feedFormReducer] Cannot find piece at rank ${targetRank}`,
        );
        return state;
      }

      // Check if the piece at target rank is part of a collection
      const targetPieceVersion = newState.pieceVersions?.find(
        (pv) => pv.id === mMSourcePieceVersionAtTargetRank.pieceVersionId,
      );

      if (!targetPieceVersion) {
        console.warn(
          `[feedFormReducer] Cannot find piece version for pieceVersionId: ${mMSourcePieceVersionAtTargetRank.pieceVersionId}`,
        );
        return state;
      }

      const targetPiece = newState.pieces?.find(
        (p) => p.id === targetPieceVersion.pieceId,
      );

      if (!targetPiece) {
        console.warn(
          `[feedFormReducer] Cannot find piece for pieceId: ${targetPieceVersion.pieceId}`,
        );
        return state;
      }

      // If the piece at target rank is part of another collection, we need to swap with that entire collection
      if (
        targetPiece.collectionId &&
        targetPiece.collectionId !== collectionId
      ) {
        console.group(`[] Swap with a whole collection`);
        // Find all pieces in the other collection
        const otherCollectionPieceVersionIds =
          newState.pieceVersions
            ?.filter((pv) =>
              newState.pieces?.some(
                (p) =>
                  p.id === pv.pieceId &&
                  p.collectionId === targetPiece.collectionId,
              ),
            )
            ?.map((pv) => pv.id) || [];
        console.log(
          `[] otherCollectionPieceVersionIds :`,
          otherCollectionPieceVersionIds,
        );

        // Find all mMSourcePieceVersions for the other collection
        const otherCollectionMMSourcePieceVersions =
          newState.mMSourcePieceVersions?.filter((spv) =>
            otherCollectionPieceVersionIds.includes(spv.pieceVersionId),
          );

        if (
          !otherCollectionMMSourcePieceVersions ||
          otherCollectionMMSourcePieceVersions.length === 0
        ) {
          console.warn(
            `[feedFormReducer] Cannot find pieces for other collection: ${targetPiece.collectionId}`,
          );
          return state;
        }

        // Find the first and last ranks in the other collection
        const otherFirstRank = Math.min(
          ...otherCollectionMMSourcePieceVersions.map((spv) => spv.rank),
        );
        const otherLastRank = Math.max(
          ...otherCollectionMMSourcePieceVersions.map((spv) => spv.rank),
        );
        console.log(`[] otherFirstRank :`, otherFirstRank);
        console.log(`[] otherLastRank :`, otherLastRank);

        // Update the ranks - we need to swap the positions of the two collection's pieces by the length of the other collection
        const updatedPieces = newState.mMSourcePieceVersions
          ?.map((spv) => {
            // If this mMSourcePieceVersion is in the collection being moved
            if (collectionPieceVersionIds.includes(spv.pieceVersionId)) {
              const otherCollectionLength = otherLastRank - otherFirstRank + 1;
              return {
                ...spv,
                rank:
                  direction === "up"
                    ? spv.rank - otherCollectionLength
                    : spv.rank + otherCollectionLength,
              };
            }

            // If this mMSourcePieceVersion is in the other collection being swapped
            if (otherCollectionPieceVersionIds.includes(spv.pieceVersionId)) {
              const collectionLength = lastRank - firstRank + 1;
              return {
                ...spv,
                rank:
                  direction === "up"
                    ? spv.rank + collectionLength
                    : spv.rank - collectionLength,
              };
            }

            return spv;
          })
          .sort((a, b) => a.rank - b.rank);

        newState = {
          ...newState,
          mMSourcePieceVersions: updatedPieces,
        };

        return newState;
      } else {
        console.group(`[feedFormReducer] Swap with a single piece`);
        console.log(
          `[] collectionPieceVersionIds :`,
          collectionPieceVersionIds,
        );
        // Simple case: swap with a single piece
        let mMSourcePieceVersionsToSwap = [mMSourcePieceVersionAtTargetRank];
        console.log(
          `[] mMSourcePieceVersionsToSwap :`,
          mMSourcePieceVersionsToSwap,
        );

        // Update the ranks
        const updatedPieces = newState.mMSourcePieceVersions
          ?.map((spv) => {
            // If this mMSourcePieceVersion is in the collection being moved
            if (collectionPieceVersionIds.includes(spv.pieceVersionId)) {
              return {
                ...spv,
                rank: direction === "up" ? spv.rank - 1 : spv.rank + 1,
              };
            }

            // If this is the mMSourcePieceVersion to swap with
            if (
              mMSourcePieceVersionsToSwap.some(
                (spvts) => spvts.pieceVersionId === spv.pieceVersionId,
              )
            ) {
              return {
                ...spv,
                rank:
                  direction === "up"
                    ? spv.rank + collectionPieces.length
                    : spv.rank - collectionPieces.length,
              };
            }

            return spv;
          })
          .sort((a, b) => a.rank - b.rank);
        console.log(`[] updatedPieces :`, updatedPieces);
        console.groupEnd();

        newState = {
          ...newState,
          mMSourcePieceVersions: updatedPieces,
        };

        return newState;
      }
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
