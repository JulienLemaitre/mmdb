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
  CollectionState,
} from "@/types/formTypes";
import { steps } from "@/components/multiStepMMSourceForm/stepsUtils";
import getFeedFormTestState from "@/utils/getFeedFormTestState";
import upsertEntityInState from "@/utils/upsertEntityInState";

type PieceFormAction =
  | { type: "init"; payload: any }
  | { type: "goToPrevStep" }
  | { type: "goToStep"; payload: any }
  | { type: "formInfo"; payload: any }
  | { type: "organizations"; payload: any }
  | { type: "collections"; payload: any }
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
  collections?: CollectionState[];
  persons?: PersonState[];
  pieces?: PieceState[];
  pieceVersions?: NewPieceVersionState[];
  tempoIndications?: TempoIndicationState[];
  metronomeMarks?: MetronomeMarkState[];
};
export type PersistableFeedFormState = Required<FeedFormState>;
type FeedFormProviderProps = { children: ReactNode };

// @ts-ignore
const TEST_STATE: FeedFormState | null = getFeedFormTestState();

const INITIAL_STATE: FeedFormState = {
  // const INITIAL_STATE: FeedFormState = TEST_STATE || {
  formInfo: {
    currentStepRank: 0,
  },
  mMSourceDescription: undefined,
  mMSourceContributions: [],
  mMSourcePieceVersions: [],
  collections: [],
  metronomeMarks: [],
  organizations: [],
  persons: [],
  pieces: [],
  pieceVersions: [],
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
    const { array, deleteIdArray, idKey, next, replace, value } =
      action.payload || {};

    let newState = state;

    // If payload is an entity array and replace = false, we update the entity in state if exists, or create it otherwise.
    if (array && !replace) {
      // For each entity in the array
      array.forEach((entity) => {
        const id = idKey || "id";

        newState = upsertEntityInState({
          state: newState,
          entityName: action.type,
          entity,
          idKey: id,
        });

        if (entity.person) {
          newState = upsertEntityInState({
            state: newState,
            entityName: "persons",
            entity: entity.person,
          });
        }
        if (entity.organization) {
          newState = upsertEntityInState({
            state: newState,
            entityName: "organizations",
            entity: entity.organization,
          });
        }
      });
    }

    // If payload is an entity array and replace = true, we replace the entity value in state with the given array
    if (array && replace) {
      newState = {
        ...newState,
        [action.type]: array,
      };
      // For each entity in the array
      array.forEach((entity) => {
        if (entity.person) {
          console.log(`[ADD IN CONTEXT] person:`, entity.person);
          newState = upsertEntityInState({
            state: newState,
            entityName: "persons",
            entity: entity.person,
          });
        }
        if (entity.organization) {
          console.log(`[ADD IN CONTEXT] organization:`, entity.organization);
          newState = upsertEntityInState({
            state: newState,
            entityName: "organizations",
            entity: entity.organization,
          });
        }
      });
    }

    // If payload is a deleteIdArray, we update the state accordingly
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

    localStorageSetItem(LOCAL_STORAGE_KEY, newState);
    console.groupEnd();
    return newState;
  } else {
    console.log(`[] Action not allowed: action.type`, action.type);
  }
  if (action.type === "init") {
    localStorageSetItem(LOCAL_STORAGE_KEY, action.payload || INITIAL_STATE);
    console.groupEnd();
    return action.payload || INITIAL_STATE;
  }
  console.groupEnd();
  throw new Error(
    `[FeedFormContext] Unhandled${!isActionAllowed ? ` (Not allowed)` : ""} action type: ${action.type}`,
  );
}

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

export function getNewEntities(state: FeedFormState, entityName: string) {
  if (!state) {
    console.error(`[getNewEntities] NO state provided to find ${entityName}`);
    return [];
  }
  if (Array.isArray(state[entityName])) {
    return state[entityName].filter((entity) => entity.isNew);
  }
  return [];
}
export function getEntityByIdOrKey(
  state: FeedFormState,
  entityName: string,
  id: string,
  key = "id",
) {
  if (Array.isArray(state?.[entityName])) {
    return state[entityName].find((entity) => entity[key] === id);
  }
}
