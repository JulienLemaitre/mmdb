"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { purgeReviewLocalDrafts } from "@/utils/localStorage";
import { GET_URL_API_REVIEW_ABORT, URL_REVIEW_LIST } from "@/utils/routes";
import { createPortal } from "react-dom";
import { usePortal } from "@/hooks/usePortal";

export type AbortReviewButtonProps = {
  reviewId: string;
};

export default function AbortReviewButton({
  reviewId,
}: Readonly<AbortReviewButtonProps>) {
  const router = useRouter();
  const portalContainer = usePortal();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleOpen = () => {
    setErrorMessage(null);
    setIsOpen(true);
  };

  const handleClose = () => {
    if (isLoading) return;
    setIsOpen(false);
    setErrorMessage(null);
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(GET_URL_API_REVIEW_ABORT(reviewId), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const msg =
          data?.error || `Failed to abort review (status: ${res.status})`;
        setErrorMessage(msg);
        setIsLoading(false);
        return;
      }

      // Successful abort: purge local drafts for this review and redirect to review list
      purgeReviewLocalDrafts(reviewId);
      setIsOpen(false);
      router.push(URL_REVIEW_LIST);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Network error while aborting review";
      setErrorMessage(msg);
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="btn btn-sm btn-outline btn-error"
        onClick={handleOpen}
      >
        Abort Review
      </button>

      {isOpen &&
        portalContainer &&
        createPortal(
          <dialog open className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg text-error">Abort Review</h3>
              <p className="py-3 text-sm">
                Are you sure you want to abort this review? All your local
                modifications and comments will be permanently discarded, and the
                source will return to the review queue.
              </p>

              {errorMessage && (
                <div className="alert alert-error text-sm my-3 p-3 rounded">
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="modal-action">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-error"
                  onClick={handleConfirm}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="loading loading-spinner loading-xs" />
                      Aborting...
                    </>
                  ) : (
                    "Confirm Abort"
                  )}
                </button>
              </div>
            </div>
            <form method="dialog" className="modal-backdrop">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
              >
                close
              </button>
            </form>
          </dialog>,
          portalContainer,
        )}
    </>
  );
}
