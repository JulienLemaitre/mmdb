"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChecklistEntityType,
  expandRequiredChecklistItems,
  type RequiredChecklistItem,
} from "@/utils/ReviewChecklistSchema";
import { URL_REVIEW_LIST } from "@/utils/routes";

// API payload shape from /api/review/[reviewId]/overview
type ApiOverview = {
  reviewId: string;
  graph: any; // ChecklistGraph-like
  globallyReviewed: {
    personIds: string[];
    organizationIds: string[];
    collectionIds: string[];
    pieceIds: string[];
  };
  sourceContents: Array<{
    joinId: string;
    mMSourceId: string;
    pieceVersionId: string;
    rank: number;
    pieceId: string;
    collectionId?: string;
    collectionRank?: number;
  }>;
  progress: {
    source: { required: number; checked: number };
    perCollection: Record<string, { required: number; checked: number }>;
    perPiece: Record<string, { required: number; checked: number }>;
  };
};

// Minimal working copy persisted in localStorage; future forms will mutate this.
// Initialize from the overview's graph for now.
type ReviewWorkingCopy = {
  graph: any;
  updatedAt: string; // ISO timestamp
};

function storageKey(reviewId: string) {
  return `review:${reviewId}:checklist`;
}
function reviewWorkingCopyKey(reviewId: string) {
  return `review:${reviewId}:workingCopy`;
}

function encodeKey(it: { entityType: ChecklistEntityType; entityId?: string | null; fieldPath: string }) {
  return `${it.entityType}:${it.entityId ?? ""}:${it.fieldPath}`;
}

const ENTITY_BADGE: Record<ChecklistEntityType, string> = {
  MM_SOURCE: "badge-info",
  COLLECTION: "badge-warning",
  PIECE: "badge-accent",
  PIECE_VERSION: "badge-accent",
  MOVEMENT: "badge-primary",
  SECTION: "badge-secondary",
  TEMPO_INDICATION: "badge-secondary",
  METRONOME_MARK: "badge-primary",
  REFERENCE: "badge-neutral",
  CONTRIBUTION: "badge-neutral",
  PERSON: "badge-neutral",
  ORGANIZATION: "badge-neutral",
};

