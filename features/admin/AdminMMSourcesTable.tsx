"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AdminListResponse, AdminMMSourceItem } from "@/types/adminTypes";
import { formatDate, formatPieceTitles } from "@/features/admin/formatters";

const PAGE_SIZE = 25;
const REVIEW_STATES = ["PENDING", "IN_REVIEW", "APPROVED", "ABORTED"] as const;

export default function AdminMMSourcesTable() {
  const [items, setItems] = useState<AdminMMSourceItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [reviewState, setReviewState] = useState("");

  const fetchSources = useCallback(
    async ({ cursor, append }: { cursor?: string | null; append?: boolean }) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("limit", String(PAGE_SIZE));
        if (cursor) params.set("cursor", cursor);
        if (from) params.set("from", from);
        if (to) params.set("to", to);
        if (reviewState) params.set("reviewState", reviewState);

        const res = await fetch(`/api/admin/mm-sources?${params.toString()}`);
        const data = (await res.json()) as AdminListResponse<AdminMMSourceItem> & {
          error?: string;
        };

        if (!res.ok) {
          throw new Error(data.error || "Failed to load MM Sources");
        }

        setItems((prev) => (append ? [...prev, ...data.items] : data.items));
        setNextCursor(data.nextCursor ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unexpected error");
      } finally {
        setLoading(false);
      }
    },
    [from, to, reviewState],
  );

  useEffect(() => {
    fetchSources({});
  }, [fetchSources]);

  const handleLoadMore = () => {
    if (!nextCursor || loading) return;
    fetchSources({ cursor: nextCursor, append: true });
  };

  const handleClearFilters = () => {
    setFrom("");
    setTo("");
    setReviewState("");
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
            value={reviewState}
            onChange={(e) => setReviewState(e.target.value)}
          >
            <option value="">All</option>
            {REVIEW_STATES.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="btn btn-sm" onClick={handleClearFilters}>
          Clear
        </button>
      </div>

      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>Created</th>
              <th>Author</th>
              <th>Source title</th>
              <th>Pieces</th>
              <th>Sections</th>
              <th>Review state</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && !loading ? (
              <tr>
                <td colSpan={6} className="text-center text-sm text-gray-500">
                  No MM Sources found.
                </td>
              </tr>
            ) : null}
            {items.map((source) => (
              <tr key={source.id}>
                <td>{formatDate(source.createdAt)}</td>
                <td>{source.author?.name || source.author?.email || "-"}</td>
                <td>{source.title || "-"}</td>
                <td>{formatPieceTitles(source.pieceTitles)}</td>
                <td>{source.sectionCount}</td>
                <td>{source.reviewState || "-"}</td>
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
