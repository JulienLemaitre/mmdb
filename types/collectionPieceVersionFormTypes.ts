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
export type Dispatch = (action: CollectionPieceVersionsFormAction) => void;
export type CollectionPieceVersionsFormInfo = {
  currentStepRank: number;
  isSinglePieceVersionFormOpen?: boolean;
  allSourcePieceVersionsDone?: boolean;
  collectionFirstMMSourceOnPieceVersionRank?: number;
  pieceIdsNeedingVersions?: string[];
};

export type CollectionPieceVersionsFormState = {
  formInfo: CollectionPieceVersionsFormInfo;
  collection?: Partial<CollectionState & { isComposerNew?: boolean }>;
  mMSourcePieceVersions?: MMSourceOnPieceVersionsState[];
  persons?: PersonState[];
  pieces?: PieceState[];
  pieceVersions?: PieceVersionState[];
  tempoIndications?: TempoIndicationState[];
};
export type PersistableCollectionPieceVersionsFormState =
  Required<CollectionPieceVersionsFormState>;
export type CollectionPieceVersionsFormProviderProps = {
  children: ReactNode;
  initialState?: CollectionPieceVersionsFormState | null;
};
