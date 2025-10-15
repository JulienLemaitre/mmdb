"use client";

import React from "react";
import { ReviewWorkingCopyProvider } from "@/context/reviewWorkingCopyContext";

export default function ReviewWorkingCopyClientProvider({
  reviewId,
  initialGraph,
  children,
}: {
  reviewId: string;
  initialGraph: any;
  children: React.ReactNode;
}) {
  return (
    <ReviewWorkingCopyProvider reviewId={reviewId} initialGraph={initialGraph}>
      {children}
    </ReviewWorkingCopyProvider>
  );
}
