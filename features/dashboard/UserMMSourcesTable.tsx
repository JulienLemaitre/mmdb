"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MMSourceFull } from "@/types/dbTypes";
import { TempoIndication } from "@/types/prismaSelections";
import MMSourceSummary from "@/features/explore/MMSourceSummary";
import getPersonName from "@/utils/getPersonName";
import { GET_URL_SOURCE_EDIT, URL_FEED } from "@/utils/routes";

export type UserMMSourceItem = {
  source: MMSourceFull;
  hasActiveReview: boolean;
};

export default function UserMMSourcesTable({
  items,
  tempoIndications,
}: {
  items: UserMMSourceItem[];
  tempoIndications: TempoIndication[];
}) {
  const router = useRouter();
  const [detailsSource, setDetailsSource] = useState<MMSourceFull | null>(null);
  const [confirmEditSource, setConfirmEditSource] =
    useState<MMSourceFull | null>(null);

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderStatusBadge = (reviewState: string, hasActiveReview: boolean) => {
    if (hasActiveReview || reviewState === "IN_REVIEW") {
      return (
        <span className="badge badge-info text-xs font-semibold">
          In Review
        </span>
      );
    }
    switch (reviewState) {
      case "PENDING":
        return (
          <span className="badge badge-warning text-xs font-semibold">
            Pending
          </span>
        );
      case "APPROVED":
        return (
          <span className="badge badge-success text-white text-xs font-semibold">
            Approved
          </span>
        );
      case "ABORTED":
        return (
          <span className="badge badge-error text-white text-xs font-semibold">
            Aborted
          </span>
        );
      default:
        return <span className="badge badge-ghost text-xs">{reviewState}</span>;
    }
  };

  if (!items || items.length === 0) {
    return (
      <div className="bg-base-100 rounded-xl border border-base-200 p-8 text-center space-y-4">
        <h3 className="text-lg font-medium text-base-content/80">
          You haven&apos;t entered any MM Sources yet.
        </h3>
        <p className="text-sm text-base-content/60 max-w-md mx-auto">
          Start contributing metronome mark records to the database by entering
          a new source.
        </p>
        <Link href={URL_FEED} className="btn btn-primary">
          Enter new Metronome Marks data
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto bg-base-100 rounded-xl border border-base-200 shadow-sm">
        <table className="table table-zebra w-full">
          <thead>
            <tr className="bg-base-200/50 text-sm">
              <th>Source Title</th>
              <th>Pieces & Composers</th>
              <th className="text-center">MMs</th>
              <th className="text-center">Sections</th>
              <th>Review Status</th>
              <th>Created Date</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(({ source, hasActiveReview }) => {
              const pieceTitles = Array.from(
                new Set(
                  source.pieceVersions
                    .map((pvs) => pvs.pieceVersion?.piece?.title)
                    .filter((title): title is string => Boolean(title)),
                ),
              );

              const composerNames = Array.from(
                new Set(
                  source.pieceVersions
                    .map((pvs) =>
                      pvs.pieceVersion?.piece?.composer
                        ? getPersonName(pvs.pieceVersion.piece.composer)
                        : null,
                    )
                    .filter((name): name is string => Boolean(name)),
                ),
              );

              const sectionCount = source.pieceVersions.reduce((acc, pvs) => {
                return (
                  acc +
                  pvs.pieceVersion.movements.reduce(
                    (mAcc, mv) => mAcc + mv.sections.length,
                    0,
                  )
                );
              }, 0);

              const isPending = source.reviewState === "PENDING";
              const canEdit = isPending && !hasActiveReview;

              const disabledTooltip =
                hasActiveReview || source.reviewState === "IN_REVIEW"
                  ? "A review is currently in progress on this MM Source."
                  : source.reviewState === "APPROVED"
                    ? "This MM Source has already been approved and cannot be edited."
                    : source.reviewState === "ABORTED"
                      ? "This MM Source review was aborted."
                      : "This MM Source cannot be edited.";

              return (
                <tr key={source.id} className="hover hover:bg-base-200">
                  <td className="font-semibold text-base-content max-w-xs">
                    <div
                      className="truncate"
                      title={source.title || "Untitled"}
                    >
                      {source.title || "Untitled"}
                    </div>
                    {source.year ? (
                      <span className="text-xs text-base-content/60 font-normal">
                        Year: {source.year}
                      </span>
                    ) : null}
                  </td>
                  <td className="max-w-sm">
                    <div
                      className="truncate text-sm font-medium"
                      title={pieceTitles.join(", ") || "—"}
                    >
                      {pieceTitles.join(", ") || "—"}
                    </div>
                    <div
                      className="truncate text-xs text-base-content/60"
                      title={composerNames.join(", ") || "—"}
                    >
                      {composerNames.join(", ") || "—"}
                    </div>
                  </td>
                  <td className="text-center font-mono font-medium text-sm">
                    {source.metronomeMarks.length}
                  </td>
                  <td className="text-center font-mono font-medium text-sm">
                    {sectionCount}
                  </td>
                  <td>
                    {renderStatusBadge(source.reviewState, hasActiveReview)}
                  </td>
                  <td className="text-sm text-base-content/70 whitespace-nowrap">
                    {formatDate(source.createdAt)}
                  </td>
                  <td className="text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost border border-base-300"
                        onClick={() => setDetailsSource(source)}
                      >
                        View Details
                      </button>

                      {canEdit ? (
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => setConfirmEditSource(source)}
                        >
                          Edit Source
                        </button>
                      ) : (
                        <div
                          className="tooltip tooltip-left"
                          data-tip={disabledTooltip}
                        >
                          <button
                            type="button"
                            className="btn btn-sm btn-disabled"
                            disabled
                          >
                            Edit Source
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Details Modal */}
      {detailsSource && (
        <dialog className="modal modal-open">
          <div className="modal-box w-11/12 max-w-5xl max-h-[90vh] flex flex-col p-6">
            <div className="flex items-center justify-between pb-3 border-b border-base-200 mb-4">
              <h3 className="font-bold text-lg text-primary">
                Source Details — {detailsSource.title || "Untitled"}
              </h3>
              <button
                type="button"
                className="btn btn-sm btn-circle btn-ghost"
                onClick={() => setDetailsSource(null)}
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto flex-1 pr-1">
              <MMSourceSummary
                mMSource={detailsSource}
                tempoIndicationList={tempoIndications}
              />
            </div>
            <div className="modal-action border-t border-base-200 pt-3 mt-4">
              <button
                type="button"
                className="btn btn-neutral"
                onClick={() => setDetailsSource(null)}
              >
                Close
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button type="button" onClick={() => setDetailsSource(null)}>
              close
            </button>
          </form>
        </dialog>
      )}

      {/* Edit Confirmation Modal */}
      {confirmEditSource && (
        <dialog className="modal modal-open">
          <div className="modal-box max-w-md">
            <h3 className="font-bold text-lg">Edit MM Source</h3>
            <p className="py-4 text-sm text-base-content/80">
              You are about to edit{" "}
              <strong>{confirmEditSource.title || "this MM Source"}</strong>.
              Changes will be saved in your draft until submitted. Continue?
            </p>
            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setConfirmEditSource(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const id = confirmEditSource.id;
                  setConfirmEditSource(null);
                  router.push(GET_URL_SOURCE_EDIT(id));
                }}
              >
                Continue to Edit
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button type="button" onClick={() => setConfirmEditSource(null)}>
              close
            </button>
          </form>
        </dialog>
      )}
    </div>
  );
}