export default function ChecklistPage() {
  const params = useParams();
  const router = useRouter();
  const reviewId = (params?.reviewId as string) ?? "";

  const [data, setData] = useState<ApiOverview | null>(null);
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
          if (res.status === 401) {
            router.push("/login");
            return;
          }
          if (res.status === 400 || res.status === 403 || res.status === 404) {
            router.push(URL_REVIEW_LIST);
            return;
          }
          const j = await res.json().catch(() => ({}));
          throw new Error(j?.error || `Failed to load (status ${res.status})`);
        }
        const j = (await res.json()) as ApiOverview;
        if (!mounted) return;
        setData(j);
        // Restore saved checked state
        const raw = localStorage.getItem(storageKey(j.reviewId));
        if (raw) {
          try {
            const arr = JSON.parse(raw) as string[];
            setCheckedKeys(new Set(arr));
          } catch {
            // ignore broken storage
          }
        }
        // Initialize working copy if absent
        const rwcKey = reviewWorkingCopyKey(j.reviewId);
        const rwcRaw = localStorage.getItem(rwcKey);
        if (!rwcRaw) {
          const rwc: ReviewWorkingCopy = {
            graph: j.graph,
            updatedAt: new Date().toISOString(),
          };
          localStorage.setItem(rwcKey, JSON.stringify(rwc));
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
  }, [reviewId, reloadNonce, router]);

  // Persist changes in localStorage
  useEffect(() => {
    if (!data) return;
    localStorage.setItem(storageKey(data.reviewId), JSON.stringify(Array.from(checkedKeys)));
  }, [checkedKeys, data]);

  const requiredItems: RequiredChecklistItem[] = useMemo(() => {
    if (!data) return [];
    const g = data.graph;
    const gr = data.globallyReviewed;
    const items = expandRequiredChecklistItems(g, {
      globallyReviewed: {
        personIds: new Set(gr?.personIds ?? []),
        organizationIds: new Set(gr?.organizationIds ?? []),
        collectionIds: new Set(gr?.collectionIds ?? []),
        pieceIds: new Set(gr?.pieceIds ?? []),
      },
    });
    return items;
  }, [data]);

  const totals = useMemo(() => {
    const totalRequired = requiredItems.length;
    const checkedRequired = requiredItems.filter((i) => checkedKeys.has(encodeKey(i))).length;
    const pct = totalRequired === 0 ? 0 : Math.round((checkedRequired / totalRequired) * 100);
    return { totalRequired, checkedRequired, pct };
  }, [requiredItems, checkedKeys]);

  function toggle(item: RequiredChecklistItem) {
    const key = encodeKey(item);
    setCheckedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  if (loading) return <div className="p-6">Loading checklist…</div>;
  if (error)
    return (
      <div className="p-6 space-y-3">
        <div className="text-error">{error}</div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="btn btn-neutral btn-sm"
            onClick={() => {
              setError(null);
              setReloadNonce((n) => n + 1);
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  if (!data) return <div className="p-6">No data</div>;

  const submitDisabled =
    submitting || totals.totalRequired === 0 || totals.checkedRequired < totals.totalRequired;

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Piece Review Checklist</h1>
          <p className="text-sm opacity-80">Review ID: {data.reviewId}</p>
        </div>
      </div>

      <div className="card bg-info/10 p-4">
        <div className="font-medium mb-1">Source</div>
        <div className="text-sm">Title: {data.graph.source?.title ?? "(no title)"}</div>
        <div className="text-sm">
          Link: {" "}
          {data.graph.source?.link ? (
            <a className="link" href={data.graph.source.link} target="_blank" rel="noreferrer">
              open score
            </a>
          ) : (
            "—"
          )}
        </div>
        <div className="text-sm">
          Permalink: {" "}
          {data.graph.source?.permalink ? (
            <a className="link" href={data.graph.source.permalink} target="_blank" rel="noreferrer">
              open permalink
            </a>
          ) : (
            "—"
          )}
        </div>
      </div>

      <div className="card bg-base-100 border p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="font-medium">Progress</div>
          <div className="text-sm">
            {totals.checkedRequired} / {totals.totalRequired} required checks ({totals.pct}%)
          </div>
        </div>
        <progress className="progress progress-primary w-full" value={totals.pct} max={100} />
      </div>

      <div className="card bg-base-100 border p-4">
        <div className="font-semibold mb-3">Checklist items</div>
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Checked</th>
                <th>Entity</th>
                <th>Label</th>
                <th>Field path</th>
              </tr>
            </thead>
            <tbody>
              {requiredItems.map((it) => {
                const key = encodeKey(it);
                const isChecked = checkedKeys.has(key);
                const badgeClass = ENTITY_BADGE[it.entityType] || "badge-ghost";
                return (
                  <tr key={key}>
                    <td>
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary"
                        checked={isChecked}
                        onChange={() => toggle(it)}
                      />
                    </td>
                    <td>
                      <span className={`badge ${badgeClass}`}>{it.entityType}</span>
                    </td>
                    <td>{it.label}</td>
                    <td className="opacity-70 text-xs">{it.fieldPath}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {submitError && <div className="text-sm text-error">{submitError}</div>}
        {abortError && <div className="text-sm text-error">{abortError}</div>}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="btn btn-primary"
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
                    entityId: it.entityId ?? null,
                    fieldPath: it.fieldPath,
                    checked: true,
                  }));
                const res = await fetch(`/api/review/${data.reviewId}/submit`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    checklistState: requiredItemsChecked,
                    overallComment: null,
                  }),
                });
                if (!res.ok) {
                  const j = await res.json().catch(() => ({}));
                  throw new Error(j?.error || `Submit failed (status ${res.status})`);
                }
                localStorage.removeItem(storageKey(data.reviewId));
                localStorage.removeItem(reviewWorkingCopyKey(data.reviewId));
                setCheckedKeys(new Set());
                router.push(URL_REVIEW_LIST);
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
            className="btn btn-neutral"
            disabled={aborting}
            onClick={async () => {
              if (!data) return;
              const ok = window.confirm(
                "Abort this review? This will discard your local progress and release the lock.",
              );
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
                localStorage.removeItem(reviewWorkingCopyKey(data.reviewId));
                setCheckedKeys(new Set());
                router.push(URL_REVIEW_LIST);
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
