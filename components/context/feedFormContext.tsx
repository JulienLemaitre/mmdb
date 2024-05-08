"use client";
import {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useEffect,
} from "react";
import {
  PersonState,
  FeedFormStep,
  MetronomeMarkState,
  MMSourceContributionsState,
  PieceState,
  NewPieceVersionState,
  MMSourceDescriptionState,
  MMSourcePieceVersionsState,
  TempoIndicationState,
  OrganizationState,
} from "@/types/formTypes";
import { steps } from "@/components/multiStepMMSourceForm/stepsUtils";
import getFeedFormTestState from "@/utils/getFeedFormTestState";

type PieceFormAction =
  | { type: "init"; payload: any }
  | { type: "goToPrevStep" }
  | { type: "goToStep"; payload: any }
  | { type: "formInfo"; payload: any }
  | { type: "organizations"; payload: any }
  | { type: "persons"; payload: any }
  | { type: "pieces"; payload: any }
  | { type: "pieceVersions"; payload: any }
  | { type: "tempoIndications"; payload: any }
  | { type: "mMSourceDescription"; payload: any }
  | { type: "mMSourceContributions"; payload: any }
  | { type: "mMSourcePieceVersions"; payload: any }
  | { type: "editedSourceOnPieceVersions"; payload: any }
  | { type: "metronomeMarks"; payload: any };
type Dispatch = (action: PieceFormAction) => void;
type FeedFormInfo = {
  currentStepRank: number;
  introDone?: boolean;
  isSourceOnPieceVersionformOpen?: boolean;
  allSourcePieceVersionsDone?: boolean;
  allSourceContributionsDone?: boolean;
};
export type FeedFormState = {
  formInfo?: FeedFormInfo;
  mMSourceDescription?: MMSourceDescriptionState;
  mMSourceContributions?: MMSourceContributionsState;
  mMSourcePieceVersions?: MMSourcePieceVersionsState[];
  organizations?: OrganizationState[];
  persons?: PersonState[];
  pieces?: PieceState[];
  pieceVersions?: NewPieceVersionState[];
  tempoIndications?: TempoIndicationState[];
  metronomeMarks?: MetronomeMarkState[];
};
export type PersistableFeedFormState = Required<FeedFormState>;
type FeedFormProviderProps = { children: ReactNode };

const TEST_STATE: FeedFormState | null = getFeedFormTestState();
// const INITIAL_STATE: FeedFormState = {
const INITIAL_STATE: FeedFormState = TEST_STATE || {
  formInfo: {
    currentStepRank: 0,
  },
  mMSourceDescription: undefined,
  mMSourceContributions: [],
  mMSourcePieceVersions: [],
  organizations: [],
  persons: [],
  pieces: [],
  pieceVersions: [],
  metronomeMarks: [],
  tempoIndications: [],
};
const LOCAL_STORAGE_KEY = "feedForm";
const USE_LOCAL_STORAGE = false;
const allowedActions = new Set();
steps.forEach((step) =>
  step.actionTypes.forEach((actionType) => allowedActions.add(actionType)),
);

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
  console.group(`[feedFormReducer]`);
  console.log(`[] action.type :`, action.type);

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

  console.log(`[] action.payload :`, action.payload);

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

  const isActionAllowed = allowedActions.has(action.type);

  // Entries created
  if (isActionAllowed) {
    const { next, value, array, deleteIdArray, idKey } = action.payload || {};

    let newState = state;

    // If payload is an entity array, we update the state accordingly
    if (array) {
      // For each entity in the array
      array.forEach((entity) => {
        const id = idKey || "id";
        // If we find an entity in state with the same id, we update it
        const isEntityInState = newState[action.type]?.find(
          (stateEntity) => entity[id] && stateEntity[id] === entity[id],
        );
        if (isEntityInState) {
          console.log(
            `[] UPDATE entity in array with idKey [${id}] new value :`,
            entity,
          );
          newState = {
            ...newState,
            [action.type]: newState[action.type].map((stateEntity) =>
              stateEntity[id] === entity[id] ? entity : stateEntity,
            ),
          };
        } else {
          // otherwise, we push the entity to the array
          console.log(`[] ADD new entity in array :`, entity);
          newState = {
            ...newState,
            [action.type]: [...newState[action.type], entity],
          };
        }
      });
    }
    // If payload is an entity array, we update the state accordingly
    if (deleteIdArray) {
      // For each entity in the array
      deleteIdArray.forEach((idToDelete) => {
        const id = idKey || "id";
        // If we find an entity in state with the same id, we remove it
        const isEntityInState = newState[action.type]?.find(
          (stateEntity) => idToDelete && stateEntity[id] === idToDelete,
        );
        if (isEntityInState) {
          console.log(`[] REMOVE entity in array with id :`, idToDelete);
          newState = {
            ...newState,
            [action.type]: newState[action.type].filter(
              (stateEntity) => stateEntity[id] !== idToDelete,
            ),
          };
        } else {
          // otherwise, we warn entity was not found
          console.log(`[] NOT FOUND - entity to REMOVE with id :`, idToDelete);
        }
      });
    }

    // otherwise, the payload is an object, we update the state object accordingly
    if (value) {
      newState = {
        ...state,
        [action.type]: { ...(state[action.type] || {}), ...value },
      };
    }

    // We increment currentStep of we are told to with the property 'next' in any payload
    if (next === true && typeof state?.formInfo?.currentStepRank === "number") {
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
  console.groupEnd();
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

export function updateFeedForm(dispatch, type, value) {
  dispatch({ type, payload: value });
}

export function initFeedForm(dispatch, initialState = INITIAL_STATE) {
  dispatch({ type: "init", payload: initialState });
}

function getLastCompletedStep(state: FeedFormState): FeedFormStep | undefined {
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
