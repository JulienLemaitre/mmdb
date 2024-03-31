"use client";
import {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useEffect,
} from "react";
import {
  // ComposerState,
  ContributionState,
  FeedStateEntity,
  MetronomeMarkState,
  // PieceState,
  // PieceVersionState,
  MMSourceDescriptionState,
  MMSourcePieceVersionsState,
} from "@/types/editFormTypes";
import { steps } from "@/components/multiStepForm/constants";

type PieceFormAction =
  | { type: "init"; payload: any }
  | { type: "goToPrevStep" }
  | { type: "formInfos"; payload: any }
  // | { type: "composer"; payload: any }
  // | { type: "piece"; payload: any }
  // | { type: "pieceVersion"; payload: any }
  | { type: "mMSourceDescription"; payload: any }
  | { type: "mMSourceContributions"; payload: any }
  | { type: "mMSourcePieceVersions"; payload: any }
  | { type: "metronomeMarks"; payload: any };
type Dispatch = (action: PieceFormAction) => void;
type FeedFormInfos = {
  currentStepRank: number;
  introDone?: boolean;
  allSourcePieceVersionsDone?: boolean;
  allMetronomeMarksDone?: boolean;
  allSourceContributionsDone?: boolean;
};
export type FeedFormState = {
  formInfos?: FeedFormInfos;
  mMSourceDescription?: MMSourceDescriptionState;
  mMSourceContributions?: ContributionState[];
  mMSourcePieceVersions?: MMSourcePieceVersionsState[];
  // composer?: ComposerState;
  // piece?: PieceState;
  // pieceVersion?: PieceVersionState;
  metronomeMarks?: MetronomeMarkState[];
};
type FeedFormProviderProps = { children: ReactNode };

const INITIAL_STATE: FeedFormState = {
  formInfos: {
    currentStepRank: 0,
  },
};
const LOCAL_STORAGE_KEY = "feedForm";
const USE_LOCAL_STORAGE = false;
const allowedActions = new Set();
steps.forEach((step) =>
  step.actionTypes.forEach((actionType) => allowedActions.add(actionType)),
);
allowedActions.forEach(function (value) {
  console.log(`[feedFormContext] allowedActions :`, value);
});

const FeedFormContext = createContext<
  | {
      state: FeedFormState;
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

function feedFormReducer(state: FeedFormState, action: PieceFormAction) {
  // Navigation back
  if (action.type === "goToPrevStep") {
    const currentStepRank = state?.formInfos?.currentStepRank || 1;
    return {
      ...state,
      formInfos: {
        ...state.formInfos,
        currentStepRank: currentStepRank - 1,
      },
    };
  }

  // Entries created
  if (allowedActions.has(action.type)) {
    const { next, ...payload } = action.payload || {};
    let newState = { ...state, [action.type]: payload };

    // We increment currentStep of we are told to with the property 'next' in any payload
    if (
      next === true &&
      typeof state?.formInfos?.currentStepRank === "number"
    ) {
      newState = {
        ...newState,
        formInfos: {
          ...newState.formInfos,
          currentStepRank: state.formInfos.currentStepRank + 1,
        },
      };
    }

    // Reset all entities after the current one if a new id is detected for current entity
    // TODO this has to be refined because some steps ar arrays of entity objects
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

    localStorageSetItem("feedForm", newState);
    return newState;
  }
  if (action.type === "init") {
    localStorageSetItem("feedForm", action.payload || INITIAL_STATE);
    return action.payload || INITIAL_STATE;
  }
  throw new Error(`Unhandled action type: ${action.type}`);
}

// eslint-disable-next-line react/prop-types
export function FeedFormProvider({
  children,
}: Readonly<FeedFormProviderProps>) {
  const [state, dispatch] = useReducer(feedFormReducer, INITIAL_STATE);

  useEffect(() => {
    try {
      const localStorageValue = localStorageGetItem(LOCAL_STORAGE_KEY);
      if (localStorageValue) {
        console.log(`[INIT] feedForm from localStorage`, localStorageValue);
        initFeedForm(dispatch, JSON.parse(localStorageValue));
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
    <FeedFormContext.Provider value={value}>
      {children}
    </FeedFormContext.Provider>
  );
}

export function useFeedForm() {
  const context = useContext(FeedFormContext);
  if (context === undefined) {
    throw new Error("useFeedForm must be used within a FeedFormProvider");
  }
  const lastCompletedStep = getLastCompletedStepId(context.state);
  const nextStep = steps[lastCompletedStep ? lastCompletedStep?.rank + 1 : 0];
  return {
    ...context,
    lastCompletedStepId: lastCompletedStep?.id,
    nextStepToCompleteId: nextStep.id,
    currentStepRank: context.state.formInfos?.currentStepRank || 0,
  };
}

export function updateFeedForm(dispatch, type, value) {
  dispatch({ type, payload: value });
}

export function initFeedForm(dispatch, initialState = INITIAL_STATE) {
  dispatch({ type: "init", payload: initialState });
}

function getLastCompletedStepId(
  state: FeedFormState,
): FeedStateEntity | undefined {
  // traversing the steps array, we return the step before the first incomplete one id
  for (let i = 0; i < steps.length; i++) {
    if (!steps[i].isComplete(state)) return steps[i - 1];
  }
  // If none incomplete step found, we return the last step id
  return steps[steps.length - 1];
}
