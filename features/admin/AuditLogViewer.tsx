"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AdminAuditItem, AdminAuditResult } from "@/types/adminTypes";
import { formatDateTime } from "@/features/admin/formatters";

const PAGE_SIZE = 50;

type DiffStatus = "added" | "removed" | "changed" | "unchanged";

type Props = {
  reviewId: string | null;
  onCloseAction: () => void;
};

type DiffEntry = {
  path: string;
  beforeValue: any;
  afterValue: any;
  status: DiffStatus;
};

function formatValue(value: any): string {
  if (value === undefined) return "-";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function isPlainObject(value: any): value is Record<string, any> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function safeStringify(value: any): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function areValuesEqual(a: any, b: any): boolean {
  return safeStringify(a) === safeStringify(b);
}

function buildDiffEntries(before: any, after: any, path = ""): DiffEntry[] {
  if (before === undefined && after === undefined) return [];

  const beforeIsArray = Array.isArray(before);
  const afterIsArray = Array.isArray(after);
  if (beforeIsArray && afterIsArray) {
    const max = Math.max(before.length, after.length);
    const entries: DiffEntry[] = [];
    for (let i = 0; i < max; i += 1) {
      const nextPath = path ? `${path}[${i}]` : `[${i}]`;
      entries.push(...buildDiffEntries(before[i], after[i], nextPath));
    }
    return entries;
  }

  if (isPlainObject(before) && isPlainObject(after)) {
    const beforeKeys = Object.keys(before);
    const afterKeys = Object.keys(after);
    const afterOnly = afterKeys.filter((key) => !beforeKeys.includes(key));
    const orderedKeys = [...beforeKeys, ...afterOnly];
    const entries: DiffEntry[] = [];
    for (const key of orderedKeys) {
      const nextPath = path ? `${path}.${key}` : key;
      entries.push(...buildDiffEntries(before[key], after[key], nextPath));
    }
    return entries;
  }

  const beforeExists = before !== undefined;
  const afterExists = after !== undefined;
  if (!beforeExists && afterExists) {
    return [{ path: path || "(value)", beforeValue: undefined, afterValue: after, status: "added" }];
  }
  if (beforeExists && !afterExists) {
    return [{ path: path || "(value)", beforeValue: before, afterValue: undefined, status: "removed" }];
  }
  const status = areValuesEqual(before, after) ? "unchanged" : "changed";
  return [{ path: path || "(value)", beforeValue: before, afterValue: after, status }];
}

function getStatusClass(status: DiffStatus): string {
  switch (status) {
    case "added":
      return "bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-100";
    case "removed":
      return "bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-100";
    case "changed":
      return "bg-yellow-100 text-yellow-900 dark:bg-yellow-900/40 dark:text-yellow-100";
    default:
      return "";
  }
}

function formatEntityType(value: string): string {
  if (!value) return "-";
  return value
    .split("_")
    .map((part) => {
      if (part === "MM") return "MM";
      if (!part) return part;
      return `${part[0]}${part.slice(1).toLowerCase()}`;
    })
    .join("_");
}

export default function AuditLogViewer({ reviewId, onCloseAction }: Props) {
  const [items, setItems] = useState<AdminAuditItem[]>([]);
  const [reviewMeta, setReviewMeta] = useState<AdminAuditResult["review"]>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [openById, setOpenById] = useState<Record<string, boolean>>({});
  const [showUnchanged, setShowUnchanged] = useState(false);
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
        const data = (await res.json()) as AdminAuditResult & { error?: string };

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
    setOpenById({});
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

  const handleExpandAll = () => {
    const expanded = Object.fromEntries(items.map((item) => [item.id, true]));
    setOpenById(expanded);
  };

  const handleCollapseAll = () => {
    setOpenById({});
  };

  const handleToggleRow = (id: string) => {
    setOpenById((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-5xl rounded bg-base-100 p-4 shadow-lg max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">{headerTitle}</h3>
            <div className="text-xs text-gray-500">
              {headerAuthor} · {headerDate}
            </div>
          </div>
          <button type="button" className="btn btn-sm" onClick={onCloseAction}>
            Close
          </button>
        </div>

        {error ? <div className="text-sm text-red-600">{error}</div> : null}

        <div className="flex flex-wrap justify-end items-center gap-3 mb-2">
          <label className="flex items-center gap-2 text-xs">
            <span>Show unchanged</span>
            <input
              type="checkbox"
              className="checkbox checkbox-sm"
              checked={showUnchanged}
              onChange={(e) => setShowUnchanged(e.target.checked)}
            />
          </label>
          <button type="button" className="btn btn-sm" onClick={handleExpandAll}>
            Expand all
          </button>
          <button
            type="button"
            className="btn btn-sm"
            onClick={handleCollapseAll}
          >
            Collapse all
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Entity</th>
                <th>Operation</th>
                <th>Changes</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && !loading ? (
                <tr>
                  <td colSpan={3} className="text-center text-sm text-gray-500">
                    No audit logs found.
                  </td>
                </tr>
              ) : null}
              {items.map((item) => {
                const diffEntries = buildDiffEntries(item.before, item.after);
                const visibleEntries = showUnchanged
                  ? diffEntries
                  : diffEntries.filter((entry) => entry.status !== "unchanged");
                return (
                  <tr key={item.id}>
                  <td>
                    <span
                      className="text-xs"
                      title={item.entityId || undefined}
                    >
                      {formatEntityType(item.entityType)}
                    </span>
                  </td>
                  <td>{item.operation}</td>
                  <td>
                    <details open={!!openById[item.id]}>
                      <summary
                        className="cursor-pointer text-xs text-blue-600"
                        onClick={(event) => {
                          event.preventDefault();
                          handleToggleRow(item.id);
                        }}
                      >
                        Before / After
                      </summary>
                      <div className="mt-2 grid gap-3 md:grid-cols-2">
                        <div>
                          <div className="text-xs font-semibold mb-1">
                            Before
                          </div>
                          <div className="space-y-1 font-mono text-xs">
                            {visibleEntries.length === 0 ? (
                              <div className="text-gray-400">No changes</div>
                            ) : (
                              visibleEntries.map((entry, index) => {
                                const status =
                                  entry.status === "added" ? "unchanged" : entry.status;
                                const value =
                                  entry.status === "added"
                                    ? "-"
                                    : formatValue(entry.beforeValue);
                                return (
                                  <div
                                    key={`${item.id}-before-${index}`}
                                    className={`rounded px-2 py-1 whitespace-pre-wrap ${getStatusClass(status)}`}
                                  >
                                    {`${entry.path}: ${value}`}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-semibold mb-1">After</div>
                          <div className="space-y-1 font-mono text-xs">
                            {visibleEntries.length === 0 ? (
                              <div className="text-gray-400">No changes</div>
                            ) : (
                              visibleEntries.map((entry, index) => {
                                const status =
                                  entry.status === "removed" ? "unchanged" : entry.status;
                                const value =
                                  entry.status === "removed"
                                    ? "-"
                                    : formatValue(entry.afterValue);
                                return (
                                  <div
                                    key={`${item.id}-after-${index}`}
                                    className={`rounded px-2 py-1 whitespace-pre-wrap ${getStatusClass(status)}`}
                                  >
                                    {`${entry.path}: ${value}`}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </div>
                    </details>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex items-center gap-3">
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
    </div>
  );
}
