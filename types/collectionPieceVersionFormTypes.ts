import {
  CollectionState,
  MMSourceOnPieceVersionsState,
  PieceVersionState,
  PersonState,
  PieceState,
  TempoIndicationState,
} from "@/types/formTypes";
import { ReactNode } from "react";

export type CollectionPieceVersionsFormAction =
  | {
      type: "init";
      payload?: CollectionPieceVersionsFormState;
    }
  | { type: "formInfo"; payload: Partial<CollectionPieceVersionsFormInfo> }
  | { type: "goToPrevStep" }
  | { type: "goToStep"; payload: { stepRank: number } }
  | {
      type: "collection";
      payload: {
        value:
          | Partial<CollectionState & { isComposerNew?: boolean }>
          | undefined;
        reset?: boolean;
        next?: boolean;
      };
    }
  | { type: "persons"; payload: { array: PersonState[] } }
  | { type: "pieces"; payload: { array: PieceState[]; reset?: boolean } }
  | { type: "pieceVersions"; payload: { array: PieceVersionState[] } }
  | { type: "tempoIndications"; payload: { array: TempoIndicationState[] } }
  | {
      type: "mMSourceOnPieceVersions";
      payload:
        | { array: MMSourceOnPieceVersionsState[]; idKey?: string }
        | { deleteIdArray: string[] }
        | { movePiece: { pieceVersionId: string; direction: "up" | "down" } };
    };
export type Dispatch = (action: CollectionPieceVersionsFormAction) => void;
export type CollectionPieceVersionsFormInfo = {
  currentStepRank: number;
  isSinglePieceVersionFormOpen?: boolean;
  allSourceOnPieceVersionsDone?: boolean;
  collectionFirstMMSourceOnPieceVersionRank?: number;
  pieceIdsNeedingVersions?: string[];
};

export type CollectionPieceVersionsFormState = {
  formInfo: CollectionPieceVersionsFormInfo;
  collection?: Partial<CollectionState & { isComposerNew?: boolean }>;
  mMSourceOnPieceVersions?: MMSourceOnPieceVersionsState[];
  persons?: PersonState[];
  pieces?: PieceState[];
  pieceVersions?: PieceVersionState[];
  tempoIndications?: TempoIndicationState[];
};
export type CollectionPieceVersionsFormProviderProps = {
  children: ReactNode;
  initialState?: CollectionPieceVersionsFormState | null;
};
