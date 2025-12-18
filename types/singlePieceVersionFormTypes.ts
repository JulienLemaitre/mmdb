export type SinglePieceVersionFormInfo = {
  currentStepRank: number;
  allSourceOnPieceVersionsDone?: boolean;
  mMSourceOnPieceVersionRank?: number;
};

export type SinglePieceVersionFormState = {
  formInfo: SinglePieceVersionFormInfo;
  composer?: { id?: string; isNew?: boolean };
  piece?: { id?: string; isNew?: boolean };
  pieceVersion?: { id?: string; isNew?: boolean };
};

export type SinglePieceVersionFormAction =
  | {
      type: "init";
      payload?: {
        value: SinglePieceVersionFormState;
        next?: boolean;
      };
    }
  | { type: "goToPrevStep" }
  | { type: "goToStep"; payload: { stepRank: number } }
  | {
      type: "composer";
      payload: { value: { id: string; isNew?: boolean }; next?: boolean };
    }
  | {
      type: "piece";
      payload: { value: { id: string; isNew?: boolean }; next?: boolean };
    }
  | {
      type: "pieceVersion";
      payload: { value: { id: string; isNew?: boolean }; next?: boolean };
    };
