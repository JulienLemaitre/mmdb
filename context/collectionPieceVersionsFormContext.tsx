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
import { collectionPieceVersionsFormReducer } from "@/context/collectionPieceVersionFormReducer";
import {
  CollectionPieceVersionsFormProviderProps,
  CollectionPieceVersionsFormState,
  Dispatch,
} from "@/types/collectionPieceVersionFormTypes";
import {
  COLLECTION_PIECE_VERSION_FORM_INITIAL_STATE,
  COLLECTION_PIECE_VERSION_FORM_LOCAL_STORAGE_KEY,
} from "@/utils/constants";
import { localStorageGetItem } from "@/utils/localStorage";

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

export function updateCollectionPieceVersionsForm(dispatch, type, value) {
  dispatch({ type, payload: value });
}

export function initCollectionPieceVersionsForm(
  dispatch,
  initialState = COLLECTION_PIECE_VERSION_FORM_INITIAL_STATE,
) {
  dispatch({ type: "init", payload: initialState });
}
