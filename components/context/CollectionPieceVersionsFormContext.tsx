"use client";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useReducer,
} from "react";
// import {
//   getAllowedActions,
//   steps,
// } from "@/components/multiStepCollectionPieceVersionsForm/stepsUtils";
import { CollectionPieceVersionsFormStep } from "@/types/formTypes";
import getCollectionsPieceVersionsFormTestState from "@/utils/getCollectionsPieceVersionsFormTestState";
import { collectionFormSteps as steps } from "@/components/multiStepCollectionPieceVersionsForm/stepsUtils";
import { collectionPieceVersionsFormReducer } from "@/components/context/collectionPieceVersionFormReducer";
import {
  CollectionPieceVersionsFormProviderProps,
  CollectionPieceVersionsFormState,
  Dispatch,
} from "@/types/collectionPieceVersionFormTypes";
import { COLLECTION_PIECE_VERSION_FORM_INITIAL_STATE } from "@/utils/constants";

const TEST_STATE = getCollectionsPieceVersionsFormTestState();

const LOCAL_STORAGE_KEY = "collectionPieceVersionsForm";
const USE_LOCAL_STORAGE = false;

const CollectionPieceVersionsFormContext = createContext<
  | {
      state: CollectionPieceVersionsFormState;
      dispatch: Dispatch;
    }
  | undefined
>(undefined);

function localStorageSetItem(key: string, value: any) {
  if (typeof window !== "undefined" && USE_LOCAL_STORAGE) {
    // Perform localStorage action
    return localStorage.setItem(key, JSON.stringify(value));
  }
}
function localStorageGetItem(key: string) {
  if (typeof window !== "undefined" && USE_LOCAL_STORAGE) {
    // Perform localStorage action
    return localStorage.getItem(key);
  }
}

export function CollectionPieceVersionsFormProvider({
  children,
}: Readonly<CollectionPieceVersionsFormProviderProps>) {
  const [state, dispatch] = useReducer(
    collectionPieceVersionsFormReducer,
    COLLECTION_PIECE_VERSION_FORM_INITIAL_STATE,
  );

  useEffect(() => {
    try {
      const localStorageValue = localStorageGetItem(LOCAL_STORAGE_KEY);
      if (localStorageValue) {
        console.log(
          `[INIT] collectionPieceVersionsForm from localStorage`,
          localStorageValue,
        );
        initCollectionPieceVersionsForm(
          dispatch,
          JSON.parse(localStorageValue),
        );
      }
    } catch (error) {
      console.warn(
        `Error reading localStorage key “${LOCAL_STORAGE_KEY}”:`,
        error,
      );
    }
  }, []);

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
  // console.group(`getLastCompletedStep`);
  for (let i = 0; i < steps.length; i++) {
    // console.log(`steps[${i}] isComplete :`, steps[i].isComplete(state));
    if (!steps[i].isComplete(state)) {
      // console.groupEnd();
      return steps[i - 1];
    }
  }
  // console.groupEnd();
  // If none incomplete step found, we return the last step id
  return steps[steps.length - 1];
}

// export function getNewEntities(
//   state: CollectionPieceVersionsFormState,
//   entityName: string,
// ) {
//   if (Array.isArray(state[entityName])) {
//     return state[entityName].filter((entity) => entity.isNew);
//   }
//   return [];
// }
// export function getEntityByIdOrKey(
//   state: CollectionPieceVersionsFormState,
//   entityName: string,
//   id: string,
//   key = "id",
// ) {
//   if (Array.isArray(state[entityName])) {
//     return state[entityName].find((entity) => entity[key] === id);
//   }
// }
