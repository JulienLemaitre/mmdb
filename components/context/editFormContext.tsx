"use client";
import {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useEffect,
} from "react";
import {
  ComposerState,
  ContributionState,
  MetronomeMarkState,
  PieceState,
  PieceVersionState,
  SourceDescriptionState,
  StateEntity,
} from "@/types/editFormTypes";

type PieceFormAction =
  | { type: "init"; payload: any }
  | { type: "composer"; payload: any }
  | { type: "piece"; payload: any }
  | { type: "pieceVersion"; payload: any }
  | { type: "sourceDescription"; payload: any }
  | { type: "sourceContributions"; payload: any }
  | { type: "metronomeMarks"; payload: any };
type Dispatch = (action: PieceFormAction) => void;
type EditFormState = {
  composer?: ComposerState;
  piece?: PieceState;
  pieceVersion?: PieceVersionState;
  sourceDescription?: SourceDescriptionState;
  sourceContributions?: ContributionState[];
  metronomeMarks?: MetronomeMarkState[];
};
type EditFormProviderProps = { children: ReactNode };

const LOCAL_STORAGE_KEY = "editForm";
const USE_LOCAL_STORAGE = false;
export const STATE_ENTITIES_NAMES = [
  "composer",
  "piece",
  "pieceVersion",
  "sourceDescription",
  "sourceContributions",
  "metronomeMarks",
];

export const STATE_ENTITIES: StateEntity[] = STATE_ENTITIES_NAMES.map(
  (entity, index) => ({
    rank: index + 1,
    name: entity,
    displayName: entity.replace(/([A-Z])/g, " $1").toLowerCase(),
    segment: entity.replace(/([A-Z])/g, "_$1").toLowerCase(),
    path:
      `/edition/` +
      entity.replace(/([A-Z])/g, "-$1").toLowerCase() +
      (index >= 3 ? "create/" : ""),
  }),
);

const EditFormContext = createContext<
  | {
      state: EditFormState;
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

function editFormReducer(state: EditFormState, action: PieceFormAction) {
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
          console.log(`[editFormReducer] Resetting ${entity}`);
          newState[entity] = undefined;
        }
      }
    }

    localStorageSetItem("editForm", newState);
    return newState;
  }
  if (action.type === "init") {
    localStorageSetItem("editForm", action.payload || {});
    return action.payload || {};
  }
  throw new Error(`Unhandled action type: ${action.type}`);
}

// eslint-disable-next-line react/prop-types
export function EditFormProvider({
  children,
}: Readonly<EditFormProviderProps>) {
  const [state, dispatch] = useReducer(editFormReducer, {});

  useEffect(() => {
    try {
      const localStorageValue = localStorageGetItem(LOCAL_STORAGE_KEY);
      if (localStorageValue) {
        console.log(`[INIT] editForm from localStorage`, localStorageValue);
        initEditForm(dispatch, JSON.parse(localStorageValue));
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
    <EditFormContext.Provider value={value}>
      {children}
    </EditFormContext.Provider>
  );
}

export function useEditForm() {
  const context = useContext(EditFormContext);
  if (context === undefined) {
    throw new Error("useEditForm must be used within a EditFormProvider");
  }
  let lastCompletedStateEntity;
  let nextStep = STATE_ENTITIES[0];
  // Determine present step index by finding the last entity from STATE_ENTITIES with an existing id in state
  const lastCompletedStateEntityName = [...STATE_ENTITIES_NAMES]
    .reverse()
    .find((entity) => context.state[entity]?.id);
  if (lastCompletedStateEntityName) {
    lastCompletedStateEntity = STATE_ENTITIES.find(
      (entity) => entity.name === lastCompletedStateEntityName,
    );
    nextStep = STATE_ENTITIES[lastCompletedStateEntity.rank];
  }
  return { ...context, lastCompletedStateEntity, nextStep };
}

export function updateEditForm(dispatch, type, value) {
  dispatch({ type, payload: value });
}

export function initEditForm(dispatch, initialState = {}) {
  dispatch({ type: "init", payload: initialState });
}
