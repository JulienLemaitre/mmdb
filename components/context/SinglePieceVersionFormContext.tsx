"use client";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useReducer,
} from "react";
import {
  getAllowedActions,
  singlePieceFormSteps,
} from "@/components/multiStepSinglePieceVersionForm/stepsUtils";
import { SinglePieceVersionFormStep } from "@/types/formTypes";

type SinglePieceVersionFormInfo = {
  currentStepRank: number;
  allSourcePieceVersionsDone?: boolean;
  mMSourcePieceVersionRank?: number;
};

export type SinglePieceVersionFormState = {
  formInfo: SinglePieceVersionFormInfo;
  composer?: { id?: string; isNew?: boolean };
  piece?: { id?: string; isNew?: boolean };
  pieceVersion?: { id?: string; isNew?: boolean };
};

type SinglePieceVersionFormAction =
  | {
      type: "init";
      payload?: {
        value: SinglePieceVersionFormState;
        next?: boolean;
      };
    }
  | { type: "goToPrevStep" }
  | { type: "goToStep"; payload: { stepRank: number } }
  | {
      type: "composer";
      payload: { value: { id: string; isNew?: boolean }; next?: boolean };
    }
  | {
      type: "piece";
      payload: { value: { id: string; isNew?: boolean }; next?: boolean };
    }
  | {
      type: "pieceVersion";
      payload: { value: { id: string; isNew?: boolean }; next?: boolean };
    };

type Dispatch = (action: SinglePieceVersionFormAction) => void;

type SinglePieceVersionFormProviderProps = {
  children: ReactNode;
  initialState?: SinglePieceVersionFormState | null;
};

const INITIAL_STATE: SinglePieceVersionFormState = {
  formInfo: {
    currentStepRank: 0,
  },
};

const LOCAL_STORAGE_KEY = "sourceOnPieceVersionForm";
const USE_LOCAL_STORAGE = false;

const SinglePieceVersionFormContext = createContext<
  | {
      state: SinglePieceVersionFormState;
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

function SinglePieceVersionFormReducer(
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
  console.log(`allowedActions :`, allowedActions);
  console.log(`isActionAllowed :`, isActionAllowed);

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

    localStorageSetItem(LOCAL_STORAGE_KEY, newState);
    console.groupEnd();
    return newState;
  }
  if (action.type === "init") {
    localStorageSetItem(LOCAL_STORAGE_KEY, action.payload || INITIAL_STATE);
    console.groupEnd();
    return action.payload || INITIAL_STATE;
  }
  throw new Error(`Unhandled action type: ${action.type}`);
}

export function SinglePieceVersionFormProvider({
  children,
  initialState,
}: Readonly<SinglePieceVersionFormProviderProps>) {
  const [state, dispatch] = useReducer(
    SinglePieceVersionFormReducer,
    initialState || INITIAL_STATE,
  );

  useEffect(() => {
    try {
      const localStorageValue = localStorageGetItem(LOCAL_STORAGE_KEY);
      if (localStorageValue) {
        console.log(
          `[INIT] SinglePieceVersions from localStorage`,
          localStorageValue,
        );
        initSinglePieceVersionForm(dispatch, JSON.parse(localStorageValue));
      }
    } catch (error) {
      console.warn(
        `Error reading localStorage key “${LOCAL_STORAGE_KEY}”:`,
        error,
      );
    }
  }, []);

  const value = { state, dispatch };
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
  // console.log(`[useFeedForm] lastCompletedStep :`, lastCompletedStep);
  const nextStep =
    singlePieceFormSteps[lastCompletedStep ? lastCompletedStep?.rank + 1 : 0];
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
  initialState = INITIAL_STATE,
) {
  dispatch({ type: "init", payload: initialState });
}

function getLastCompletedStep(
  state: SinglePieceVersionFormState,
): SinglePieceVersionFormStep | undefined {
  // traversing the steps array, we return the step before the first incomplete one
  // console.group(`SOPEVF getLastCompletedStep`);
  for (let i = 0; i < singlePieceFormSteps.length; i++) {
    // console.log(`steps[${i}] isComplete :`, steps[i].isComplete(state));
    if (!singlePieceFormSteps[i].isComplete(state)) {
      // console.groupEnd();
      return singlePieceFormSteps[i - 1];
    }
  }
  // console.groupEnd();
  // If none incomplete step found, we return the last step
  return singlePieceFormSteps[singlePieceFormSteps.length - 1];
}
