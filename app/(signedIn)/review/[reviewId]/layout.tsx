import React, { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/options";
import { redirect } from "next/navigation";
import { URL_REVIEW_LIST } from "@/utils/routes";
import {
  getReviewBaseline,
  buildReviewInitialFeedFormState,
} from "@/utils/server/getReviewBaseline";
import { FormSessionProvider } from "@/context/formSessionContext";
import { FeedFormProvider } from "@/context/feedFormContext";
import FeedFormShell from "@/features/feed/FeedFormShell";
import { GET_REVIEW_STORAGE_KEYS } from "@/utils/constants";
import { FormSession } from "@/types/zodTypes";

export const dynamic = "force-dynamic";

export default async function ReviewLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ reviewId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect(`/login?reason=unauthorized`);
  }
  const role = (session.user as any).role as string | undefined;
  if (!role || (role !== "REVIEWER" && role !== "ADMIN")) {
    console.warn(`[ReviewLayout] User role not allowed: ${role}`);
    redirect(`/`);
  }

  const { reviewId } = await params;
  if (!reviewId) {
    console.warn(`[ReviewLayout] Missing reviewId in route params`);
    redirect(`${URL_REVIEW_LIST}?reason=notFound`);
  }

  let baselineResult;
  try {
    baselineResult = await getReviewBaseline(reviewId, { requireOwner: true });
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(
      `[ReviewLayout] Failed to load baseline for review ${reviewId}:`,
      msg,
    );
    if (
      msg.includes("Unauthorized") ||
      msg.includes("reviewer role required")
    ) {
      redirect(`${URL_REVIEW_LIST}?reason=unauthorized`);
    } else if (
      msg.includes("Review not found") ||
      msg.includes("MM Source not found")
    ) {
      redirect(`${URL_REVIEW_LIST}?reason=notFound`);
    } else if (msg.includes("only review owner can access")) {
      redirect(`${URL_REVIEW_LIST}?reason=notOwner`);
    } else if (msg.includes("Review must be IN_REVIEW")) {
      redirect(`${URL_REVIEW_LIST}?reason=notActive`);
    } else {
      redirect(`${URL_REVIEW_LIST}?reason=notFound`);
    }
  }

  const { review, baseline, globallyReviewed, mMSource } = baselineResult;

  const formSession: FormSession = {
    mode: "review",
    review: {
      reviewId: review.id,
      reviewerId: session.user.id,
      mMSourceId: review.mMSourceId,
      overallComment: null,
    },
    globallyReviewed,
  };

  const initialState = buildReviewInitialFeedFormState({
    baseline,
    globallyReviewed,
  });

  const storageKey = GET_REVIEW_STORAGE_KEYS(reviewId).feedForm;

  return (
    <FormSessionProvider session={formSession}>
      <FeedFormProvider storageKey={storageKey} initialState={initialState}>
        <FeedFormShell
          title={`Review: ${mMSource.title ?? "Untitled MM Source"}`}
        >
          {children}
        </FeedFormShell>
      </FeedFormProvider>
    </FormSessionProvider>
  );
}
