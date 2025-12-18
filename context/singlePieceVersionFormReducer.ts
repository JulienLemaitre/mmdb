import {
  SinglePieceVersionFormAction,
  SinglePieceVersionFormState,
} from "@/types/singlePieceVersionFormTypes";
import {
  getAllowedActions,
  getLastCompletedStep,
} from "@/features/feed/multiStepSinglePieceVersionForm/stepsUtils";
import {
  SINGLE_PIECE_VERSION_FORM_INITIAL_STATE,
  SINGLE_PIECE_VERSION_FORM_LOCAL_STORAGE_KEY,
} from "@/utils/constants";
import { withLocalStorage } from "@/context/utils/localStorageReducerWrapper";

function singlePieceVersionFormReducerCore(
  state: SinglePieceVersionFormState,
  action: SinglePieceVersionFormAction,
): any {
  console.group(`[SinglePieceVersionFormReducer]`);
  console.log(`action.type :`, action.type);

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

  console.log(`action.payload :`, action.payload);

  // Reset
  if (action.type === "init") {
    const initialState =
      action.payload || SINGLE_PIECE_VERSION_FORM_INITIAL_STATE;
    console.groupEnd();
    return initialState;
  }

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

  const allowedActions = getAllowedActions();
  const isActionAllowed = allowedActions.has(action.type);

  // Entries created
  if (isActionAllowed) {
    const { next, value } = action.payload || {};

    let newState = state;

    // We update the state by assigning the value of the payload to the property [action.type]. No update here.
    if (value) {
      newState = {
        ...state,
        [action.type]: value,
      };
    }

    // Delete all values for entities depending on the present edited one, if the id of it has changed
    const entitiesWithId = ["composer", "piece", "pieceVersion"];
    if (
      state[action.type]?.id &&
      state[action.type]?.id !== (newState[action.type] || {}).id
    ) {
      for (const entity of entitiesWithId) {
        if (entity === action.type) continue;
        if (
          entitiesWithId.indexOf(entity) >
            entitiesWithId.indexOf(action.type) &&
          newState[entity]
        ) {
          console.log(`[SinglePieceVersionFormReducer] DELETE entity:`, entity);
          delete newState[entity];
        }
      }
    }

    // We increment currentStepRank if we are told to with the property 'next' in any payload, AND if the present step is completed
    const lastCompletedStep = getLastCompletedStep(newState);

    if (
      next === true &&
      typeof state?.formInfo?.currentStepRank === "number" &&
      lastCompletedStep &&
      state?.formInfo?.currentStepRank <= lastCompletedStep?.rank
    ) {
      console.log(
        `[SOPVFContext] NEXT - go to step:`,
        state.formInfo.currentStepRank + 1,
      );
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

  throw new Error(`Unhandled action type: ${action.type}`);
}

export const singlePieceVersionFormReducer = withLocalStorage(
  singlePieceVersionFormReducerCore,
  SINGLE_PIECE_VERSION_FORM_LOCAL_STORAGE_KEY,
  SINGLE_PIECE_VERSION_FORM_INITIAL_STATE,
);
