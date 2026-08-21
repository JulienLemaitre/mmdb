"use client";

import React, { useState } from "react";
import { useFormSession } from "@/context/formSessionContext";
import { useFeedForm } from "@/context/feedFormContext";
import { FeedFormState } from "@/types/feedFormTypes";
import OverallCommentModal from "./OverallCommentModal";
import ReviewDiffModal from "./ReviewDiffModal";
import AbortReviewButton from "./AbortReviewButton";
import getIMSLPPermaLink from "@/utils/getIMSLPPermaLink";
import EditIcon from "@/ui/svg/EditIcon";
import EyeIcon from "@/ui/svg/EyeIcon";

export type ReviewSessionBannerProps = {
  baseline: FeedFormState;
  mMSource?: {
    id: string;
    title?: string | null;
    link?: string | null;
    [key: string]: any;
  } | null;
};

export default function ReviewSessionBanner({
  baseline,
  mMSource,
}: Readonly<ReviewSessionBannerProps>) {
  const session = useFormSession();
  const { state } = useFeedForm();

  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);

  if (session.mode !== "review") {
    return null;
  }

  const reviewId = session.review.reviewId;
  const overallComment = session.review.overallComment;
  const hasComment = Boolean(overallComment && overallComment.trim().length > 0);

  // Source identification
  const title =
    mMSource?.title ||
    state.mMSourceDescription?.title ||
    baseline.mMSourceDescription?.title ||
    "Untitled MM Source";

  const rawLink =
    mMSource?.link ||
    state.mMSourceDescription?.link ||
    baseline.mMSourceDescription?.link;

  const permaLink = rawLink ? getIMSLPPermaLink(rawLink) || rawLink : null;

  // Composer resolution (from state pieces or baseline)
  const findComposerName = () => {
    const pieces = state.pieces?.length ? state.pieces : baseline.pieces || [];
    const persons = state.persons?.length ? state.persons : baseline.persons || [];

    if (pieces.length > 0 && pieces[0].composerId) {
      const composer = persons.find((p) => p.id === pieces[0].composerId);
      if (composer) {
        return `${composer.firstName} ${composer.lastName}`;
      }
    }

    return null;
  };

  const composerName = findComposerName();

  return (
    <div className="bg-warning/10 border border-warning/30 text-base-content rounded-lg p-4 mb-6 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Review badge + Source details & info message */}
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge badge-warning font-semibold text-xs uppercase tracking-wider">
              Review in progress
            </span>
            <h2 className="font-bold text-base md:text-lg inline-flex items-center gap-2">
              <span>{title}</span>
              {composerName && (
                <span className="text-sm font-normal text-base-content/70">
                  by {composerName}
                </span>
              )}
            </h2>
            {permaLink && (
              <a
                href={permaLink}
                target="_blank"
                rel="noopener noreferrer"
                className="link link-primary text-xs inline-flex items-center gap-1 ml-1"
                title="Open source link in new tab"
              >
                <span>[Source Link]</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-3.5 h-3.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                  />
                </svg>
              </a>
            )}
          </div>
          <p className="text-xs text-base-content/75">
            Modifications are saved in your local draft and will only be applied
            when you approve the review in the final summary.
          </p>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            className="btn btn-sm btn-outline gap-1.5"
            onClick={() => setIsDiffModalOpen(true)}
          >
            <EyeIcon className="w-4 h-4" />
            <span>View Changes</span>
          </button>

          <button
            type="button"
            className="btn btn-sm btn-outline gap-1.5 relative"
            onClick={() => setIsCommentModalOpen(true)}
          >
            <EditIcon className="w-4 h-4" />
            <span>General Comment</span>
            {hasComment && (
              <span className="badge badge-xs badge-primary absolute -top-1 -right-1 p-1">
                ✓
              </span>
            )}
          </button>

          <AbortReviewButton reviewId={reviewId} />
        </div>
      </div>

      {/* Modals */}
      <ReviewDiffModal
        isOpen={isDiffModalOpen}
        onClose={() => setIsDiffModalOpen(false)}
        baseline={baseline}
      />

      <OverallCommentModal
        isOpen={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
      />
    </div>
  );
}
