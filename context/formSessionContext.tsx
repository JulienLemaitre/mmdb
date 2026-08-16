"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import {
  FormSession,
  GloballyReviewedIds,
  ReviewSessionMeta,
  ReviewSessionMetaSchema,
} from "@/types/zodTypes";
import { localStorageGetItem, localStorageSetItem } from "@/utils/localStorage";

export type FormSessionContextValue =
  | {
      mode: "data-entering";
    }
  | {
      mode: "review";
      review: ReviewSessionMeta;
      globallyReviewed: GloballyReviewedIds;
      setOverallComment: (comment: string | null) => void;
    };

const defaultFormSession: FormSessionContextValue = {
  mode: "data-entering",
};

const FormSessionContext =
  createContext<FormSessionContextValue>(defaultFormSession);

export type FormSessionProviderProps = {
  children: ReactNode;
  session?: FormSession;
};

export function FormSessionProvider({
  children,
  session,
}: Readonly<FormSessionProviderProps>) {
  const [review, setReview] = useState<ReviewSessionMeta | null>(() => {
    if (session?.mode === "review") {
      const storageKey = `review:${session.review.reviewId}:session`;
      const stored = localStorageGetItem<unknown>(storageKey);
      if (stored) {
        const parsed = ReviewSessionMetaSchema.safeParse(stored);
        if (
          parsed.success &&
          parsed.data.reviewId === session.review.reviewId &&
          parsed.data.reviewerId === session.review.reviewerId
        ) {
          return parsed.data;
        }
      }
      return session.review;
    }
    return null;
  });

  useEffect(() => {
    if (session?.mode === "review") {
      const storageKey = `review:${session.review.reviewId}:session`;
      const stored = localStorageGetItem<unknown>(storageKey);
      if (stored) {
        const parsed = ReviewSessionMetaSchema.safeParse(stored);
        if (
          parsed.success &&
          parsed.data.reviewId === session.review.reviewId &&
          parsed.data.reviewerId === session.review.reviewerId
        ) {
          setReview(parsed.data);
          return;
        }
      }
      localStorageSetItem(storageKey, session.review);
      setReview(session.review);
    }
  }, [session]);

  const setOverallComment = useCallback(
    (comment: string | null) => {
      if (session?.mode !== "review") return;
      setReview((prev) => {
        const current = prev ?? session.review;
        const updated: ReviewSessionMeta = {
          ...current,
          overallComment: comment,
        };
        const storageKey = `review:${session.review.reviewId}:session`;
        localStorageSetItem(storageKey, updated);
        return updated;
      });
    },
    [session],
  );

  const value: FormSessionContextValue = useMemo(() => {
    if (session?.mode === "review") {
      return {
        mode: "review",
        review: review && review.reviewId === session.review.reviewId ? review : session.review,
        globallyReviewed: session.globallyReviewed,
        setOverallComment,
      };
    }
    return {
      mode: "data-entering",
    };
  }, [session, review, setOverallComment]);

  return (
    <FormSessionContext.Provider value={value}>
      {children}
    </FormSessionContext.Provider>
  );
}

export function useFormSession(): FormSessionContextValue {
  return useContext(FormSessionContext);
}
