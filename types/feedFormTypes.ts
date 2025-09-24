import {
  CollectionState,
  MetronomeMarkState,
  MMSourceContributionsState,
  MMSourceDescriptionState,
  MMSourcePieceVersionsState,
  NewPieceVersionState,
  OrganizationState,
  PersonState,
  PieceState,
  SourceOnPieceVersionsFormType,
  TempoIndicationState,
} from "@/types/formTypes";
import { ReactNode } from "react";

export type PieceFormAction =
  | { type: "init"; payload: any }
  | { type: "goToPrevStep" }
  | { type: "goToStep"; payload: any }
  | { type: "formInfo"; payload: any }
  | { type: "organizations"; payload: any }
  | { type: "collections"; payload: any }
  | { type: "persons"; payload: any }
  | { type: "pieces"; payload: any }
  | { type: "pieceVersions"; payload: any }
  | { type: "tempoIndications"; payload: any }
  | { type: "mMSourceDescription"; payload: any }
  | { type: "mMSourceContributions"; payload: any }
  | { type: "mMSourcePieceVersions"; payload: any }
  | { type: "editedSourceOnPieceVersions"; payload: any }
  | { type: "metronomeMarks"; payload: any };
export type Dispatch = (action: PieceFormAction) => void;
export type ReviewContext = {
  reviewId: string;
  reviewEdit: true;
  updatedAt: string; // ISO
  anchors?: { pvId?: string; movId?: string; secId?: string; mmId?: string };
};

export type FeedFormInfo = {
  currentStepRank: number;
  introDone?: boolean;
  isSourceOnPieceVersionformOpen?: boolean;
  formType?: SourceOnPieceVersionsFormType;
  allSourcePieceVersionsDone?: boolean;
  allSourceContributionsDone?: boolean;
  reviewContext?: ReviewContext; // present when the feed form is opened from review edit mode
};
export type FeedFormState = {
  formInfo?: FeedFormInfo;
  mMSourceDescription?: MMSourceDescriptionState;
  mMSourceContributions?: MMSourceContributionsState;
  mMSourcePieceVersions?: MMSourcePieceVersionsState[];
  organizations?: OrganizationState[];
  collections?: CollectionState[];
  persons?: PersonState[];
  pieces?: PieceState[];
  pieceVersions?: NewPieceVersionState[];
  tempoIndications?: TempoIndicationState[];
  metronomeMarks?: MetronomeMarkState[];
};
export type PersistableFeedFormState = Required<FeedFormState>;
export type FeedFormProviderProps = { children: ReactNode };
