"use client";

import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useFeedForm } from "@/context/feedFormContext";
import { GET_URL_REVIEW_CHECKLIST } from "@/utils/routes";
import { FEED_FORM_LOCAL_STORAGE_KEY } from "@/utils/constants";

export default function ReviewEditBanner() {
  const { state } = useFeedForm();
  const router = useRouter();
  const rc = state.formInfo?.reviewContext;
  const appliedRef = useRef(false);

  useEffect(() => {
    if (!rc || !rc.reviewEdit || appliedRef.current) return;
    // Try to scroll/focus the target anchor after the form step mounts.
    // We retry a few times to accommodate lazy rendering.
    const anchors = rc.anchors;
    if (!anchors) return;

    let cancelled = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 40; // ~2s at 50ms
    const INTERVAL = 50;

    function findById(id: string, type: string): HTMLElement | null {
      const byData = document.querySelector<HTMLElement>(
        `[data-${type}-id="${id}"]`,
      );
      if (byData) return byData;
      const byId = document.getElementById(`${type}-${id}`);
      if (byId) return byId as HTMLElement;
      return null;
    }

    function chooseTarget(): HTMLElement | null {
      // Prefer most specific anchors
      if (anchors?.mmId) {
        const el = findById(anchors?.mmId, "mm");
        if (el) return el;
      }
      if (anchors?.secId) {
        const el = findById(anchors?.secId, "section");
        if (el) return el;
      }
      if (anchors?.movId) {
        const el = findById(anchors?.movId, "movement");
        if (el) return el;
      }
      if (anchors?.pvId) {
        const el = findById(anchors?.pvId, "piece-version");
        if (el) return el;
      }
      return null;
    }

    const tryApply = () => {
      if (cancelled) return;
      attempts += 1;
      const target = chooseTarget();
      if (target) {
        appliedRef.current = true;
        try {
          target.scrollIntoView({ behavior: "smooth", block: "center" });
          // transient highlight
          target.classList.add("ring", "ring-offset-2", "ring-yellow-400");
          setTimeout(
            () =>
              target.classList.remove(
                "ring",
                "ring-offset-2",
                "ring-yellow-400",
              ),
            1200,
          );
        } catch {
          // ignore
        }
        return;
      }
      if (attempts < MAX_ATTEMPTS) {
        setTimeout(tryApply, INTERVAL);
      }
    };

    // kick off after a short delay to let the step render
    const t = setTimeout(tryApply, 50);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [rc]);

  if (!rc || !rc.reviewEdit) return null;

  const onBack = () => {
    try {
      // Persist the current FeedFormState so the checklist can rebuild the working copy
      localStorage.setItem(FEED_FORM_LOCAL_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore storage errors
    }
    if (rc.reviewId) {
      router.push(GET_URL_REVIEW_CHECKLIST(rc.reviewId));
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-300 text-yellow-900 rounded p-3 mb-4 flex items-center gap-3">
      <div className="font-medium">Edit mode within an in‑progress review</div>
      <div className="text-sm opacity-80">
        Changes are saved locally and will only be persisted when you approve
        the review.
      </div>
      <button className="btn btn-sm btn-neutral ml-auto" onClick={onBack}>
        Back to review
      </button>
    </div>
  );
}
