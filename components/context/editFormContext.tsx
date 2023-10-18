import { createContext, useContext, useReducer, ReactNode } from "react";
import { Movement } from "@prisma/client";

type PieceFormAction =
  | { type: "init"; payload: any }
  | { type: "composerId"; payload: string }
  | { type: "pieceId"; payload: string }
  | { type: "pieceVersionId"; payload: string }
  | { type: "movements"; payload: string };
type Dispatch = (action: PieceFormAction) => void;
type EditFormState = {
  composerId?: string;
  pieceId?: string;
  pieceVersionId?: string;
  movements?: Movement[];
};
type EditFormProviderProps = { children: ReactNode };

const EditFormContext = createContext<
  | {
      state: EditFormState;
      dispatch: Dispatch;
    }
  | undefined
>(undefined);

function editFormReducer(state: EditFormState, action: PieceFormAction) {
  if (
    ["composerId", "pieceId", "pieceVersionId", "movements"].includes(
      action.type,
    )
  ) {
    return { ...state, [action.type]: action.payload };
  }
  if (action.type === "init") {
    return {};
  }
  throw new Error(`Unhandled action type: ${action.type}`);
}

// eslint-disable-next-line react/prop-types
export function EditFormProvider({ children }: EditFormProviderProps) {
  const [state, dispatch] = useReducer(editFormReducer, {});
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
