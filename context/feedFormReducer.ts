import { FeedFormState, PieceFormAction } from "@/types/feedFormTypes";
import upsertEntityInState from "@/utils/upsertEntityInState";
import { steps } from "@/features/feed/multiStepMMSourceForm/stepsUtils";
import {
  FEED_FORM_INITIAL_STATE,
  FEED_FORM_LOCAL_STORAGE_KEY,
} from "@/utils/constants";
import { cleanFeedFormState } from "@/context/utils/cleanFeedFormState";
import { withLocalStorage } from "@/context/utils/localStorageReducerWrapper";

const allowedActions = new Set();
steps.forEach((step) =>
  step.actionTypes.forEach((actionType) => allowedActions.add(actionType)),
);

function feedFormReducerCore(state: FeedFormState, action: PieceFormAction) {
  console.log(`[feedFormReducer] action.type :`, action.type);

  // Navigation back
  if (action.type === "goToPrevStep") {
    const currentStepRank = state?.formInfo?.currentStepRank || 1;
    return {
      ...state,
      formInfo: {
        ...state.formInfo,
        currentStepRank: currentStepRank - 1,
      },
    };
  }

  console.log(`[feedFormReducer] action.payload`, action.payload);

  // Reset
  if (action.type === "init") {
    return action.payload || FEED_FORM_INITIAL_STATE;
  }

  // Navigation to specific step
  if (action.type === "goToStep") {
    const { stepRank } = action.payload;
    return {
      ...state,
      formInfo: {
        ...state.formInfo,
        currentStepRank: stepRank,
      },
    };
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
      action.type === "mMSourceOnPieceVersions"
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
        state.mMSourceOnPieceVersions || []
      ).filter((spv) => collectionPieceVersionIds.includes(spv.pieceVersionId));

      const collectionCountBefore =
        existingCollectionSourceOnPieceVersions.length;
      const collectionCountAfter = array.length;
      console.log(
        `[feedFormReducer] Collection length before: ${collectionCountBefore} - after: ${collectionCountAfter}`,
      );

      // Items that come before this collection
      const itemsBeforeCollection = (
        state.mMSourceOnPieceVersions || []
      ).filter((spv) => spv.rank < startingRank);
      console.log(
        `[feedFormReducer] itemsBeforeCollection length :`,
        itemsBeforeCollection.length,
      );

      // Get items that come after this collection in the source
      const itemsAfterCollection = (state.mMSourceOnPieceVersions || []).filter(
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
    if (
      action.payload?.movePiece &&
      action.type === "mMSourceOnPieceVersions"
    ) {
      const { pieceVersionId, direction } = action.payload.movePiece;

      // Find the mMSourceOnPieceVersions to move
      const mMSourceOnPieceVersionsToMove =
        newState.mMSourceOnPieceVersions?.find(
          (spv) => spv.pieceVersionId === pieceVersionId,
        );

      if (!mMSourceOnPieceVersionsToMove) {
        console.warn(
          `[feedFormReducer] Cannot find mMSourceOnPieceVersions to move for pieceVersionId: ${pieceVersionId}`,
        );
        return state;
      }

      // Find the target rank
      const targetRank =
        direction === "up"
          ? mMSourceOnPieceVersionsToMove.rank - 1
          : mMSourceOnPieceVersionsToMove.rank + 1;

      // Find the piece at the target rank
      const pieceAtTargetRank = newState.mMSourceOnPieceVersions?.find(
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

        // Find all mMSourceOnPieceVersions for this collection
        const collectionMMSourceOnPieceVersions =
          newState.mMSourceOnPieceVersions?.filter((spv) =>
            collectionPieceVersionIds.includes(spv.pieceVersionId),
          );

        if (
          !collectionMMSourceOnPieceVersions ||
          collectionMMSourceOnPieceVersions.length === 0
        ) {
          console.warn(
            `[feedFormReducer] Cannot find mMSourceOnPieceVersions for collection: ${piece.collectionId}`,
          );
          return state;
        }

        // Find the first and last ranks in the collection
        const collectionFirstRank = Math.min(
          ...collectionMMSourceOnPieceVersions.map((spv) => spv.rank),
        );
        const collectionLastRank = Math.max(
          ...collectionMMSourceOnPieceVersions.map((spv) => spv.rank),
        );
        const collectionLength = collectionLastRank - collectionFirstRank + 1;
        console.log(`[] collectionLength :`, collectionLength);

        console.log(
          `[] collectionPieceVersionIds :`,
          collectionPieceVersionIds,
        );

        // Update the ranks - true swap between single piece and collection
        const updatedMMSourceOnPieceVersions = newState.mMSourceOnPieceVersions
          ?.map((spv) => {
            // If this is the mMSourceOnPieceVersion being moved (single piece)
            if (spv.pieceVersionId === pieceVersionId) {
              // Move the single mMSourceOnPieceVersion by the length of the collection being swapped with
              return {
                ...spv,
                rank:
                  direction === "up"
                    ? spv.rank - collectionLength
                    : spv.rank + collectionLength,
              };
            }

            // If this mMSourceOnPieceVersion is in the swapped collection
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
          mMSourceOnPieceVersions: updatedMMSourceOnPieceVersions,
        };

        return newState;
      } else {
        // Simple case: swap with a single piece
        const updatedPieces = newState.mMSourceOnPieceVersions
          ?.map((spv) => {
            if (spv.pieceVersionId === pieceVersionId) {
              return { ...spv, rank: targetRank };
            }
            if (spv.pieceVersionId === pieceAtTargetRank.pieceVersionId) {
              return { ...spv, rank: mMSourceOnPieceVersionsToMove.rank };
            }
            return spv;
          })
          .sort((a, b) => a.rank - b.rank);

        newState = {
          ...newState,
          mMSourceOnPieceVersions: updatedPieces,
        };

        return newState;
      }
    }

    // Handle moving a collection up or down
    if (
      action.payload?.moveCollection &&
      action.type === "mMSourceOnPieceVersions"
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

      // Find all mMSourceOnPieceVersions for this collection
      const collectionPieces = newState.mMSourceOnPieceVersions?.filter((spv) =>
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

      // Find the mMSourceOnPieceVersion at the target rank
      const mMSourceOnPieceVersionAtTargetRank =
        newState.mMSourceOnPieceVersions?.find(
          (spv) => spv.rank === targetRank,
        );

      if (!mMSourceOnPieceVersionAtTargetRank) {
        console.warn(
          `[feedFormReducer] Cannot find piece at rank ${targetRank}`,
        );
        return state;
      }

      // Check if the piece at target rank is part of a collection
      const targetPieceVersion = newState.pieceVersions?.find(
        (pv) => pv.id === mMSourceOnPieceVersionAtTargetRank.pieceVersionId,
      );

      if (!targetPieceVersion) {
        console.warn(
          `[feedFormReducer] Cannot find piece version for pieceVersionId: ${mMSourceOnPieceVersionAtTargetRank.pieceVersionId}`,
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

        // Find all mMSourceOnPieceVersions for the other collection
        const otherCollectionMMSourceOnPieceVersions =
          newState.mMSourceOnPieceVersions?.filter((spv) =>
            otherCollectionPieceVersionIds.includes(spv.pieceVersionId),
          );

        if (
          !otherCollectionMMSourceOnPieceVersions ||
          otherCollectionMMSourceOnPieceVersions.length === 0
        ) {
          console.warn(
            `[feedFormReducer] Cannot find pieces for other collection: ${targetPiece.collectionId}`,
          );
          return state;
        }

        // Find the first and last ranks in the other collection
        const otherFirstRank = Math.min(
          ...otherCollectionMMSourceOnPieceVersions.map((spv) => spv.rank),
        );
        const otherLastRank = Math.max(
          ...otherCollectionMMSourceOnPieceVersions.map((spv) => spv.rank),
        );
        console.log(`[] otherFirstRank :`, otherFirstRank);
        console.log(`[] otherLastRank :`, otherLastRank);

        // Update the ranks - we need to swap the positions of the two collection's pieces by the length of the other collection
        const updatedPieces = newState.mMSourceOnPieceVersions
          ?.map((spv) => {
            // If this mMSourceOnPieceVersion is in the collection being moved
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

            // If this mMSourceOnPieceVersion is in the other collection being swapped
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
          mMSourceOnPieceVersions: updatedPieces,
        };

        return newState;
      } else {
        console.group(`[feedFormReducer] Swap with a single piece`);
        console.log(
          `[] collectionPieceVersionIds :`,
          collectionPieceVersionIds,
        );
        // Simple case: swap with a single piece
        let mMSourceOnPieceVersionsToSwap = [
          mMSourceOnPieceVersionAtTargetRank,
        ];
        console.log(
          `[] mMSourceOnPieceVersionsToSwap :`,
          mMSourceOnPieceVersionsToSwap,
        );

        // Update the ranks
        const updatedPieces = newState.mMSourceOnPieceVersions
          ?.map((spv) => {
            // If this mMSourceOnPieceVersion is in the collection being moved
            if (collectionPieceVersionIds.includes(spv.pieceVersionId)) {
              return {
                ...spv,
                rank: direction === "up" ? spv.rank - 1 : spv.rank + 1,
              };
            }

            // If this is the mMSourceOnPieceVersion to swap with
            if (
              mMSourceOnPieceVersionsToSwap.some(
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
          mMSourceOnPieceVersions: updatedPieces,
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
      // console.log(`NOT Cleaning state`, {
      //   condition1: !otherFormInfoAction,
      //   condition2:
      //     !isSourceOnPieceVersionFormOpen ||
      //     closeSourceOnPieceVersionFormAction,
      // });
    }

    // Make sure mMSourceOnPieceVersions ranks are continuous and begin at 1
    newState.mMSourceOnPieceVersions = (
      newState.mMSourceOnPieceVersions || []
    ).map((mMSourceOnPieceVersion, index) => ({
      ...mMSourceOnPieceVersion,
      rank: index + 1,
    }));

    return newState;
  } else {
    console.log(
      `[FeedFormContext] Action not allowed: action.type`,
      action.type,
    );
  }
  throw new Error(
    `[FeedFormContext] Unhandled${!isActionAllowed ? ` (Not allowed)` : ""} action type: ${action.type}`,
  );
}

export const feedFormReducer = withLocalStorage(
  feedFormReducerCore,
  FEED_FORM_LOCAL_STORAGE_KEY,
  FEED_FORM_INITIAL_STATE,
);
