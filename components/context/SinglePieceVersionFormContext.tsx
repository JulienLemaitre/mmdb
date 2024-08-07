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
  steps,
} from "@/components/multiStepSinglePieceVersionForm/stepsUtils";
import { SinglePieceVersionFormStep } from "@/types/formTypes";

export type SinglePieceVersionFormType = "single" | "collection";
type SinglePieceVersionFormInfo = {
  formType: SinglePieceVersionFormType;
  currentStepRank: number;
  allSourcePieceVersionsDone?: boolean;
};

export type SinglePieceVersionFormState = {
  formInfo: SinglePieceVersionFormInfo;
  composer?: { id?: string };
  piece?: { id?: string };
  pieceVersion?: { id?: string };
};

type SinglePieceVersionFormAction =
  | {
      type: "init";
      payload?: { value: SinglePieceVersionFormState; next?: boolean };
    }
  | { type: "goToPrevStep" }
  | { type: "goToStep"; payload: { stepRank: number } }
  | {
      type: "composer";
      payload: { value: { id: string }; next?: boolean };
    }
  | {
      type: "piece";
      payload: { value: { id: string }; next?: boolean };
    }
  | {
      type: "pieceVersion";
      payload: { value: { id: string }; next?: boolean };
    }
  | {
      type: "formInfo";
      payload: {
        value: { formType: SinglePieceVersionFormType };
        next?: boolean;
      };
    };

type Dispatch = (action: SinglePieceVersionFormAction) => void;

type SinglePieceVersionFormProviderProps = { children: ReactNode };

const INITIAL_STATE: SinglePieceVersionFormState = {
  formInfo: {
    currentStepRank: 0,
    formType: "single",
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

  const allowedActions = getAllowedActions(state);
  const isActionAllowed = allowedActions.has(action.type);
  console.log(`allowedActions :`, allowedActions);
  console.log(`isActionAllowed :`, isActionAllowed);

  // Entries created
  if (isActionAllowed) {
    const {
      next,
      value,
      // array,
    } = action.payload || {};

    let newState = state;

    // If payload is an entity array, we update the state accordingly
    // if (array) {
    //   // For each entity in the array
    //   array.forEach((entity) => {
    //     // If we find an entity in state with the same id, we update it
    //     const isEntityInState = newState[action.type]?.find(
    //       (stateEntity) => entity.id && stateEntity.id === entity.id,
    //     );
    //     console.log(`[] isEntityInState :`, isEntityInState);
    //     if (isEntityInState) {
    //       console.log(`[] UPDATE entity in array with new value :`, entity);
    //       newState = {
    //         ...newState,
    //         [action.type]: newState[action.type].map((stateEntity) =>
    //           stateEntity.id === entity.id ? entity : stateEntity,
    //         ),
    //       };
    //     } else {
    //       // otherwise, we push the entity to the array
    //       console.log(`[] ADD new entity in array :`, entity);
    //       newState = {
    //         ...newState,
    //         [action.type]: [...newState[action.type], entity],
    //       };
    //     }
    //   });
    // }

    // otherwise, the payload is an object, we update the state object accordingly
    if (value) {
      newState = {
        ...state,
        [action.type]: { ...(state[action.type] || {}), ...value },
      };
    }

    // We increment currentStep of we are told to with the property 'next' in any payload
    if (next === true && typeof state?.formInfo?.currentStepRank === "number") {
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

    // Reset all entities after the current one if a new id is detected for current entity
    // TODO this has to be refined because some steps are arrays of entity objects
    // if (action.payload.id !== state[action.type]?.id) {
    //   for (const entity of FEED_FORM_STATE_STEPS) {
    //     if (entity === action.type) continue;
    //     if (
    //       FEED_FORM_STATE_STEPS.indexOf(entity) >
    //         FEED_FORM_STATE_STEPS.indexOf(action.type) &&
    //       newState[entity]
    //     ) {
    //       console.log(`[feedFormReducer] Resetting ${entity}`);
    //       newState[entity] = undefined;
    //     }
    //   }
    // }

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
}: Readonly<SinglePieceVersionFormProviderProps>) {
  const [state, dispatch] = useReducer(
    SinglePieceVersionFormReducer,
    INITIAL_STATE,
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
  const nextStep = steps[lastCompletedStep ? lastCompletedStep?.rank + 1 : 0];
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
  const formSteps = steps[state.formInfo.formType];
  // traversing the steps array, we return the step before the first incomplete one id
  // console.group(`SOPEVF getLastCompletedStep`);
  for (let i = 0; i < formSteps.length; i++) {
    // console.log(`steps[${i}] isComplete :`, steps[i].isComplete(state));
    if (!formSteps[i].isComplete(state)) {
      // console.groupEnd();
      return formSteps[i - 1];
    }
  }
  // console.groupEnd();
  // If none incomplete step found, we return the last step id
  return formSteps[formSteps.length - 1];
}
