"use client";

import React, { useMemo, useState } from "react";
import { AuditLogItem } from "@/types/auditTypes";

const PAGE_SIZE_LABEL = "Load more";

type DiffStatus = "added" | "removed" | "changed" | "unchanged";

type DiffEntry = {
  path: string;
  beforeValue: any;
  afterValue: any;
  status: DiffStatus;
};

type Props = {
  items: AuditLogItem[];
  nextCursor: string | null;
  loading?: boolean;
  onLoadMoreAction?: () => void;
  resetKey?: string;
};

type ViewState = {
  resetKey?: string;
  openById: Record<string, boolean>;
  showUnchanged: boolean;
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

  if (Array.isArray(before) && Array.isArray(after)) {
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
    return [
      {
        path: path || "(value)",
        beforeValue: undefined,
        afterValue: after,
        status: "added",
      },
    ];
  }
  if (beforeExists && !afterExists) {
    return [
      {
        path: path || "(value)",
        beforeValue: before,
        afterValue: undefined,
        status: "removed",
      },
    ];
  }
  const status = areValuesEqual(before, after) ? "unchanged" : "changed";
  return [
    {
      path: path || "(value)",
      beforeValue: before,
      afterValue: after,
      status,
    },
  ];
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

export default function AuditLogContent({
  items,
  nextCursor,
  loading = false,
  onLoadMoreAction,
  resetKey,
}: Props) {
  const [viewState, setViewState] = useState<ViewState>({
    resetKey,
    openById: {},
    showUnchanged: false,
  });
  const withResetKey = (state: ViewState): ViewState =>
    state.resetKey === resetKey
      ? state
      : {
          resetKey,
          openById: {},
          showUnchanged: false,
        };
  const { openById, showUnchanged } = withResetKey(viewState);

  const handleExpandAll = () => {
    const expanded = Object.fromEntries(items.map((item) => [item.id, true]));
    setViewState((prev) => {
      const base = withResetKey(prev);
      return { ...base, openById: expanded };
    });
  };

  const handleCollapseAll = () => {
    setViewState((prev) => {
      const base = withResetKey(prev);
      return { ...base, openById: {} };
    });
  };

  const handleToggleRow = (id: string) => {
    setViewState((prev) => {
      const base = withResetKey(prev);
      return {
        ...base,
        openById: { ...base.openById, [id]: !base.openById[id] },
      };
    });
  };

  const diffCache = useMemo(() => {
    const cache = new Map<string, DiffEntry[]>();
    for (const item of items) {
      cache.set(item.id, buildDiffEntries(item.before, item.after));
    }
    return cache;
  }, [items]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap justify-end items-center gap-3">
        <label className="flex items-center gap-2 text-xs">
          <span>Show unchanged</span>
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            checked={showUnchanged}
            onChange={(e) => {
              const checked = e.target.checked;
              setViewState((prev) => {
                const base = withResetKey(prev);
                return { ...base, showUnchanged: checked };
              });
            }}
          />
        </label>
        <button type="button" className="btn btn-sm" onClick={handleExpandAll}>
          Expand all
        </button>
        <button type="button" className="btn btn-sm" onClick={handleCollapseAll}>
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
              const diffEntries = diffCache.get(item.id) ?? [];
              const visibleEntries = showUnchanged
                ? diffEntries
                : diffEntries.filter((entry) => entry.status !== "unchanged");
              return (
                <tr key={item.id}>
                  <td>
                    <span className="text-xs" title={item.entityId || undefined}>
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
                          <div className="text-xs font-semibold mb-1">Before</div>
                          <div className="space-y-1 font-mono text-xs">
                            {visibleEntries.length === 0 ? (
                              <div className="text-gray-400">No changes</div>
                            ) : (
                              visibleEntries.map((entry, index) => {
                                const status =
                                  entry.status === "added"
                                    ? "unchanged"
                                    : entry.status;
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
                                  entry.status === "removed"
                                    ? "unchanged"
                                    : entry.status;
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

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="btn btn-sm"
          onClick={onLoadMoreAction}
          disabled={!nextCursor || loading}
        >
          {loading ? "Loading..." : PAGE_SIZE_LABEL}
        </button>
        {nextCursor ? null : (
          <span className="text-xs text-gray-500">End of results</span>
        )}
      </div>
    </div>
  );
}
