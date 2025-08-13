"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { ChecklistEntityType } from "@/utils/ReviewChecklistSchema";

type ChecklistItem = {
  entityType: ChecklistEntityType;
  entityId: string;
  fieldPath: string;
  label: string;
  required: boolean;
};

type OverviewResponse = {
  reviewId: string;
  mmSourceId: string;
  graph: {
    id: string;
    title: string | null;
    link: string;
    permalink: string;
    year: number;
    comment: string | null;
  };
  exclusions: Record<string, string[]>;
  checklist: ChecklistItem[];
  counts: { totalItems: number };
};

// Minimal working copy persisted in localStorage; forms will mutate this later.
// For the foundation, we at least persist the overview graph as the initial working copy.
type WorkingCopy = {
  graph: OverviewResponse["graph"];
  updatedAt: string; // ISO timestamp of last local update
};

function storageKey(reviewId: string) {
  return `review:${reviewId}:checklist`;
}
function workingCopyKey(reviewId: string) {
  return `review:${reviewId}:workingCopy`;
}

function encodeKey(it: ChecklistItem) {
  return `${it.entityType}:${it.entityId}:${it.fieldPath}`;
}

export default function ChecklistPage() {
  const params = useParams();
  const router = useRouter();
  const reviewId = (params?.reviewId as string) ?? "";

  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkedKeys, setCheckedKeys] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [aborting, setAborting] = useState(false);
  const [abortError, setAbortError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  // Load overview
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`/api/review/${reviewId}/overview`, {
          cache: "no-store",
        });
        if (!res.ok) {
          // On auth/ownership/state errors, redirect back to the list per specs
          if (res.status === 401) {
            router.push("/login");
            return;
          }
          if (res.status === 400 || res.status === 403 || res.status === 404) {
            router.push("/review");
            return;
          }
          const j = await res.json().catch(() => ({}));
          throw new Error(j?.error || `Failed to load (status ${res.status})`);
        }
        const j = (await res.json()) as OverviewResponse;
        if (!mounted) return;
        setData(j);
        // Restore saved checked state
        const raw = localStorage.getItem(storageKey(j.reviewId));
        if (raw) {
          try {
            const arr = JSON.parse(raw) as string[];
            setCheckedKeys(new Set(arr));
          } catch {
            // ignore
          }
        }
        // Initialize working copy if absent
        const wcKey = workingCopyKey(j.reviewId);
        const wcRaw = localStorage.getItem(wcKey);
        if (!wcRaw) {
          const wc: WorkingCopy = { graph: j.graph, updatedAt: new Date().toISOString() };
          localStorage.setItem(wcKey, JSON.stringify(wc));
        }
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || String(e));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (reviewId) load();
    return () => {
      mounted = false;
    };
  }, [reviewId, reloadNonce]);

  // Persist changes in localStorage
  useEffect(() => {
    if (!data) return;
    localStorage.setItem(storageKey(data.reviewId), JSON.stringify(Array.from(checkedKeys)));
  }, [checkedKeys, data]);

  const totals = useMemo(() => {
    const totalRequired = data?.checklist.filter((i) => i.required).length ?? 0;
    const checkedRequired = data?.checklist.filter((i) => i.required && checkedKeys.has(encodeKey(i))).length ?? 0;
    const pct = totalRequired === 0 ? 0 : Math.round((checkedRequired / totalRequired) * 100);
    return { totalRequired, checkedRequired, pct };
  }, [data, checkedKeys]);

  function toggle(item: ChecklistItem) {
    const key = encodeKey(item);
    setCheckedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function resetItem(item: ChecklistItem) {
    // Placeholder for: user edited a field -> reset its check
    const key = encodeKey(item);
    setCheckedKeys((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }

  if (loading) return <div className="p-6">Loading checklist…</div>;
  if (error)
    return (
      <div className="p-6 space-y-3">
        <div className="text-red-600">{error}</div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="px-3 py-1 rounded border"
            onClick={() => {
              setError(null);
              setReloadNonce((n) => n + 1);
            }}
          >
            Retry
          </button>
          <button
            type="button"
            className="px-3 py-1 rounded border"
            onClick={() => router.push("/review")}
          >
            Back to list
          </button>
        </div>
      </div>
    );
  if (!data) return <div className="p-6">No data</div>;

  const allItems = data.checklist;
  const requiredItems = allItems.filter((i) => i.required);
  const submitDisabled = submitting || totals.totalRequired === 0 || totals.checkedRequired < totals.totalRequired;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Review checklist</h1>
          <p className="text-sm opacity-80">Review ID: {data.reviewId}</p>
        </div>
        <div className="text-sm">
          <Link className="underline" href={`/review`}>
            Back to list
          </Link>
        </div>
      </div>

      <div className="rounded border p-4 space-y-2">
        <div className="font-medium">Source</div>
        <div className="text-sm">Title: {data.graph.title ?? "(no title)"}</div>
        <div className="text-sm">
          Link: <a className="underline" href={data.graph.link} target="_blank" rel="noreferrer">open</a>
        </div>
        <div className="text-sm">
          Permalink: <a className="underline" href={data.graph.permalink} target="_blank" rel="noreferrer">open</a>
        </div>
      </div>

      <div className="rounded border p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="font-medium">Progress</div>
          <div className="text-sm">
            {totals.checkedRequired} / {totals.totalRequired} required checks ({totals.pct}%)
          </div>
        </div>
        <div className="w-full h-3 bg-gray-200 rounded">
          <div className="h-3 bg-green-500 rounded" style={{ width: `${totals.pct}%` }} />
        </div>
      </div>

      <div className="rounded border p-4 space-y-4">
        <div className="font-medium">Checklist items</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {requiredItems.map((it) => {
            const key = encodeKey(it);
            const isChecked = checkedKeys.has(key);
            return (
              <label key={key} className="flex items-start gap-2 border rounded p-3">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggle(it)}
                  className="mt-1"
                />
                <span className="text-sm">
                  <span className="font-medium">{it.label}</span>
                  <span className="opacity-60"> — {it.entityType}</span>
                  <span className="block opacity-60">path: {it.fieldPath}</span>
                  <button
                    type="button"
                    className="mt-1 text-blue-600 underline"
                    onClick={() => resetItem(it)}
                    title="Open edit form (placeholder); resets check"
                  >
                    Edit (placeholder)
                  </button>
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {submitError && (
          <div className="text-sm text-red-600">{submitError}</div>
        )}
        {abortError && (
          <div className="text-sm text-red-600">{abortError}</div>
        )}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className={`px-4 py-2 rounded ${submitDisabled ? "bg-gray-300 cursor-not-allowed" : "bg-green-600 text-white"}`}
            disabled={submitDisabled}
            onClick={async () => {
              if (!data) return;
              try {
                setSubmitError(null);
                setSubmitting(true);
                const requiredItemsChecked = requiredItems
                  .filter((it) => checkedKeys.has(encodeKey(it)))
                  .map((it) => ({
                    entityType: it.entityType,
                    entityId: it.entityId,
                    fieldPath: it.fieldPath,
                    checked: true,
                  }));
                const res = await fetch(`/api/review/${data.reviewId}/submit`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ checklistState: requiredItemsChecked, overallComment: null }),
                });
                if (!res.ok) {
                  const j = await res.json().catch(() => ({}));
                  throw new Error(j?.error || `Submit failed (status ${res.status})`);
                }
                // Clear local state and navigate back to list
                localStorage.removeItem(storageKey(data.reviewId));
                localStorage.removeItem(workingCopyKey(data.reviewId));
                setCheckedKeys(new Set());
                router.push("/feed");
              } catch (e: any) {
                setSubmitError(e?.message || String(e));
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {submitting ? "Submitting…" : "Submit review"}
          </button>
          <button
            type="button"
            className={`px-4 py-2 rounded border ${aborting ? "opacity-60 cursor-not-allowed" : ""}`}
            disabled={aborting}
            onClick={async () => {
              if (!data) return;
              const ok = window.confirm("Abort this review? This will discard your local progress and release the lock.");
              if (!ok) return;
              try {
                setAbortError(null);
                setAborting(true);
                const res = await fetch(`/api/review/${data.reviewId}/abort`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({}),
                });
                if (!res.ok) {
                  const j = await res.json().catch(() => ({}));
                  throw new Error(j?.error || `Abort failed (status ${res.status})`);
                }
                localStorage.removeItem(storageKey(data.reviewId));
                localStorage.removeItem(workingCopyKey(data.reviewId));
                setCheckedKeys(new Set());
                router.push("/feed");
              } catch (e: any) {
                setAbortError(e?.message || String(e));
              } finally {
                setAborting(false);
              }
            }}
          >
            {aborting ? "Aborting…" : "Abort review"}
          </button>
        </div>
      </div>
    </div>
  );
}
