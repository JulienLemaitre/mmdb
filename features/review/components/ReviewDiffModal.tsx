"use client";

import React, { useMemo } from "react";
import { createPortal } from "react-dom";
import { usePortal } from "@/hooks/usePortal";
import { useFeedForm } from "@/context/feedFormContext";
import { FeedFormState } from "@/types/feedFormTypes";
import {
  ChangedField,
  computeChangedFieldPaths,
} from "@/features/review/reviewDiff";

export type ReviewDiffModalProps = {
  isOpen: boolean;
  onClose: () => void;
  baseline: FeedFormState;
};

export default function ReviewDiffModal({
  isOpen,
  onClose,
  baseline,
}: Readonly<ReviewDiffModalProps>) {
  const portalContainer = usePortal();
  const { state } = useFeedForm();

  const changedFields: ChangedField[] = useMemo(() => {
    if (!isOpen || !baseline || !state) return [];
    try {
      return computeChangedFieldPaths(baseline, state);
    } catch (e) {
      console.error("[ReviewDiffModal] Error computing changed field paths:", e);
      return [];
    }
  }, [isOpen, baseline, state]);

  if (!isOpen || !portalContainer) return null;

  return createPortal(
    <dialog open className="modal modal-open">
      <div className="modal-box w-11/12 max-w-4xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between pb-2 border-b border-base-200">
          <div>
            <h3 className="font-bold text-lg">Review Modifications</h3>
            <p className="text-xs text-base-content/70">
              Overview of changes made during this review compared to the
              original baseline.
            </p>
          </div>
          <span className="badge badge-outline">
            {changedFields.length} changed field
            {changedFields.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="py-4 flex-1 overflow-y-auto">
          {changedFields.length === 0 ? (
            <div className="alert bg-base-200 text-base-content my-4 p-4 rounded-lg flex items-center gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="stroke-info shrink-0 w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <div className="font-semibold">No modifications detected</div>
                <div className="text-xs opacity-80">
                  All fields currently match the original baseline. Any changes
                  you make in the steps will appear here.
                </div>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra table-sm w-full">
                <thead>
                  <tr>
                    <th className="w-1/4">Entity Type</th>
                    <th className="w-1/2">Field Path</th>
                    <th className="w-1/4">Entity ID</th>
                  </tr>
                </thead>
                <tbody>
                  {changedFields.map((field, idx) => (
                    <tr
                      key={`${field.entityType ?? "ENTITY"}-${field.fieldPath}-${field.entityId ?? idx}`}
                    >
                      <td>
                        <span className="badge badge-sm badge-ghost font-mono">
                          {field.entityType ?? "MM_SOURCE"}
                        </span>
                      </td>
                      <td className="font-mono text-xs text-primary">
                        {field.fieldPath}
                      </td>
                      <td className="font-mono text-xs text-base-content/60 truncate max-w-xs">
                        {field.entityId ?? "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="modal-action pt-2 border-t border-base-200">
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={onClose}
          >
            Close
          </button>
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
