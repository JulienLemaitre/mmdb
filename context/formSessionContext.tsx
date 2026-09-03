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
import {
  localStorageGetItem,
  localStorageSetItem,
  purgeReviewLocalDrafts,
} from "@/utils/localStorage";
import {
  closeNotification,
  ToastNotificationContext,
} from "@/context/toastNotification/toastNotificationContext";
import { toastNotificationAction } from "@/context/toastNotification/toastNotificationAction";
import { debug } from "@/utils/debugLogger";
import { getNewUuid } from "@/utils/getNewUuid";

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
  const toastContext = useContext(ToastNotificationContext);

  const getInitialReviewMeta = useCallback(
    (sess: FormSession | undefined): ReviewSessionMeta | null => {
      if (sess?.mode === "review") {
        const storageKey = `review:${sess.review.reviewId}:session`;
        const stored = localStorageGetItem<unknown>(storageKey);
        if (stored) {
          const parsed = ReviewSessionMetaSchema.safeParse(stored);
          if (
            parsed.success &&
            parsed.data.reviewId === sess.review.reviewId &&
            parsed.data.reviewerId === sess.review.reviewerId
          ) {
            return parsed.data;
          }
        }
        return sess.review;
      }
      return null;
    },
    [],
  );

  const [review, setReview] = useState<ReviewSessionMeta | null>(() =>
    getInitialReviewMeta(session),
  );

  const [prevSessionKey, setPrevSessionKey] = useState<string | null>(
    session?.mode === "review"
      ? `${session.review.reviewId}:${session.review.reviewerId}`
      : null,
  );

  const currentSessionKey =
    session?.mode === "review"
      ? `${session.review.reviewId}:${session.review.reviewerId}`
      : null;

  if (currentSessionKey !== prevSessionKey) {
    setPrevSessionKey(currentSessionKey);
    setReview(getInitialReviewMeta(session));
  }

  useEffect(() => {
    if (session?.mode === "review") {
      const storageKey = `review:${session.review.reviewId}:session`;
      const stored = localStorageGetItem<unknown>(storageKey);
      if (stored) {
        const parsed = ReviewSessionMetaSchema.safeParse(stored);
        if (
          parsed.success &&
          (parsed.data.reviewId !== session.review.reviewId ||
            parsed.data.reviewerId !== session.review.reviewerId)
        ) {
          purgeReviewLocalDrafts(session.review.reviewId);
          debug.log(
            "[formSessionContext] Local draft reset: session does not match current user.",
            { expected: session.review, stored: parsed.data },
          );
          if (toastContext?.dispatch) {
            const notificationId = getNewUuid();
            toastContext.dispatch({
              type: toastNotificationAction.ADD,
              payload: {
                notification: {
                  id: notificationId,
                  type: toastNotificationAction.WARNING,
                  message:
                    "Local draft reset: session does not match current user.",
                  active: true,
                },
              },
            });
            setTimeout(() => {
              closeNotification(toastContext.dispatch, notificationId);
            }, 6000);
          }
          localStorageSetItem(storageKey, session.review);
        }
      } else {
        localStorageSetItem(storageKey, session.review);
      }
    }
  }, [session, toastContext]);

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
