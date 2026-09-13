"use client";

import React, { useCallback, useMemo, useState, Suspense } from "react";
import dynamic from "next/dynamic";
import {
  COLLECTION_PIECE_VERSION_FORM_LOCAL_STORAGE_KEY,
  CONFIRM_RESET_SOURCE_CHANGES_MODAL_ID,
  FEED_FORM_INITIAL_STATE,
  GET_SELF_EDIT_STORAGE_KEYS,
  SINGLE_PIECE_VERSION_FORM_LOCAL_STORAGE_KEY,
} from "@/utils/constants";
import {
  localStorageRemoveItem,
  localStorageSetItem,
  purgeSelfEditLocalDrafts,
} from "@/utils/localStorage";
import { initFeedForm, useFeedForm } from "@/context/feedFormContext";
import { useFormSession } from "@/context/formSessionContext";
import { FeedFormState } from "@/types/feedFormTypes";
import DebugBox from "@/ui/DebugBox";

const NeedConfirmationModal = dynamic(
  () => import("@/ui/modal/NeedConfirmationModal"),
  { ssr: false },
);

export type ResetSourceChangesProps = {
  initialState?: FeedFormState;
  baseline?: FeedFormState;
  sourceId?: string;
};

export default function ResetSourceChanges({
  initialState,
  baseline,
  sourceId,
}: Readonly<ResetSourceChangesProps>) {
  const session = useFormSession();
  const { dispatch, state } = useFeedForm();
  const [isConfirmationModalOpened, setIsConfirmationModalOpened] =
    useState(false);

  const resolvedSourceId =
    sourceId ??
    (session.mode === "self-source-edit"
      ? session.selfEdit.mMSourceId
      : undefined);

  const targetInitialState: FeedFormState = useMemo(() => {
    if (initialState) {
      return initialState;
    }
    if (baseline) {
      return {
        ...baseline,
        formInfo: {
          currentStepRank: 0,
          introDone: false,
          allSourceOnPieceVersionsDone: true,
        },
      };
    }
    return FEED_FORM_INITIAL_STATE;
  }, [initialState, baseline]);

  const resetChanges = useCallback(() => {
    if (resolvedSourceId) {
      purgeSelfEditLocalDrafts(resolvedSourceId);
    }
    localStorageRemoveItem(SINGLE_PIECE_VERSION_FORM_LOCAL_STORAGE_KEY);
    localStorageRemoveItem(COLLECTION_PIECE_VERSION_FORM_LOCAL_STORAGE_KEY);
    setIsConfirmationModalOpened(false);
    initFeedForm(dispatch, targetInitialState);
    if (resolvedSourceId && session.mode === "self-source-edit") {
      localStorageSetItem(
        GET_SELF_EDIT_STORAGE_KEYS(resolvedSourceId).session,
        session.selfEdit,
      );
    }
  }, [dispatch, resolvedSourceId, session, targetInitialState]);

  if (session.mode !== "self-source-edit") {
    return null;
  }

  return (
    <>
      <div className="flex content-center items-center mt-6 mb-4 gap-2">
        <div className="h-px bg-error opacity-40 grow">{""}</div>
        <div className="text-xs font-light text-error">{`Danger zone`}</div>
        <div className="h-px bg-error opacity-40 grow">{""}</div>
      </div>
      <button
        type="button"
        className="btn btn-soft btn-error w-full"
        onClick={() => setIsConfirmationModalOpened(true)}
      >
        {`Reset changes`}
      </button>
      <Suspense fallback={null}>
        <DebugBox stateObject={state} title="Feed form state" expandAllNodes />
      </Suspense>
      <NeedConfirmationModal
        modalId={CONFIRM_RESET_SOURCE_CHANGES_MODAL_ID}
        onConfirm={resetChanges}
        onCancel={() => setIsConfirmationModalOpened(false)}
        description={`Discard all modifications made to this MM Source and restore its original data.`}
        isOpened={isConfirmationModalOpened}
      />
    </>
  );
}
