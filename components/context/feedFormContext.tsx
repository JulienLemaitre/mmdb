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
  | { type: "composer"; payload: any }
  | { type: "piece"; payload: any }
  | { type: "pieceVersion"; payload: any }
  | { type: "sourceDescription"; payload: any }
  | { type: "sourceContributions"; payload: any }
  | { type: "metronomeMarks"; payload: any };
type Dispatch = (action: PieceFormAction) => void;
type FeedFormInfos = {
  introDone?: boolean;
  allSourcePieceVersionsDone?: boolean;
  allMetronomeMarksDone?: boolean;
};
export type FeedFormState = {
  formInfos?: FeedFormInfos;
  mMSsourceDescription?: MMSourceDescriptionState;
  mMSourceContributions?: ContributionState[];
  mMSourcePieceVersions?: MMSourcePieceVersionsState[];
  // composer?: ComposerState;
  // piece?: PieceState;
  // pieceVersion?: PieceVersionState;
  metronomeMarks?: MetronomeMarkState[];
};
type FeedFormProviderProps = { children: ReactNode };

const LOCAL_STORAGE_KEY = "feedForm";
const USE_LOCAL_STORAGE = false;
// export const STATE_ENTITIES: FeedStateEntity[] = steps;
export const STATE_ENTITIES_NAMES = steps.map((step) => step.id);

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
  // Entries created
  if (STATE_ENTITIES_NAMES.includes(action.type)) {
    const newState = { ...state, [action.type]: action.payload };

    // Reset all entities after the current one
    if (action.payload.id !== state[action.type]?.id) {
      for (const entity of STATE_ENTITIES_NAMES) {
        if (entity === action.type) continue;
        if (
          STATE_ENTITIES_NAMES.indexOf(entity) >
            STATE_ENTITIES_NAMES.indexOf(action.type) &&
          newState[entity]
        ) {
          console.log(`[feedFormReducer] Resetting ${entity}`);
          newState[entity] = undefined;
        }
      }
    }

    localStorageSetItem("feedForm", newState);
    return newState;
  }
  if (action.type === "init") {
    localStorageSetItem("feedForm", action.payload || {});
    return action.payload || {};
  }
  throw new Error(`Unhandled action type: ${action.type}`);
}

// eslint-disable-next-line react/prop-types
export function FeedFormProvider({
  children,
}: Readonly<FeedFormProviderProps>) {
  const [state, dispatch] = useReducer(feedFormReducer, {});

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
  return { ...context, lastCompletedStep, nextStep };
}

export function updateFeedForm(dispatch, type, value) {
  dispatch({ type, payload: value });
}

export function initFeedForm(dispatch, initialState = {}) {
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
