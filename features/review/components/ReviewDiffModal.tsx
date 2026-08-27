"use client";

import React, { useMemo } from "react";
import { createPortal } from "react-dom";
import { usePortal } from "@/hooks/usePortal";
import { useFeedForm } from "@/context/feedFormContext";
import { useFormSession } from "@/context/formSessionContext";
import { FeedFormState } from "@/types/feedFormTypes";
import { AuditLogItem } from "@/types/auditTypes";
import { composeAuditEntries } from "@/features/review/utils/auditCompose";
import AuditLogHeader from "@/features/audit/AuditLogHeader";
import AuditLogContent from "@/features/audit/AuditLogContent";

export type ReviewDiffModalProps = {
  isOpen: boolean;
  onClose: () => void;
  baseline: FeedFormState;
  title?: string;
};

export default function ReviewDiffModal({
  isOpen,
  onClose,
  baseline,
  title,
}: Readonly<ReviewDiffModalProps>) {
  const portalContainer = usePortal();
  const session = useFormSession();
  const { state } = useFeedForm();

  const reviewId =
    session.mode === "review" ? session.review.reviewId : "current-review";

  const diffItems: AuditLogItem[] = useMemo(() => {
    if (!isOpen || !baseline || !state) return [];
    try {
      const entries = composeAuditEntries(reviewId, baseline, state);
      const now = new Date().toISOString();
      return entries.map((entry, index) => ({
        id: `${entry.entityType}-${entry.entityId}-${entry.operation}-${index}`,
        reviewId,
        entityType: entry.entityType,
        entityId: entry.entityId,
        operation: entry.operation,
        before: entry.before ?? null,
        after: entry.after ?? null,
        authorId: null,
        createdAt: now,
        comment: null,
      }));
    } catch (e) {
      console.error("[ReviewDiffModal] Error composing audit entries:", e);
      return [];
    }
  }, [isOpen, baseline, state, reviewId]);

  if (!isOpen || !portalContainer) return null;

  const modalTitle =
    title || state.mMSourceDescription?.title || "Review Modifications";

  return createPortal(
    <dialog open className="modal modal-open">
      <div className="modal-box w-11/12 max-w-5xl max-h-[85vh] flex flex-col overflow-y-auto">
        <AuditLogHeader
          title={modalTitle}
          action={
            <button
              type="button"
              className="btn btn-sm"
              onClick={onClose}
            >
              Close
            </button>
          }
        />
        <AuditLogContent
          items={diffItems}
          nextCursor={null}
          loading={false}
          resetKey={reviewId}
          emptyLabel="No modifications detected."
        />
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
