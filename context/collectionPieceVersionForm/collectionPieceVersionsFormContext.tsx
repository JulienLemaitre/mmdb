"use client";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import {
  getCollectionFormStepByRank,
  getLastCompletedStep,
} from "@/features/feed/multiStepCollectionPieceVersionsForm/stepsUtils";
import { collectionPieceVersionsFormReducer } from "@/context/collectionPieceVersionForm/collectionPieceVersionFormReducer";
import {
  CollectionPieceVersionsFormInfo,
  CollectionPieceVersionsFormProviderProps,
  CollectionPieceVersionsFormState,
  Dispatch,
} from "@/types/collectionPieceVersionFormTypes";
import {
  COLLECTION_PIECE_VERSION_FORM_INITIAL_STATE,
  COLLECTION_PIECE_VERSION_FORM_LOCAL_STORAGE_KEY,
} from "@/utils/constants";
import { localStorageGetItem } from "@/utils/localStorage";
import {
  CollectionState,
  MMSourceOnPieceVersionsState,
  PersonState,
  PieceState,
  PieceVersionState,
  TempoIndicationState,
} from "@/types/formTypes";

const CollectionPieceVersionsFormContext = createContext<
  | {
      state: CollectionPieceVersionsFormState;
      dispatch: Dispatch;
    }
  | undefined
>(undefined);

export function CollectionPieceVersionsFormProvider({
  children,
  initialState,
}: Readonly<CollectionPieceVersionsFormProviderProps>) {
  const [state, dispatch] = useReducer(
    collectionPieceVersionsFormReducer,
    initialState || COLLECTION_PIECE_VERSION_FORM_INITIAL_STATE,
  );

  useEffect(() => {
    const localStorageValue = localStorageGetItem(
      COLLECTION_PIECE_VERSION_FORM_LOCAL_STORAGE_KEY,
    );
    if (localStorageValue) {
      console.log(
        `[INIT] collectionPieceVersionsForm from localStorage`,
        localStorageValue,
      );
      initCollectionPieceVersionsForm(dispatch, localStorageValue);
    }
  }, []);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return (
    <CollectionPieceVersionsFormContext.Provider value={value}>
      {children}
    </CollectionPieceVersionsFormContext.Provider>
  );
}

export function useCollectionPieceVersionsForm() {
  const context = useContext(CollectionPieceVersionsFormContext);
  if (context === undefined) {
    throw new Error(
      "useCollectionPieceVersionsForm must be used within a CollectionPieceVersionsFormProvider",
    );
  }
  const lastCompletedStep = getLastCompletedStep(context.state);
  const nextStep = getCollectionFormStepByRank(
    lastCompletedStep ? lastCompletedStep?.rank + 1 : 0,
  );
  return {
    ...context,
    lastCompletedStepId: lastCompletedStep?.id,
    lastCompletedStepRank: lastCompletedStep?.rank,
    nextStepToCompleteId: nextStep.id,
    nextStepToCompleteRank: nextStep.rank || 0,
    currentStepRank: context.state.formInfo?.currentStepRank || 0,
  };
}

export function goToCollectionFormStep(dispatch: Dispatch, stepRank: number) {
  if (stepRank < 0) {
    throw new Error("Step rank cannot be negative");
  }
  dispatch({ type: "goToStep", payload: { stepRank } });
}

export function initCollectionPieceVersionsForm(
  dispatch: Dispatch,
  initialState: CollectionPieceVersionsFormState = COLLECTION_PIECE_VERSION_FORM_INITIAL_STATE,
) {
  dispatch({ type: "init", payload: initialState });
}

// Action creator typés

export function updateCollectionFormInfo(
  dispatch: Dispatch,
  payload: Partial<CollectionPieceVersionsFormInfo>,
) {
  dispatch({ type: "formInfo", payload });
}

export function updateCollection(
  dispatch: Dispatch,
  payload: {
    value: Partial<CollectionState & { isComposerNew?: boolean }> | undefined;
    reset?: boolean;
    next?: boolean;
  },
) {
  dispatch({ type: "collection", payload });
}

export function upsertCollectionPersons(
  dispatch: Dispatch,
  payload: {
    array: PersonState[];
  },
) {
  dispatch({ type: "persons", payload });
}

export function upsertCollectionPieces(
  dispatch: Dispatch,
  payload: {
    array: PieceState[];
    reset?: boolean;
  },
) {
  dispatch({ type: "pieces", payload });
}

export function upsertCollectionPieceVersions(
  dispatch: Dispatch,
  payload: {
    array: PieceVersionState[];
  },
) {
  dispatch({ type: "pieceVersions", payload });
}

export function upsertCollectionTempoIndications(
  dispatch: Dispatch,
  payload: {
    array: TempoIndicationState[];
  },
) {
  dispatch({ type: "tempoIndications", payload });
}

export function upsertCollectionMMSourceOnPieceVersions(
  dispatch: Dispatch,
  payload:
    | { array: MMSourceOnPieceVersionsState[]; idKey?: string }
    | { deleteIdArray: string[] }
    | { movePiece: { pieceVersionId: string; direction: "up" | "down" } },
) {
  dispatch({ type: "mMSourceOnPieceVersions", payload });
}
