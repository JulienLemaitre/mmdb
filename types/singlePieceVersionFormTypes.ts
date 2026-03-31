import { PersonState, PieceState, PieceVersionState } from "@/types/formTypes";

export type SinglePieceVersionFormInfo = {
  currentStepRank: number;
  allSourceOnPieceVersionsDone?: boolean;
  mMSourceOnPieceVersionRank?: number;
};

export type SinglePieceVersionFormState = {
  formInfo: SinglePieceVersionFormInfo;
  composer?: PersonState;
  piece?: PieceState;
  pieceVersion?: PieceVersionState;
};

export type SinglePieceVersionFormAction =
  | {
      type: "init";
      payload?: SinglePieceVersionFormState;
    }
  | { type: "goToPrevStep" }
  | { type: "goToStep"; payload: { stepRank: number } }
  | {
      type: "composer";
      payload: { value: PersonState | undefined; next?: boolean };
    }
  | {
      type: "piece";
      payload: { value: PieceState | undefined; next?: boolean };
    }
  | {
      type: "pieceVersion";
      payload: { value: PieceVersionState | undefined; next?: boolean };
    };
