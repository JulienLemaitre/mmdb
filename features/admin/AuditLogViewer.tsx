"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AuditLogItem, AuditLogResult } from "@/types/auditTypes";
import { formatDateTime } from "@/features/admin/formatters";
import AuditLogHeader from "@/features/audit/AuditLogHeader";
import AuditLogContent from "@/features/audit/AuditLogContent";

const PAGE_SIZE = 50;

type Props = {
  reviewId: string | null;
  onCloseAction: () => void;
};

export default function AuditLogViewer({ reviewId, onCloseAction }: Props) {
  const [items, setItems] = useState<AuditLogItem[]>([]);
  const [reviewMeta, setReviewMeta] = useState<AuditLogResult["review"]>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(
    async ({ cursor, append }: { cursor?: string | null; append?: boolean }) => {
      if (!reviewId) return;
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("reviewId", reviewId);
        params.set("limit", String(PAGE_SIZE));
        if (cursor) params.set("cursor", cursor);

        const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
        const data = (await res.json()) as AuditLogResult & { error?: string };

        if (!res.ok) {
          throw new Error(data.error || "Failed to load audit logs");
        }

        setItems((prev) => (append ? [...prev, ...data.items] : data.items));
        setNextCursor(data.nextCursor ?? null);
        if (!append) setReviewMeta(data.review ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unexpected error");
      } finally {
        setLoading(false);
      }
    },
    [reviewId],
  );

  useEffect(() => {
    if (!reviewId) return;
    setItems([]);
    setNextCursor(null);
    setReviewMeta(null);
    fetchLogs({});
  }, [reviewId, fetchLogs]);

  const handleLoadMore = () => {
    if (!nextCursor || loading) return;
    fetchLogs({ cursor: nextCursor, append: true });
  };

  if (!reviewId) return null;

  const headerTitle = reviewMeta?.sourceTitle || "Audit log";
  const headerAuthor = reviewMeta?.authorName || "-";
  const headerDate = reviewMeta?.date ? formatDateTime(reviewMeta.date) : "-";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-5xl rounded bg-base-100 p-4 shadow-lg max-h-[85vh] overflow-y-auto">
        <AuditLogHeader
          title={headerTitle}
          subtitle={`${headerAuthor} · ${headerDate}`}
          action={
            <button type="button" className="btn btn-sm" onClick={onCloseAction}>
              Close
            </button>
          }
        />

        {error ? <div className="text-sm text-red-600">{error}</div> : null}

        <AuditLogContent
          items={items}
          nextCursor={nextCursor}
          loading={loading}
          onLoadMoreAction={handleLoadMore}
          resetKey={reviewId}
        />
      </div>
    </div>
  );
}
