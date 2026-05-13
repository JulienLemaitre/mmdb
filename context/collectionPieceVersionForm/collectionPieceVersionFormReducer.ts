import {
  CollectionPieceVersionsFormAction,
  CollectionPieceVersionsFormState,
} from "@/types/collectionPieceVersionFormTypes";
import {
  COLLECTION_PIECE_VERSION_FORM_INITIAL_STATE,
  COLLECTION_PIECE_VERSION_FORM_LOCAL_STORAGE_KEY,
} from "@/utils/constants";
import { withLocalStorage } from "@/context/utils/localStorageReducerWrapper";
import { prodLog } from "@/utils/debugLogger";
import { assertNever } from "@/types/typescriptUtils";
import { upsertManyEntities } from "@/utils/upsertManyEntities";
import { upsertManyMMSourceOnPieceVersions } from "@/context/collectionPieceVersionForm/utils/upsertManyMMSourceOnPieceVersions";
import { deleteManyMMSourceOnPieceVersions } from "@/context/collectionPieceVersionForm/utils/deleteManyMMSourceOnPieceVersions";
import { moveMMSourceOnPieceVersion } from "@/context/collectionPieceVersionForm/utils/moveMMSourceOnPieceVersion";
import { handleCollectionAction } from "@/context/collectionPieceVersionForm/utils/handleCollectionAction";

function collectionPieceVersionsFormReducerCore(
  state: CollectionPieceVersionsFormState,
  action: CollectionPieceVersionsFormAction,
) {
  prodLog.group(`[collectionPieceVersionsFormReducer]`);
  // if ("payload" in action) {
  //   prodLog.log(`action.payload`, action.payload);
  // } else {
  // prodLog.log(`action.type :`, action.type);
  // }
  prodLog.info("action", action);

  let newState = { ...state };

  // 1. Handle state treatment according to action type
  switch (action.type) {
    case "init": {
      newState = action.payload || COLLECTION_PIECE_VERSION_FORM_INITIAL_STATE;
      break;
    }

    case "goToPrevStep": {
      newState = goToPrevStep(state);
      break;
    }

    case "goToStep": {
      newState = goToStep(state, action.payload.stepRank);
      break;
    }

    case "formInfo": {
      newState = {
        ...state,
        formInfo: {
          ...state.formInfo,
          ...action.payload,
        },
      };
      break;
    }

    case "collection": {
      newState = handleCollectionAction(state, action.payload);
      break;
    }

    case "persons": {
      newState = upsertManyEntities(state, "persons", action.payload.array);
      break;
    }

    case "pieces": {
      newState = upsertManyEntities(state, "pieces", action.payload.array);
      break;
    }

    case "pieceVersions": {
      newState = upsertManyEntities(
        state,
        "pieceVersions",
        action.payload.array,
      );
      break;
    }

    case "tempoIndications": {
      newState = upsertManyEntities(
        state,
        "tempoIndications",
        action.payload.array,
      );
      break;
    }

    case "mMSourceOnPieceVersions": {
      if ("array" in action.payload) {
        newState = upsertManyMMSourceOnPieceVersions(
          state,
          action.payload.array,
          action.payload.idKey,
        );
      } else if ("deleteIdArray" in action.payload) {
        newState = deleteManyMMSourceOnPieceVersions(
          state,
          action.payload.deleteIdArray,
        );
      } else if ("movePiece" in action.payload) {
        newState = moveMMSourceOnPieceVersion(state, action.payload.movePiece);
      } else {
        assertNever(action.payload);
      }

      break;
    }

    default:
      assertNever(action);
  }

  // 2. Increment currentStepRank if property 'next = true' in any payload
  if (
    "payload" in action &&
    action.payload &&
    "next" in action.payload &&
    action.payload.next === true &&
    typeof state?.formInfo?.currentStepRank === "number"
  ) {
    newState = {
      ...newState,
      formInfo: {
        ...newState.formInfo,
        currentStepRank: state.formInfo.currentStepRank + 1,
      },
    };
  }

  prodLog.groupEnd();
  return newState;
}

export const collectionPieceVersionsFormReducer = withLocalStorage(
  collectionPieceVersionsFormReducerCore,
  COLLECTION_PIECE_VERSION_FORM_LOCAL_STORAGE_KEY,
  COLLECTION_PIECE_VERSION_FORM_INITIAL_STATE,
);

function goToPrevStep(state: CollectionPieceVersionsFormState) {
  const currentStepRank = state?.formInfo?.currentStepRank || 1;
  return {
    ...state,
    formInfo: {
      ...state.formInfo,
      currentStepRank: currentStepRank - 1,
      isSinglePieceVersionFormOpen: false,
    },
  };
}

function goToStep(
  state: CollectionPieceVersionsFormState,
  stepRank: number,
): CollectionPieceVersionsFormState {
  return {
    ...state,
    formInfo: {
      ...state.formInfo,
      currentStepRank: stepRank,
      isSinglePieceVersionFormOpen: false,
    },
  };
}
