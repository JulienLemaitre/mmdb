"use client";
import {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useEffect,
} from "react";
import { Movement } from "@prisma/client";
import {
  ComposerState,
  PieceState,
  PieceVersionState,
  SourceDescriptionState,
} from "@/types/editFormTypes";

type PieceFormAction =
  | { type: "init"; payload: any }
  | { type: "composerId"; payload: string }
  | { type: "pieceId"; payload: string }
  | { type: "pieceVersionId"; payload: string }
  | { type: "sourceDescription"; payload: string };
type Dispatch = (action: PieceFormAction) => void;
type EditFormState = {
  composer?: ComposerState;
  piece?: PieceState;
  pieceVersion?: PieceVersionState;
  sourceDescription?: SourceDescriptionState;
};
type EditFormProviderProps = { children: ReactNode };

const LOCAL_STORAGE_KEY = "editForm";

const EditFormContext = createContext<
  | {
      state: EditFormState;
      dispatch: Dispatch;
    }
  | undefined
>(undefined);

function localStorageSetItem(key: string, value: any) {
  if (typeof window !== "undefined") {
    // Perform localStorage action
    return localStorage.setItem(key, JSON.stringify(value));
  }
}
function localStorageGetItem(key: string) {
  if (typeof window !== "undefined") {
    // Perform localStorage action
    return localStorage.getItem(key);
  }
}

function editFormReducer(state: EditFormState, action: PieceFormAction) {
  if (
    ["composer", "piece", "pieceVersion", "sourceDescription"].includes(
      action.type,
    )
  ) {
    const newState = { ...state, [action.type]: action.payload };
    localStorageSetItem("editForm", newState);
    return { ...state, [action.type]: action.payload };
  }
  if (action.type === "init") {
    localStorageSetItem("editForm", action.payload || {});
    return action.payload || {};
  }
  throw new Error(`Unhandled action type: ${action.type}`);
}

// eslint-disable-next-line react/prop-types
export function EditFormProvider({ children }: EditFormProviderProps) {
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
  return context;
}

export function updateEditForm(dispatch, type, value) {
  dispatch({ type, payload: value });
}

export function initEditForm(dispatch, initialState = {}) {
  dispatch({ type: "init", payload: initialState });
}
