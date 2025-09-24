"use client";
import { createContext, useContext, useEffect, useReducer } from "react";
import {
  CollectionState,
  FeedFormStep,
  IsNewTrue,
  MetronomeMarkState,
  OrganizationState,
  PersonState,
  PieceState,
  PieceVersionState,
  TempoIndicationState,
} from "@/types/formTypes";
import { steps } from "@/components/multiStepMMSourceForm/stepsUtils";
import {
  Dispatch,
  FeedFormProviderProps,
  FeedFormState,
} from "@/types/feedFormTypes";
import { localStorageGetItem } from "@/utils/localStorage";
import { feedFormReducer } from "@/components/context/feedFormReducer";
import {
  FEED_FORM_INITIAL_STATE,
  FEED_FORM_LOCAL_STORAGE_KEY,
  FEED_FORM_BOOT_KEY,
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
    // If a boot payload exists (coming from review edit mode), consume it
    try {
      const bootRaw = localStorage.getItem(FEED_FORM_BOOT_KEY);
      if (bootRaw) {
        localStorage.setItem(FEED_FORM_LOCAL_STORAGE_KEY, bootRaw);
        localStorage.removeItem(FEED_FORM_BOOT_KEY);
      }
    } catch {
      // ignore
    }
    const localStorageValue = localStorageGetItem(FEED_FORM_LOCAL_STORAGE_KEY);
    if (localStorageValue) {
      console.log(`[INIT] feedForm from localStorage`, localStorageValue);
      initFeedForm(dispatch, localStorageValue);
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

export function updateFeedForm(dispatch, type, value?: any) {
  dispatch({
    type,
    ...(typeof value !== "undefined" ? { payload: value } : ({} as any)),
  });
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
  options?: { includeUnusedInFeedForm?: boolean },
): (PieceState & IsNewTrue)[];
export function getNewEntities(
  state: FeedFormState,
  entityName: "pieceVersions",
  options?: { includeUnusedInFeedForm?: boolean },
): (PieceVersionState & IsNewTrue)[];
export function getNewEntities(
  state: FeedFormState,
  entityName: "collections",
  options?: { includeUnusedInFeedForm?: boolean },
): (CollectionState & IsNewTrue)[];
export function getNewEntities(
  state: FeedFormState,
  entityName: "persons",
  options?: { includeUnusedInFeedForm?: boolean },
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
  options?: { includeUnusedInFeedForm?: boolean },
) {
  if (!state) {
    console.error(`[getNewEntities] NO state provided to find ${entityName}`);
    return [];
  }
  if (Array.isArray(state[entityName])) {
    return state[entityName].filter(
      (entity) =>
        entity.isNew &&
        (options?.includeUnusedInFeedForm ||
          // @ts-ignore
          isEntityUsed(entity, entityName, state)),
    );
  }
  return [];
}

export function isEntityUsed(
  entity: PieceState,
  entityName: "pieces",
  state: FeedFormState,
): boolean;
export function isEntityUsed(
  entity: PieceVersionState,
  entityName: "pieceVersions",
  state: FeedFormState,
): boolean;
export function isEntityUsed(
  entity: CollectionState,
  entityName: "collections",
  state: FeedFormState,
): boolean;
export function isEntityUsed(
  entity: PersonState,
  entityName: "persons",
  state: FeedFormState,
): boolean;
export function isEntityUsed(
  entity: OrganizationState,
  entityName: "organizations",
  state: FeedFormState,
): boolean;
export function isEntityUsed(
  entity: MetronomeMarkState,
  entityName: "metronomeMarks",
  state: FeedFormState,
): boolean;
export function isEntityUsed(
  entity: TempoIndicationState,
  entityName: "tempoIndications",
  state: FeedFormState,
): boolean;
export function isEntityUsed(
  entity:
    | PieceState
    | PieceVersionState
    | CollectionState
    | PersonState
    | OrganizationState
    | MetronomeMarkState
    | TempoIndicationState,
  entityName:
    | "pieces"
    | "pieceVersions"
    | "collections"
    | "persons"
    | "organizations"
    | "metronomeMarks"
    | "tempoIndications",
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
    return (
      // Is the person a composer?
      (state.pieces || []).some(
        (piece) =>
          piece.composerId === entity.id &&
          isEntityUsed(piece, "pieces", state),
      ) ||
      // Is the person a contributor?
      (state.mMSourceContributions || []).some((mMSourceContribution) => {
        if ("person" in mMSourceContribution) {
          return mMSourceContribution.person?.id === entity.id;
        }
        return false;
      })
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
  if (entityName === "metronomeMarks") {
    const metronomeMark = entity as MetronomeMarkState;
    return (state.pieceVersions || []).some(
      (pv) =>
        pv.id === metronomeMark.pieceVersionId &&
        isEntityUsed(pv, "pieceVersions", state),
    );
  }
  if (entityName === "tempoIndications") {
    const tempoIndication = entity as TempoIndicationState;
    return (state.pieceVersions || []).some(
      (pv) =>
        pv.movements.some((m) =>
          m.sections.some((s) => s.tempoIndication.id === tempoIndication.id),
        ) && isEntityUsed(pv, "pieceVersions", state),
    );
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
