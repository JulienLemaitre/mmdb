"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AdminListResponse, AdminReviewItem } from "@/types/adminTypes";
import { formatDate, formatPieceTitles } from "@/features/admin/formatters";

const PAGE_SIZE = 25;
const REVIEW_STATES = ["PENDING", "IN_REVIEW", "APPROVED", "ABORTED"] as const;

type Props = {
  onViewAuditLogAction?: (reviewId: string) => void;
};

export default function AdminReviewsTable({ onViewAuditLogAction }: Props) {
  const [items, setItems] = useState<AdminReviewItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [state, setState] = useState("");

  const fetchReviews = useCallback(
    async ({
      cursor,
      append,
    }: {
      cursor?: string | null;
      append?: boolean;
    }) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("limit", String(PAGE_SIZE));
        if (cursor) params.set("cursor", cursor);
        if (from) params.set("from", from);
        if (to) params.set("to", to);
        if (state) params.set("state", state);

        const res = await fetch(`/api/admin/reviews?${params.toString()}`);
        const data =
          (await res.json()) as AdminListResponse<AdminReviewItem> & {
            error?: string;
          };

        if (!res.ok) {
          throw new Error(data.error || "Failed to load reviews");
        }

        setItems((prev) => (append ? [...prev, ...data.items] : data.items));
        setNextCursor(data.nextCursor ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unexpected error");
      } finally {
        setLoading(false);
      }
    },
    [from, to, state],
  );

  useEffect(() => {
    fetchReviews({});
  }, [fetchReviews]);

  const handleLoadMore = () => {
    if (!nextCursor || loading) return;
    fetchReviews({ cursor: nextCursor, append: true });
  };

  const handleClearFilters = () => {
    setFrom("");
    setTo("");
    setState("");
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3 items-end">
        <label className="form-control">
          <span className="label-text">From</span>
          <input
            type="date"
            className="input input-bordered input-sm"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="form-control">
          <span className="label-text">To</span>
          <input
            type="date"
            className="input input-bordered input-sm"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <label className="form-control">
          <span className="label-text">Review state</span>
          <select
            className="select select-bordered select-sm"
            value={state}
            onChange={(e) => setState(e.target.value)}
          >
            <option value="">All</option>
            {REVIEW_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="btn btn-sm"
          onClick={handleClearFilters}
        >
          Clear
        </button>
      </div>

      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>Started</th>
              <th>Reviewer</th>
              <th>Source title</th>
              <th>Pieces</th>
              <th>Sections</th>
              <th>Review state</th>
              <th>Audit logs</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && !loading ? (
              <tr>
                <td colSpan={8} className="text-center text-sm text-gray-500">
                  No reviews found.
                </td>
              </tr>
            ) : null}
            {items.map((review) => (
              <tr key={review.id}>
                <td>{formatDate(review.startedAt)}</td>
                <td>
                  {review.reviewer?.name || review.reviewer?.email || "-"}
                </td>
                <td>{review.source?.title || "-"}</td>
                <td>{formatPieceTitles(review.source?.pieceTitles ?? [])}</td>
                <td>{review.source?.sectionCount ?? "-"}</td>
                <td>{review.state || "-"}</td>
                <td>{review.auditLogCount}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn-xs w-max"
                    onClick={() => onViewAuditLogAction?.(review.id)}
                  >
                    View audit log
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="btn btn-sm"
          onClick={handleLoadMore}
          disabled={!nextCursor || loading}
        >
          {loading ? "Loading..." : "Load more"}
        </button>
        {nextCursor ? null : (
          <span className="text-xs text-gray-500">End of results</span>
        )}
      </div>
    </div>
  );
}
