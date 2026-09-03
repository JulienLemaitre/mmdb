"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import {
  getLastCompletedStep,
  getSinglePieceFormStepByRank,
} from "@/features/feed/multiStepSinglePieceVersionForm/stepsUtils";
import {
  SinglePieceVersionFormAction,
  SinglePieceVersionFormProviderProps,
  SinglePieceVersionFormState,
} from "@/types/singlePieceVersionFormTypes";
import { createSinglePieceVersionFormReducer } from "@/context/singlePieceVersionFormReducer";
import { localStorageGetItem } from "@/utils/localStorage";
import {
  SINGLE_PIECE_VERSION_FORM_INITIAL_STATE,
  SINGLE_PIECE_VERSION_FORM_LOCAL_STORAGE_KEY,
} from "@/utils/constants";

type Dispatch = (action: SinglePieceVersionFormAction) => void;

const SinglePieceVersionFormContext = createContext<
  | {
      state: SinglePieceVersionFormState;
      dispatch: Dispatch;
    }
  | undefined
>(undefined);

export function SinglePieceVersionFormProvider({
  children,
  storageKey = SINGLE_PIECE_VERSION_FORM_LOCAL_STORAGE_KEY,
  initialState,
}: Readonly<SinglePieceVersionFormProviderProps>) {
  const [reducer] = useState(() =>
    createSinglePieceVersionFormReducer(
      storageKey,
      initialState || SINGLE_PIECE_VERSION_FORM_INITIAL_STATE,
    ),
  );
  const [state, dispatch] = useReducer(
    reducer,
    initialState || SINGLE_PIECE_VERSION_FORM_INITIAL_STATE,
  );

  useEffect(() => {
    if (initialState) {
      console.info(
        `[useEffect] initialState is not null => don't use localStorage value`,
      );
      return;
    }
    const localStorageValue: any = localStorageGetItem(storageKey);
    if (localStorageValue) {
      console.info(
        `[INIT] SinglePieceVersions from localStorage key: ${storageKey}`,
        localStorageValue,
      );
      initSinglePieceVersionForm(dispatch, localStorageValue);
    }
  }, [initialState, storageKey]);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return (
    <SinglePieceVersionFormContext.Provider value={value}>
      {children}
    </SinglePieceVersionFormContext.Provider>
  );
}

export function useSinglePieceVersionForm() {
  const context = useContext(SinglePieceVersionFormContext);
  if (context === undefined) {
    throw new Error(
      "useSinglePieceVersionForm must be used within a SinglePieceVersionFormProvider",
    );
  }
  const lastCompletedStep = getLastCompletedStep(context.state);
  const nextStep = getSinglePieceFormStepByRank(
    lastCompletedStep ? lastCompletedStep?.rank + 1 : 0,
  );
  return {
    ...context,
    lastCompletedStepId: lastCompletedStep?.id,
    lastCompletedStepRank: lastCompletedStep?.rank,
    nextStepToCompleteId: nextStep?.id,
    nextStepToCompleteRank: nextStep?.rank || 0,
    currentStepRank: context.state.formInfo?.currentStepRank || 0,
  };
}

export function updateSinglePieceVersionForm(dispatch, type, value?: any) {
  dispatch({ type, payload: value });
}

export function initSinglePieceVersionForm(
  dispatch,
  initialState = SINGLE_PIECE_VERSION_FORM_INITIAL_STATE,
) {
  dispatch({ type: "init", payload: initialState });
}
