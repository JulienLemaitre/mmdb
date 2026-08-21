"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { usePortal } from "@/hooks/usePortal";
import { useFormSession } from "@/context/formSessionContext";

export type OverallCommentModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function OverallCommentModal({
  isOpen,
  onClose,
}: Readonly<OverallCommentModalProps>) {
  const portalContainer = usePortal();
  const session = useFormSession();
  const currentComment =
    session.mode === "review" ? session.review.overallComment : null;

  const [commentText, setCommentText] = useState<string>(currentComment ?? "");
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setCommentText(currentComment ?? "");
    }
  }

  const handleSave = () => {
    if (session.mode === "review") {
      const trimmed = commentText.trim();
      session.setOverallComment(trimmed.length > 0 ? trimmed : null);
    }
    onClose();
  };

  const handleClear = () => {
    setCommentText("");
  };

  if (!isOpen || !portalContainer) return null;

  return createPortal(
    <dialog open className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <h3 className="font-bold text-lg">General Review Comment</h3>
        <p className="py-2 text-sm text-base-content/80">
          You can add an overall comment or notes for this review session at any
          time. It will be submitted along with your review decision.
        </p>

        <div className="form-control my-4">
          <textarea
            className="textarea textarea-bordered h-36 w-full text-base"
            placeholder="Write your review notes or general comments here..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            autoFocus
          />
        </div>

        <div className="modal-action flex items-center justify-between">
          <div>
            {commentText.length > 0 && (
              <button
                type="button"
                className="btn btn-sm btn-ghost text-error"
                onClick={handleClear}
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={handleSave}
            >
              Save Comment
            </button>
          </div>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={onClose}>
          close
        </button>
      </form>
    </dialog>,
    portalContainer,
  );
}
