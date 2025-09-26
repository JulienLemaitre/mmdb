import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/options";
import { db } from "@/utils/db";
import { REVIEW_STATE } from "@prisma/client";
import { redirect } from "next/navigation";
import { URL_REVIEW_LIST } from "@/utils/routes";
import React from "react";
import ReviewWorkingCopyClientProvider from "./ReviewWorkingCopyClientProvider";
import { getReviewOverview } from "@/utils/server/getReviewOverview";

export default async function ChecklistLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ reviewId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect(`/login?reason=unauthorized`);
  }
  const role = session.user.role as string | undefined;
  if (!role || (role !== "REVIEWER" && role !== "ADMIN")) {
    console.warn(`[ChecklistLayout] User role not allowed: ${role}`);
    redirect(`/`);
  }

  const { reviewId } = await params;
  if (!reviewId) {
    console.warn(`[ChecklistLayout] Missing reviewId in route params`);
    redirect(`${URL_REVIEW_LIST}?reason=notFound`);
  }

  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: { id: true, creatorId: true, state: true },
  });

  if (!review) {
    console.warn(`[ChecklistLayout] Review not found: ${reviewId}`);
    redirect(`${URL_REVIEW_LIST}?reason=notFound`);
  }

  const isOwner = review.creatorId === session.user.id;
  const isAdmin = role === "ADMIN";
  if (!isOwner && !isAdmin) {
    console.warn(
      `[ChecklistLayout] Forbidden access by user ${session.user.id} to review ${reviewId}`,
    );
    redirect(`${URL_REVIEW_LIST}?reason=notOwner`);
  }

  if (review.state !== REVIEW_STATE.IN_REVIEW) {
    console.warn(
      `[ChecklistLayout] Review ${reviewId} state is ${review.state}, expected IN_REVIEW`,
    );
    redirect(`${URL_REVIEW_LIST}?reason=notActive`);
  }

  // Fetch overview graph to seed the ReviewWorkingCopyProvider
  const { graph } = await getReviewOverview(reviewId);

  return (
    <ReviewWorkingCopyClientProvider reviewId={reviewId} initialGraph={graph}>
      {children}
    </ReviewWorkingCopyClientProvider>
  );
}
