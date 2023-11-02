"use client";
import { createContext, useContext, useReducer, ReactNode } from "react";
import { Movement } from "@prisma/client";
import { ComposerState, PieceState } from "@/types/editFormTypes";

type PieceFormAction =
  | { type: "init"; payload: any }
  | { type: "composerId"; payload: string }
  | { type: "pieceId"; payload: string }
  | { type: "pieceVersionId"; payload: string }
  | { type: "movements"; payload: string };
type Dispatch = (action: PieceFormAction) => void;
type EditFormState = {
  composer?: ComposerState;
  piece?: PieceState;
  pieceVersionId?: string;
  movements?: Movement[];
};
type EditFormProviderProps = { children: ReactNode };

const LOCL_STORAGE_KEY = "editForm";

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
    ["composer", "piece", "pieceVersionId", "movements"].includes(action.type)
  ) {
    const newState = { ...state, [action.type]: action.payload };
    localStorageSetItem("editForm", newState);
    return { ...state, [action.type]: action.payload };
  }
  if (action.type === "init") {
    localStorageSetItem("editForm", {});
    return {};
  }
  throw new Error(`Unhandled action type: ${action.type}`);
}

// eslint-disable-next-line react/prop-types
export function EditFormProvider({ children }: EditFormProviderProps) {
  const [state, dispatch] = useReducer(editFormReducer, {}, (initArg) => {
    let editFormData = initArg;
    try {
      const localStorageValue = localStorageGetItem(LOCL_STORAGE_KEY);
      if (localStorageValue) editFormData = JSON.parse(localStorageValue);
    } catch (error) {
      console.warn(
        `Error reading localStorage key “${LOCL_STORAGE_KEY}”:`,
        error,
      );
    }
    console.log(`[useReducer Initializer] editFormData :`, editFormData);
    return editFormData;
  });
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

export function initEditForm(dispatch) {
  dispatch({ type: "init" });
}
