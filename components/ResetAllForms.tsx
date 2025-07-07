"use client";

import {
  COLLECTION_PIECE_VERSION_FORM_LOCAL_STORAGE_KEY,
  CONFIRM_RESET_ALL_FORMS_MODAL_ID,
  FEED_FORM_LOCAL_STORAGE_KEY,
  SINGLE_PIECE_VERSION_FORM_LOCAL_STORAGE_KEY,
} from "@/utils/constants";
import {
  initFeedForm,
  useFeedForm,
} from "@/components/context/feedFormContext";
import dynamic from "next/dynamic";
import React, { useCallback, useState } from "react";
import DebugBox from "@/components/DebugBox";

const NeedConfirmationModal = dynamic(
  () => import("@/components/NeedConfirmationModal"),
  { ssr: false },
);

export default function ResetAllForms() {
  const { dispatch, state } = useFeedForm();
  const [isConfirmationModalOpened, setIsConfirmationModalOpened] =
    useState(false);

  const resetAllFormsData = useCallback(() => {
    localStorage.removeItem(SINGLE_PIECE_VERSION_FORM_LOCAL_STORAGE_KEY);
    localStorage.removeItem(COLLECTION_PIECE_VERSION_FORM_LOCAL_STORAGE_KEY);
    localStorage.removeItem(FEED_FORM_LOCAL_STORAGE_KEY);
    setIsConfirmationModalOpened(false);
    initFeedForm(dispatch);
  }, [dispatch]);

  return (
    <>
      <div className="flex content-center items-center mt-6 mb-4 gap-2">
        <div className="h-[1px] bg-error opacity-40 grow">{""}</div>
        <div className="text-xs font-light text-error">{`Danger zone`}</div>
        <div className="h-[1px] bg-error opacity-40 grow">{""}</div>
      </div>
      <div
        className="btn btn-soft btn-error w-full"
        onClick={() => setIsConfirmationModalOpened(true)}
      >
        {`Reset all forms data`}
      </div>
      <DebugBox
        stateObject={state}
        title="Feed form state"
        // shouldExpandNode={(level) => level < 3}
        expandAllNodes
      />
      <NeedConfirmationModal
        modalId={CONFIRM_RESET_ALL_FORMS_MODAL_ID}
        onConfirm={resetAllFormsData}
        onCancel={() => setIsConfirmationModalOpened(false)}
        description={`Delete all forms data from your browser local memory.`}
        isOpened={isConfirmationModalOpened}
      />
    </>
  );
}
