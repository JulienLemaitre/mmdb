import React, { createContext, useCallback, useContext, useMemo } from "react";
import { ReviewWorkingCopy } from "@/features/review/reviewEditBridge";
import { ChecklistGraph } from "@/features/review/ReviewChecklistSchema";

type Ctx = {
  getWorkingCopy(): ReviewWorkingCopy | null;
  saveWorkingCopy(nextGraph: any): void;
  clearWorkingCopy(): void;
};

const ReviewWorkingCopyContext = createContext<Ctx | null>(null);

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
    const raw =
      typeof window !== "undefined" ? localStorage.getItem(key) : null;
    if (!raw) return null;
    try {
      return JSON.parse(raw) as ReviewWorkingCopy;
    } catch {
      // Reset on corruption
      const fallback: ReviewWorkingCopy = {
        graph: initialGraph,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
  }, [key, initialGraph]);

  const save = useCallback(
    (nextGraph: any) => {
      const payload: ReviewWorkingCopy = {
        graph: nextGraph,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(key, JSON.stringify(payload));
    },
    [key],
  );

  const clear = useCallback(() => {
    localStorage.removeItem(key);
  }, [key]);

  const value = useMemo<Ctx>(
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
    if (!localStorage.getItem(key)) {
      const init: ReviewWorkingCopy = {
        graph: initialGraph,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(key, JSON.stringify(init));
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
