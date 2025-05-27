"use client";
import { createContext, useContext, useReducer, useEffect } from "react";
import {
  CollectionState,
  FeedFormStep,
  IsNewTrue,
  OrganizationState,
  PersonState,
  PieceState,
  PieceVersionState,
} from "@/types/formTypes";
import { steps } from "@/components/multiStepMMSourceForm/stepsUtils";
import {
  Dispatch,
  FeedFormProviderProps,
  FeedFormState,
} from "@/types/feedFormTypes";
import { localStorageGetItem } from "@/utils/localStorage";
import { feedFormReducer } from "@/reducers/feedFormReducer";
import {
  FEED_FORM_INITIAL_STATE,
  FEED_FORM_LOCAL_STORAGE_KEY,
} from "@/utils/constants";

const FeedFormContext = createContext<
  | {
      state: FeedFormState;
      dispatch: Dispatch;
    }
  | undefined
>(undefined);

export function FeedFormProvider({
  children,
}: Readonly<FeedFormProviderProps>) {
  const [state, dispatch] = useReducer(
    feedFormReducer,
    FEED_FORM_INITIAL_STATE,
  );

  useEffect(() => {
    try {
      const localStorageValue = localStorageGetItem(
        FEED_FORM_LOCAL_STORAGE_KEY,
      );
      if (localStorageValue) {
        console.log(`[INIT] feedForm from localStorage`, localStorageValue);
        initFeedForm(dispatch, JSON.parse(localStorageValue));
      }
    } catch (error) {
      console.warn(
        `Error reading localStorage key “${FEED_FORM_LOCAL_STORAGE_KEY}”:`,
        error,
      );
    }
  }, []);

  const value = { state, dispatch };
  return (
    <FeedFormContext.Provider value={value}>
      {children}
    </FeedFormContext.Provider>
  );
}

export function useFeedForm() {
  const context = useContext(FeedFormContext);
  if (context === undefined) {
    throw new Error("useFeedForm must be used within a FeedFormProvider");
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

export function updateFeedForm(dispatch, type, value) {
  dispatch({ type, payload: value });
}

export function initFeedForm(dispatch, initialState = FEED_FORM_INITIAL_STATE) {
  dispatch({ type: "init", payload: initialState });
}

function getLastCompletedStep(state: FeedFormState): FeedFormStep | undefined {
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
  state: FeedFormState,
  entityName: "pieces",
): (PieceState & IsNewTrue)[];
export function getNewEntities(
  state: FeedFormState,
  entityName: "pieceVersions",
): (PieceVersionState & IsNewTrue)[];
export function getNewEntities(
  state: FeedFormState,
  entityName: "collections",
): (CollectionState & IsNewTrue)[];
export function getNewEntities(
  state: FeedFormState,
  entityName: "persons",
): (PersonState & IsNewTrue)[];
export function getNewEntities(
  state: FeedFormState,
  entityName: "organizations",
): (OrganizationState & IsNewTrue)[];
export function getNewEntities(
  state: FeedFormState,
  entityName:
    | "pieces"
    | "pieceVersions"
    | "collections"
    | "persons"
    | "organizations",
) {
  if (!state) {
    console.error(`[getNewEntities] NO state provided to find ${entityName}`);
    return [];
  }
  if (Array.isArray(state[entityName])) {
    return state[entityName].filter(
      (entity) => entity.isNew && isEntityUsed(entity, entityName, state),
    );
  }
  return [];
}

function isEntityUsed(
  entity:
    | PieceState
    | PieceVersionState
    | CollectionState
    | PersonState
    | OrganizationState,
  entityName:
    | "pieces"
    | "pieceVersions"
    | "collections"
    | "persons"
    | "organizations",
  state: FeedFormState,
): boolean {
  if (entityName === "pieces") {
    return (state.pieceVersions || []).some(
      (pieceVersion) =>
        pieceVersion.pieceId === entity.id &&
        isEntityUsed(pieceVersion, "pieceVersions", state),
    );
  }
  if (entityName === "pieceVersions") {
    return (state.mMSourcePieceVersions || []).some(
      (mMSourcePieceVersion) =>
        mMSourcePieceVersion.pieceVersionId === entity.id,
    );
  }
  if (entityName === "collections") {
    return (state.pieces || []).some(
      (piece) =>
        piece.collectionId === entity.id &&
        isEntityUsed(piece, "pieces", state),
    );
  }
  if (entityName === "persons") {
    return (state.pieces || []).some(
      (piece) =>
        (piece.composerId === entity.id &&
          isEntityUsed(piece, "pieces", state)) ||
        (state.mMSourceContributions || []).some((mMSourceContribution) => {
          if ("person" in mMSourceContribution) {
            return mMSourceContribution.person?.id === entity.id;
          }
          return false;
        }),
    );
  }
  if (entityName === "organizations") {
    return (state.mMSourceContributions || []).some((mMSourceContribution) => {
      if ("organization" in mMSourceContribution) {
        return mMSourceContribution.organization?.id === entity.id;
      }
      return false;
    });
  }
  return false;
}

export function getEntityByIdOrKey(
  state: FeedFormState,
  entityName: string,
  id: string,
  key = "id",
) {
  if (Array.isArray(state?.[entityName])) {
    return state[entityName].find((entity) => entity[key] === id);
  }
}
