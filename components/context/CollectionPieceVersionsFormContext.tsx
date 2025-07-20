"use client";
import { createContext, useContext, useEffect, useReducer } from "react";
import { CollectionPieceVersionsFormStep } from "@/types/formTypes";
import { collectionFormSteps as steps } from "@/components/multiStepCollectionPieceVersionsForm/stepsUtils";
import { collectionPieceVersionsFormReducer } from "@/components/context/collectionPieceVersionFormReducer";
import {
  CollectionPieceVersionsFormProviderProps,
  CollectionPieceVersionsFormState,
  Dispatch,
} from "@/types/collectionPieceVersionFormTypes";
import { COLLECTION_PIECE_VERSION_FORM_INITIAL_STATE } from "@/utils/constants";

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

  return (
    <CollectionPieceVersionsFormContext.Provider value={{ state, dispatch }}>
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
  const nextStep = steps[lastCompletedStep ? lastCompletedStep?.rank + 1 : 0];
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

function getLastCompletedStep(
  state: CollectionPieceVersionsFormState,
): CollectionPieceVersionsFormStep | undefined {
  // traversing the steps array, we return the step before the first incomplete one id
  for (let i = 0; i < steps.length; i++) {
    if (!steps[i].isComplete(state)) {
      return steps[i - 1];
    }
  }
  // If none incomplete step found, we return the last step id
  return steps[steps.length - 1];
}
