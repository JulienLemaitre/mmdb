"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useFeedForm } from "@/components/context/feedFormContext";
import { GET_URL_REVIEW_CHECKLIST } from "@/utils/routes";

export default function ReviewEditBanner() {
  const { state } = useFeedForm();
  const router = useRouter();
  const rc = state.formInfo?.reviewContext;

  if (!rc || !rc.reviewEdit) return null;

  const onBack = () => {
    if (rc.reviewId) {
      router.push(GET_URL_REVIEW_CHECKLIST(rc.reviewId));
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-300 text-yellow-900 rounded p-3 mb-4 flex items-center gap-3">
      <div className="font-medium">Edit mode within an in‑progress review</div>
      <div className="text-sm opacity-80">
        Changes are saved locally and will only be persisted when you approve the review.
      </div>
      <button className="btn btn-sm btn-neutral ml-auto" onClick={onBack}>
        Back to review
      </button>
    </div>
  );
}
