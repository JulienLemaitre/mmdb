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
import {
  CollectionPieceVersionsFormStep,
  CollectionState,
  MMSourcePieceVersionsState,
  NewPieceVersionState,
  PersonState,
  PieceState,
  TempoIndicationState,
} from "@/types/formTypes";
import upsertEntityInState from "@/utils/upsertEntityInState";
import getCollectionsPieceVersionsFormTestState from "@/utils/getCollectionsPieceVersionsFormTestState";
import { collectionFormSteps as steps } from "@/components/multiStepCollectionPieceVersionsForm/stepsUtils";

const TEST_STATE = getCollectionsPieceVersionsFormTestState();

type CollectionPieceVersionsFormAction =
  | {
      type: "init";
      payload: any;
      // payload: { value: CollectionState; next?: boolean };
    }
  | { type: "goToPrevStep" }
  | { type: "goToStep"; payload: any }
  | {
      type: "collection";
      payload: any;
    }
  | { type: "persons"; payload: any }
  | { type: "pieces"; payload: any }
  | { type: "pieceVersions"; payload: any }
  | { type: "tempoIndications"; payload: any }
  | { type: "mMSourcePieceVersions"; payload: any };
type Dispatch = (action: CollectionPieceVersionsFormAction) => void;
type CollectionPieceVersionsFormInfo = {
  currentStepRank: number;
  isSinglePieceVersionformOpen?: boolean;
  allSourcePieceVersionsDone?: boolean;
};

export type CollectionPieceVersionsFormState = {
  formInfo: CollectionPieceVersionsFormInfo;
  collection?: Partial<CollectionState>;
  mMSourcePieceVersions?: MMSourcePieceVersionsState[];
  persons?: PersonState[];
  pieces?: PieceState[];
  pieceVersions?: NewPieceVersionState[];
  tempoIndications?: TempoIndicationState[];
};
export type PersistableCollectionPieceVersionsFormState =
  Required<CollectionPieceVersionsFormState>;
type CollectionPieceVersionsFormProviderProps = { children: ReactNode };

const INITIAL_STATE: CollectionPieceVersionsFormState = {
  // const INITIAL_STATE: CollectionPieceVersionsFormState = TEST_STATE || {
  formInfo: {
    currentStepRank: 0,
  },
  collection: undefined,
  mMSourcePieceVersions: [],
  persons: [],
  pieces: [],
  pieceVersions: [],
  tempoIndications: [],
};
const LOCAL_STORAGE_KEY = "collectionPieceVersionsForm";
const USE_LOCAL_STORAGE = false;
const allowedActions = new Set();
steps.forEach((step) =>
  step.actionTypes.forEach((actionType) => allowedActions.add(actionType)),
);

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

const arrayEntities = [
  "persons",
  "pieces",
  "pieceVersions",
  "tempoIndications",
  "mMSourcePieceVersions",
];

function collectionPieceVersionsFormReducer(
  state: CollectionPieceVersionsFormState,
  action: CollectionPieceVersionsFormAction,
) {
  console.group(`[collectionPieceVersionsFormReducer]`);
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

  // if (action.type === "collection") {
  //   console.log(`[] UPDATE collection :`, action.payload);
  //   console.groupEnd();
  //   return {
  //     ...state,
  //     collection: action.payload,
  //   };
  // }

  const isActionAllowed = allowedActions.has(action.type);

  // Entries created
  if (isActionAllowed) {
    const { array, deleteIdArray, idKey, next, replace, value } =
      action.payload || {};

    let newState = state;

    // If payload is an entity array and replace = false, we update the state accordingly
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

    // If payload is an entity array and replace = true, we replace the entity in state
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
            [action.type]: newState[action.type]!.filter(
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
      const hasComposerChanged =
        newState.collection?.composerId !== state.collection?.composerId;
      const hasCollectionIdChanged =
        newState.collection?.id !== state.collection?.id;

      if (
        action.type === "collection" &&
        (hasComposerChanged || hasCollectionIdChanged)
      ) {
        for (const entity of arrayEntities) {
          if (newState[entity].length) {
            console.log(
              `[composer or collection Id changed] reset ${entity} -`,
            );
            newState[entity] = [];
          }
        }

        // If composer has changed, we delete collection.id and collection.title if exists
        if (hasComposerChanged && newState.collection?.id) {
          console.log(
            `[composer changed] delete collection.id and collection.title -`,
          );
          delete newState.collection.id;
          delete newState.collection.title;
        }
      }
    }

    // We increment currentStep of we are told to with the property 'next = true' in any payload
    if (next === true && typeof state?.formInfo?.currentStepRank === "number") {
      newState = {
        ...newState,
        formInfo: {
          ...newState.formInfo,
          currentStepRank: state.formInfo.currentStepRank + 1,
        },
      };
    }

    console.groupEnd();
    return newState;
  }

  if (action.type === "init") {
    console.log(`[] INIT state :`, action.payload);
    console.groupEnd();
    return action.payload || INITIAL_STATE;
  }
  console.groupEnd();
  throw new Error(`[CollectionContext] Unhandled action type: ${action.type}`);
}

export function CollectionPieceVersionsFormProvider({
  children,
}: Readonly<CollectionPieceVersionsFormProviderProps>) {
  const [state, dispatch] = useReducer(
    collectionPieceVersionsFormReducer,
    INITIAL_STATE,
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
  initialState = INITIAL_STATE,
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

export function getNewEntities(
  state: CollectionPieceVersionsFormState,
  entityName: string,
) {
  if (Array.isArray(state[entityName])) {
    return state[entityName].filter((entity) => entity.isNew);
  }
  return [];
}
export function getEntityByIdOrKey(
  state: CollectionPieceVersionsFormState,
  entityName: string,
  id: string,
  key = "id",
) {
  if (Array.isArray(state[entityName])) {
    return state[entityName].find((entity) => entity[key] === id);
  }
}
