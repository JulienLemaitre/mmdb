"use client";

import React from "react";
import { ReviewWorkingCopyProvider } from "@/context/reviewWorkingCopyContext";
import { ChecklistGraph } from "@/features/review/ReviewChecklistSchema";

export default function ReviewWorkingCopyClientProvider({
  reviewId,
  initialGraph,
  children,
}: {
  reviewId: string;
  initialGraph: ChecklistGraph;
  children: React.ReactNode;
}) {
  return (
    <ReviewWorkingCopyProvider reviewId={reviewId} initialGraph={initialGraph}>
      {children}
    </ReviewWorkingCopyProvider>
  );
}
