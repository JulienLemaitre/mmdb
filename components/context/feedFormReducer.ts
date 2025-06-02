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
    const { array, deleteIdArray, idKey, next, replace, value } =
      action.payload || {};

    let newState = state;

    // If payload is an entity array and replace = false, we update the entity in state if exists, or create it otherwise.
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

    // If payload is an entity array and replace = true, we replace the entity array in state with the given array
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

    // TODO: Make sure pieces from a same collection ranks are continuous and begin at 1
    //  OR prevent the suppression of a piece from a collection, only single piece or whole collection can be deleted

    localStorageSetItem(FEED_FORM_LOCAL_STORAGE_KEY, newState);
    return newState;
  } else {
    console.log(`[] Action not allowed: action.type`, action.type);
  }
  throw new Error(
    `[FeedFormContext] Unhandled${!isActionAllowed ? ` (Not allowed)` : ""} action type: ${action.type}`,
  );
}
