import React, { createContext, useCallback, useContext, useMemo } from "react";
import { ReviewWorkingCopy } from "@/features/review/reviewEditBridge";
import { ChecklistGraph } from "@/types/reviewTypes";
import {
  localStorageGetItem,
  localStorageSetItem,
  localStorageRemoveItem,
} from "@/utils/localStorage";

type ReviewWorkingCopyCtx = {
  getWorkingCopy(): ReviewWorkingCopy | null;
  saveWorkingCopy(nextGraph: any): void;
  clearWorkingCopy(): void;
};

const ReviewWorkingCopyContext = createContext<ReviewWorkingCopyCtx | null>(
  null,
);

export function ReviewWorkingCopyProvider({
  reviewId,
  children,
  initialGraph,
}: {
  reviewId: string;
  initialGraph: ChecklistGraph;
  children: React.ReactNode;
}) {
  const key = useMemo(() => `review:${reviewId}:workingCopy`, [reviewId]);

  const get = useCallback((): ReviewWorkingCopy | null => {
    return localStorageGetItem<ReviewWorkingCopy>(key);
  }, [key]);

  const save = useCallback(
    (nextGraph: any) => {
      const payload: ReviewWorkingCopy = {
        graph: nextGraph,
        updatedAt: new Date().toISOString(),
      };
      localStorageSetItem(key, payload);
    },
    [key],
  );

  const clear = useCallback(() => {
    localStorageRemoveItem(key);
  }, [key]);

  const value = useMemo<ReviewWorkingCopyCtx>(
    () => ({
      getWorkingCopy: get,
      saveWorkingCopy: save,
      clearWorkingCopy: clear,
    }),
    [get, save, clear],
  );

  // Initialize once if empty
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorageGetItem<ReviewWorkingCopy>(key)) {
      const init: ReviewWorkingCopy = {
        graph: initialGraph,
        updatedAt: new Date().toISOString(),
      };
      localStorageSetItem(key, init);
    }
  }, [key, initialGraph]);

  return (
    <ReviewWorkingCopyContext.Provider value={value}>
      {children}
    </ReviewWorkingCopyContext.Provider>
  );
}

export function useReviewWorkingCopy() {
  const ctx = useContext(ReviewWorkingCopyContext);
  if (!ctx) {
    throw new Error(
      "useReviewWorkingCopy must be used within ReviewWorkingCopyProvider",
    );
  }
  return ctx;
}
