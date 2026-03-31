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
): SinglePieceVersionFormState {
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

    // We define the new state by assigning the value of the payload to the property [action.type].
    // - No update here.
    // - 'undefined' delete the entity from state.
    let newState = {
      ...state,
      [action.type]: value,
    };

    const prevComposerId = state.composer?.id;
    const nextComposerId = newState.composer?.id;
    const prevPieceId = state.piece?.id;
    const nextPieceId = newState.piece?.id;

    const clearPieceAndPieceVersion = () => {
      newState = {
        ...newState,
        piece: undefined,
        pieceVersion: undefined,
      };
    };

    const clearPieceVersion = () => {
      newState = {
        ...newState,
        pieceVersion: undefined,
      };
    };

    // Explicit reset of dependent entities when the current entity is cleared.
    if (action.type === "composer" && value === undefined) {
      clearPieceAndPieceVersion();
    }

    if (action.type === "piece" && value === undefined) {
      clearPieceVersion();
    }

    // If the composer changes, the piece and the pieceVersion become invalid.
    if (
      action.type === "composer" &&
      prevComposerId &&
      nextComposerId &&
      prevComposerId !== nextComposerId
    ) {
      console.warn(
        "[SinglePieceVersionFormReducer] Composer changed: resetting piece and pieceVersion because they depend on the composer.",
      );
      clearPieceAndPieceVersion();
    }

    // If the piece changes, the pieceVersion becomes invalid.
    if (
      action.type === "piece" &&
      prevPieceId &&
      nextPieceId &&
      prevPieceId !== nextPieceId
    ) {
      console.warn(
        "[SinglePieceVersionFormReducer] Piece changed: resetting pieceVersion because it depends on the piece.",
      );
      clearPieceVersion();
    }

    // Defensive coherence checks
    if (
      action.type === "piece" &&
      newState.piece &&
      newState.composer?.id &&
      newState.piece.composerId !== newState.composer.id
    ) {
      console.warn(
        "[SinglePieceVersionFormReducer] Incoherent piece.composerId detected. The container should normally align piece.composerId with the selected composer.id.",
        {
          pieceComposerId: newState.piece.composerId,
          composerId: newState.composer.id,
        },
      );
    }

    if (
      action.type === "pieceVersion" &&
      newState.pieceVersion &&
      newState.piece?.id &&
      newState.pieceVersion.pieceId !== newState.piece.id
    ) {
      console.warn(
        "[SinglePieceVersionFormReducer] Incoherent pieceVersion.pieceId detected. The container should normally align pieceVersion.pieceId with the selected piece.id.",
        {
          pieceVersionPieceId: newState.pieceVersion.pieceId,
          pieceId: newState.piece.id,
        },
      );
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
