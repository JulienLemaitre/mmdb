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
} from "@/types/formTypes";
import { steps } from "@/components/multiStepMMSourceForm/stepsUtils";

type PieceFormAction =
  | { type: "init"; payload: any }
  | { type: "goToPrevStep" }
  | { type: "goToStep"; payload: any }
  | { type: "formInfo"; payload: any }
  | { type: "persons"; payload: any }
  // | { type: "composer"; payload: any }
  | { type: "pieces"; payload: any }
  | { type: "pieceVersions"; payload: any }
  | { type: "mMSourceDescription"; payload: any }
  | { type: "mMSourceContributions"; payload: any }
  | { type: "mMSourcePieceVersions"; payload: any }
  | { type: "editedSourceOnPieceVersions"; payload: any }
  | { type: "metronomeMarks"; payload: any };
type Dispatch = (action: PieceFormAction) => void;
type FeedFormInfo = {
  currentStepRank: number;
  introDone?: boolean;
  allSourcePieceVersionsDone?: boolean;
  allMetronomeMarksDone?: boolean;
  allSourceContributionsDone?: boolean;
};
// export type EditedSourceOnPieceVersionsState = {
//   composerId?: string;
//   isCollection?: boolean;
// };
export type FeedFormState = {
  formInfo?: FeedFormInfo;
  mMSourceDescription?: MMSourceDescriptionState;
  mMSourceContributions?: MMSourceContributionsState;
  mMSourcePieceVersions?: MMSourcePieceVersionsState[];
  // editedSourceOnPieceVersions?: EditedSourceOnPieceVersionsState;
  persons?: PersonState[];
  pieces?: PieceState[];
  pieceVersions?: NewPieceVersionState[];
  metronomeMarks?: MetronomeMarkState[];
};
type FeedFormProviderProps = { children: ReactNode };

const TEST_STATE: FeedFormState = {
  formInfo: {
    currentStepRank: 3,
    introDone: true,
  },
  mMSourceDescription: {
    id: undefined,
    title: "Et adipisicing omnis",
    year: 1971,
    type: "EDITION",
    link: "https://www.selozemoragog.com",
    comment: "Esse aliquid ut ver",
    references: [],
    isNew: true,
  },
  mMSourceContributions: [
    {
      organization: {
        id: "9dea18ed-9ef3-4f4a-bcc0-52cab29db74e",
        name: "Breitkopf and Hartel",
      },
      role: "PUBLISHER",
    },
    {
      person: {
        id: "4aa7131f-371d-4ae7-a61e-594b9f1e2ec7",
        firstName: "Antonín",
        lastName: "Dvořák",
        birthYear: 1841,
        deathYear: 1904,
      },
      role: "MM_PROVIDER",
    },
  ],
  mMSourcePieceVersions: [],
  persons: [],
  pieces: [],
  pieceVersions: [],
  metronomeMarks: [],
};
// const INITIAL_STATE: FeedFormState = {
const INITIAL_STATE: FeedFormState = TEST_STATE || {
  formInfo: {
    currentStepRank: 0,
  },
  mMSourceDescription: undefined,
  mMSourceContributions: [],
  mMSourcePieceVersions: [],
  persons: [],
  pieces: [],
  pieceVersions: [],
  metronomeMarks: [],
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
  console.log(`[feedFormReducer] action.type :`, action.type);

  // Navigation back
  if (action.type === "goToPrevStep") {
    const currentStepRank = state?.formInfo?.currentStepRank || 1;
    return {
      ...state,
      formInfo: {
        ...state.formInfo,
        currentStepRank: currentStepRank - 1,
      },
    };
  }

  console.log(`[feedFormReducer] action.payload :`, action.payload);

  // Navigation to specific step
  if (action.type === "goToStep") {
    const { stepRank } = action.payload;
    return {
      ...state,
      formInfo: {
        ...state.formInfo,
        currentStepRank: stepRank,
      },
    };
  }

  const isActionAllowed = allowedActions.has(action.type);
  console.log(`[feedFormReducer] allowedActions :`, allowedActions);
  console.log(`[feedFormReducer] isActionAllowed :`, isActionAllowed);

  // Entries created
  if (isActionAllowed) {
    const { next, value, array } = action.payload || {};

    let newState = state;

    // If payload is an entity array, we update the state accordingly
    if (array) {
      // For each entity in the array
      array.forEach((entity) => {
        // If we find an entity in state with the same id, we update it
        const isEntityInState = newState[action.type]?.find(
          (stateEntity) => entity.id && stateEntity.id === entity.id,
        );
        console.log(`[] isEntityInState :`, isEntityInState);
        if (isEntityInState) {
          console.log(`[] UPDATE entity in array with new value :`, entity);
          newState = {
            ...newState,
            [action.type]: newState[action.type].map((stateEntity) =>
              stateEntity.id === entity.id ? entity : stateEntity,
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
    return newState;
  }
  if (action.type === "init") {
    localStorageSetItem(LOCAL_STORAGE_KEY, action.payload || INITIAL_STATE);
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
  const lastCompletedStep = getLastCompletedStep(context.state);
  // console.log(`[useFeedForm] lastCompletedStep :`, lastCompletedStep);
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
