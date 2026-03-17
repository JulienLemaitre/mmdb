"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import {
  getLastCompletedStep,
  getSinglePieceFormStepByRank,
} from "@/features/feed/multiStepSinglePieceVersionForm/stepsUtils";
import {
  SinglePieceVersionFormAction,
  SinglePieceVersionFormState,
} from "@/types/singlePieceVersionFormTypes";
import { singlePieceVersionFormReducer } from "@/context/singlePieceVersionFormReducer";
import { localStorageGetItem } from "@/utils/localStorage";
import {
  SINGLE_PIECE_VERSION_FORM_INITIAL_STATE,
  SINGLE_PIECE_VERSION_FORM_LOCAL_STORAGE_KEY,
} from "@/utils/constants";

type Dispatch = (action: SinglePieceVersionFormAction) => void;

type SinglePieceVersionFormProviderProps = {
  children: ReactNode;
  initialState?: SinglePieceVersionFormState | null;
};

const SinglePieceVersionFormContext = createContext<
  | {
      state: SinglePieceVersionFormState;
      dispatch: Dispatch;
    }
  | undefined
>(undefined);

export function SinglePieceVersionFormProvider({
  children,
  initialState,
}: Readonly<SinglePieceVersionFormProviderProps>) {
  const [state, dispatch] = useReducer(
    singlePieceVersionFormReducer,
    initialState || SINGLE_PIECE_VERSION_FORM_INITIAL_STATE,
  );

  useEffect(() => {
    const localStorageValue = localStorageGetItem(
      SINGLE_PIECE_VERSION_FORM_LOCAL_STORAGE_KEY,
    );
    if (localStorageValue) {
      console.log(
        `[INIT] SinglePieceVersions from localStorage`,
        localStorageValue,
      );
      initSinglePieceVersionForm(dispatch, localStorageValue);
    }
  }, [initialState]);

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
