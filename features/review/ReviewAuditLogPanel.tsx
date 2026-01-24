"use client";

import React, { useCallback, useEffect, useState } from "react";
import AuditLogHeader from "@/features/audit/AuditLogHeader";
import AuditLogContent from "@/features/audit/AuditLogContent";
import { AuditLogItem, AuditLogResult } from "@/types/auditTypes";
import { formatDateTime } from "@/features/admin/formatters";

const PAGE_SIZE = 50;

type Props = {
  reviewId: string;
  enabled?: boolean;
  children?: React.ReactNode;
};

export default function ReviewAuditLogPanel({
  reviewId,
  enabled = true,
  children,
}: Props) {
  const [items, setItems] = useState<AuditLogItem[]>([]);
  const [reviewMeta, setReviewMeta] = useState<AuditLogResult["review"]>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(
    async ({ cursor, append }: { cursor?: string | null; append?: boolean }) => {
      if (!enabled) return;
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("limit", String(PAGE_SIZE));
        if (cursor) params.set("cursor", cursor);

        const res = await fetch(
          `/api/review/${reviewId}/audit-logs?${params.toString()}`,
        );
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
    [reviewId, enabled],
  );

  useEffect(() => {
    if (!enabled) return;
    setItems([]);
    setNextCursor(null);
    setReviewMeta(null);
    fetchLogs({});
  }, [reviewId, enabled, fetchLogs]);

  const handleLoadMore = () => {
    if (!nextCursor || loading) return;
    fetchLogs({ cursor: nextCursor, append: true });
  };

  const headerTitle = reviewMeta?.sourceTitle || "Audit log";
  const headerAuthor = reviewMeta?.authorName || "-";
  const headerDate = reviewMeta?.date ? formatDateTime(reviewMeta.date) : "-";

  return (
    <div className="space-y-4">
      <AuditLogHeader
        title={headerTitle}
        subtitle={`${headerAuthor} · ${headerDate}`}
      />

      {children}

      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      <AuditLogContent
        items={items}
        nextCursor={nextCursor}
        loading={loading}
        onLoadMoreAction={handleLoadMore}
        resetKey={reviewId}
      />
    </div>
  );
}
