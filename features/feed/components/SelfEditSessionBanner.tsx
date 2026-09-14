"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormSession } from "@/context/formSessionContext";
import { useFeedForm } from "@/context/feedFormContext";
import { FeedFormState } from "@/types/feedFormTypes";
import ReviewDiffModal from "@/features/review/components/ReviewDiffModal";
import EyeIcon from "@/ui/svg/EyeIcon";
import getIMSLPPermaLink from "@/utils/getIMSLPPermaLink";
import { URL_DASHBOARD } from "@/utils/routes";

export type SelfEditSessionBannerProps = {
  baseline: FeedFormState;
  mMSource?: {
    id: string;
    title?: string | null;
    link?: string | null;
    [key: string]: any;
  } | null;
};

export default function SelfEditSessionBanner({
  baseline,
  mMSource,
}: Readonly<SelfEditSessionBannerProps>) {
  const router = useRouter();
  const session = useFormSession();
  const { state } = useFeedForm();
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);

  if (session.mode !== "self-source-edit") {
    return null;
  }

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
    const persons =
      state.persons?.length ? state.persons : baseline.persons || [];

    if (pieces.length > 0 && pieces[0].composerId) {
      const composer = persons.find((p) => p.id === pieces[0].composerId);
      if (composer) {
        return `${composer.firstName} ${composer.lastName}`;
      }
    }

    return null;
  };

  const composerName = findComposerName();

  const handleConfirmCancel = () => {
    setIsCancelModalOpen(false);
    router.push(URL_DASHBOARD);
  };

  return (
    <div className="bg-info/10 border border-info/30 text-base-content rounded-lg p-4 mb-6 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Self-edit badge + Source details & info message */}
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge badge-info font-semibold text-xs uppercase tracking-wider text-white">
              Self-edit in progress
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
            You are editing your submitted MM Source. Modifications are saved in
            your local draft until you save them in the final summary step.
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
            className="btn btn-sm btn-outline btn-neutral"
            onClick={() => setIsCancelModalOpen(true)}
          >
            Cancel & Return to Dashboard
          </button>
        </div>
      </div>

      {/* Modals */}
      <ReviewDiffModal
        isOpen={isDiffModalOpen}
        onClose={() => setIsDiffModalOpen(false)}
        baseline={baseline}
        title={title}
      />

      {/* Confirmation Modal */}
      {isCancelModalOpen && (
        <dialog open className="modal modal-open">
          <div className="modal-box max-w-md">
            <h3 className="font-bold text-lg">Leave Editing Session?</h3>
            <p className="py-4 text-sm text-base-content/80">
              Are you sure you want to return to your dashboard? Any unsaved
              modifications in your local draft will remain saved on this device
              until you submit or clear them.
            </p>
            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setIsCancelModalOpen(false)}
              >
                Stay
              </button>
              <button
                type="button"
                className="btn btn-neutral"
                onClick={handleConfirmCancel}
              >
                Return to Dashboard
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button
              type="button"
              onClick={() => setIsCancelModalOpen(false)}
            >
              close
            </button>
          </form>
        </dialog>
      )}
    </div>
  );
}
