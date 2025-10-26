"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  type ChecklistGraph,
  type RequiredChecklistItem,
} from "@/features/review/ReviewChecklistSchema";
import { computeChangedChecklistFieldPaths } from "@/features/review/reviewDiff";
import { URL_REVIEW_LIST, URL_FEED } from "@/utils/routes";
import { ApiOverview } from "@/types/reviewTypes";
import { ReviewWorkingCopyProvider } from "@/context/reviewWorkingCopyContext";
import { useReviewWorkingCopy } from "@/context/reviewWorkingCopyContext";
import {
  buildFeedFormStateFromWorkingCopy,
  writeBootStateForFeedForm,
  rebuildWorkingCopyFromFeedForm,
} from "@/features/review/reviewEditBridge";
import { FEED_FORM_LOCAL_STORAGE_KEY } from "@/utils/constants";
import { SummarySlice } from "@/features/review/slices/SummarySlice";
import { CollectionSlice } from "@/features/review/slices/CollectionSlice";
import { PieceSlice } from "@/features/review/slices/PieceSlice";
import { FeedFormState } from "@/types/feedFormTypes";
import { expandRequiredChecklistItems } from "@/features/review/utils/expandRequiredChecklistItems";

// State definition for the view controller
export type ReviewView =
  | { view: "SUMMARY" }
  | { view: "COLLECTION"; collectionId: string }
  | { view: "PIECE"; pieceId: string };

function storageKey(reviewId: string) {
  return `review:${reviewId}:checklist`;
}
function returnRouteKey(reviewId: string) {
  return `review:${reviewId}:returnRoute`;
}

export default function ChecklistPage() {
  const params = useParams();
  const router = useRouter();
  const reviewId = (params?.reviewId as string) ?? "";
  const { getWorkingCopy, saveWorkingCopy, clearWorkingCopy } =
    useReviewWorkingCopy();

  const [data, setData] = useState<ApiOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkedKeys, setCheckedKeys] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [aborting, setAborting] = useState(false);
  const [abortError, setAbortError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);

  // New state for controlling which slice is visible
  const [currentView, setCurrentView] = useState<ReviewView>({
    view: "SUMMARY",
  });

  // --- Derived State ---
  const workingGraph: ChecklistGraph | undefined = useMemo(
    () => getWorkingCopy()?.graph ?? data?.graph,
    [data?.graph, getWorkingCopy],
  );

  const allRequiredItems = useMemo(() => {
    if (!workingGraph || !data?.globallyReviewed) return [];
    const gr = data.globallyReviewed;
    return expandRequiredChecklistItems(workingGraph, {
      globallyReviewed: {
        personIds: new Set(gr.personIds ?? []),
        organizationIds: new Set(gr.organizationIds ?? []),
        collectionIds: new Set(gr.collectionIds ?? []),
        pieceIds: new Set(gr.pieceIds ?? []),
      },
    });
  }, [workingGraph, data?.globallyReviewed]);

  const changedKeys = useMemo(() => {
    if (!data?.graph || !workingGraph) return new Set<string>();
    try {
      const changes = computeChangedChecklistFieldPaths(
        data.graph,
        workingGraph,
      );
      return new Set(changes.map((c) => c.fieldPath));
    } catch {
      return new Set<string>();
    }
  }, [data?.graph, workingGraph]);

  const totals = useMemo(() => {
    const totalRequired = allRequiredItems.length;
    const checkedRequired = allRequiredItems.filter((i) =>
      checkedKeys.has(i.fieldPath),
    ).length;
    const pct =
      totalRequired === 0
        ? 0
        : Math.round((checkedRequired / totalRequired) * 100);
    return { totalRequired, checkedRequired, pct };
  }, [allRequiredItems, checkedKeys]);

  // --- Core Functions ---

  function toggleChecked(item: RequiredChecklistItem) {
    const key = item.fieldPath;
    setCheckedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function openEditForItem(item: RequiredChecklistItem) {
    if (!data || !workingGraph) return;

    const feedState = buildFeedFormStateFromWorkingCopy(
      { graph: workingGraph, updatedAt: new Date().toISOString() },
      item,
      { reviewId: data.reviewId },
    );
    writeBootStateForFeedForm(feedState);

    // Store return route payload, now with the view state
    try {
      localStorage.setItem(
        returnRouteKey(data.reviewId),
        JSON.stringify({ currentView, fieldPath: item.fieldPath }),
      );
    } catch {
      // ignore
    }
    router.push(URL_FEED);
  }

  // --- Effects ---

  // Initial data load
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`/api/review/${reviewId}/overview`, {
          cache: "no-store",
        });
        if (!res.ok) {
          if (res.status === 401) router.push("/login");
          else
            router.push(
              `${URL_REVIEW_LIST}?reason=${res.status === 403 ? "notOwner" : "notFound"}`,
            );
          return;
        }
        const j = (await res.json()) as ApiOverview;
        if (!mounted) return;
        setData(j);
        const raw = localStorage.getItem(storageKey(j.reviewId));
        if (raw) {
          try {
            setCheckedKeys(new Set(JSON.parse(raw) as string[]));
          } catch {
            setStorageWarning("Local progress was corrupt and has been reset.");
            localStorage.removeItem(storageKey(j.reviewId));
          }
        }
        if (!getWorkingCopy()) {
          saveWorkingCopy(j.graph);
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || String(e));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (reviewId) load();
    return () => {
      mounted = false;
    };
  }, [reviewId, reloadNonce, router, getWorkingCopy, saveWorkingCopy]);

  // Persist checked keys to localStorage
  useEffect(() => {
    if (data?.reviewId) {
      localStorage.setItem(
        storageKey(data.reviewId),
        JSON.stringify(Array.from(checkedKeys)),
      );
    }
  }, [checkedKeys, data?.reviewId]);

  // Handle return from edit mode
  useEffect(() => {
    if (!data || !workingGraph) return;
    try {
      const raw = localStorage.getItem(FEED_FORM_LOCAL_STORAGE_KEY);
      if (!raw) return;
      const feedState = JSON.parse(raw) as FeedFormState;
      const rc = feedState?.formInfo?.reviewContext;
      if (!rc || !rc.reviewEdit || rc.reviewId !== data.reviewId) return;

      const prevWc = {
        graph: getWorkingCopy()?.graph ?? data.graph,
        updatedAt: getWorkingCopy()?.updatedAt ?? new Date().toISOString(),
      };
      const nextWc = rebuildWorkingCopyFromFeedForm(feedState, prevWc as any);
      saveWorkingCopy(nextWc.graph);

      const impacted = computeChangedChecklistFieldPaths(
        prevWc.graph,
        nextWc.graph,
      );
      const impactedKeys = new Set(impacted.map((c) => c.fieldPath));
      const nextRequiredKeySet = new Set(
        allRequiredItems.map((it) => it.fieldPath),
      );

      setCheckedKeys((prevSet) => {
        const ns = new Set(prevSet);
        for (const k of Array.from(ns)) {
          if (!nextRequiredKeySet.has(k)) ns.delete(k);
        }
        impactedKeys.forEach((k) => ns.delete(k));
        return ns;
      });

      localStorage.removeItem(FEED_FORM_LOCAL_STORAGE_KEY);

      const retKey = returnRouteKey(data.reviewId);
      const retRaw = localStorage.getItem(retKey);
      if (retRaw) {
        const ret = JSON.parse(retRaw) as {
          currentView: ReviewView;
          fieldPath?: string;
        };
        setCurrentView(ret.currentView);
        // Simplified scroll restoration
        setTimeout(() => {
          if (ret.fieldPath) {
            const el = document.querySelector(
              `[data-fieldpath="${ret.fieldPath}"]`,
            );
            el?.scrollIntoView({ block: "center", behavior: "smooth" });
          }
        }, 100);
        localStorage.removeItem(retKey);
      }
    } catch (e) {
      console.error("Error handling return from edit:", e);
    }
  }, [data, saveWorkingCopy, getWorkingCopy, allRequiredItems]);

  if (loading || !workingGraph) return <div className="p-6">Loading…</div>;
  if (error)
    return (
      <div className="p-6">
        <div className="text-error">{error}</div>
      </div>
    );
  if (!data) return <div className="p-6">No data</div>;

  const submitDisabled =
    submitting ||
    totals.totalRequired === 0 ||
    totals.checkedRequired < totals.totalRequired;
  const commonSliceProps = {
    graph: workingGraph,
    checkedKeys,
    changedKeys,
    onToggle: toggleChecked,
    onEdit: openEditForItem,
    onNavigate: setCurrentView,
  };

  return (
    <ReviewWorkingCopyProvider
      reviewId={data.reviewId}
      initialGraph={data.graph}
    >
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Piece Review Checklist</h1>
            <p className="text-sm opacity-80">Review ID: {data.reviewId}</p>
          </div>
        </div>

        <div className="card bg-info/10 p-4">
          <div className="font-medium mb-1">Source</div>
          <div className="text-sm">
            Title: {workingGraph.source?.title ?? "(no title)"}
          </div>
        </div>

        <div className="card bg-base-100 border p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="font-medium">Progress</div>
            <div className="text-sm">
              {totals.checkedRequired} / {totals.totalRequired} required checks
              ({totals.pct}%)
            </div>
          </div>
          <progress
            className="progress progress-primary w-full"
            value={totals.pct}
            max={100}
          />
        </div>

        {storageWarning && (
          <div className="alert alert-warning">
            <span>{storageWarning}</span>
          </div>
        )}

        <div className="card bg-base-100 border p-4">
          {currentView.view === "SUMMARY" && (
            <SummarySlice
              items={allRequiredItems.filter(
                (it) => !it.lineage.pieceId && !it.lineage.collectionId,
              )}
              {...commonSliceProps}
            />
          )}
          {currentView.view === "COLLECTION" && (
            <CollectionSlice
              collectionId={currentView.collectionId}
              items={allRequiredItems.filter(
                (it) => it.lineage.collectionId === currentView.collectionId,
              )}
              {...commonSliceProps}
            />
          )}
          {currentView.view === "PIECE" && (
            <PieceSlice
              pieceId={currentView.pieceId}
              items={allRequiredItems.filter(
                (it) => it.lineage.pieceId === currentView.pieceId,
              )}
              {...commonSliceProps}
            />
          )}
        </div>

        <div className="card bg-base-100 border p-4">
          <div className="font-semibold mb-2">Audit events (read-only)</div>
          <AuditPanel reviewId={data.reviewId} />
        </div>

        <div className="flex flex-col gap-2">
          {submitError && (
            <div className="text-sm text-error">{submitError}</div>
          )}
          {abortError && <div className="text-sm text-error">{abortError}</div>}
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="btn btn-primary"
              disabled={submitDisabled}
              onClick={async () => {
                if (!data || !workingGraph) return;
                try {
                  setSubmitting(true);
                  // Submission logic remains the same...
                  const res = await fetch(
                    `/api/review/${data.reviewId}/submit`,
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        workingCopy: workingGraph,
                        checklistState: allRequiredItems
                          .filter((it) => checkedKeys.has(it.fieldPath))
                          .map((it) => ({
                            entityType: it.entityType,
                            entityId: it.entityId ?? null,
                            fieldPath: it.fieldPath,
                          })),
                      }),
                    },
                  );
                  if (!res.ok) throw new Error("Submit failed");
                  clearWorkingCopy();
                  localStorage.removeItem(storageKey(data.reviewId));
                  localStorage.removeItem(returnRouteKey(data.reviewId));
                  router.push(URL_REVIEW_LIST);
                } catch (e: any) {
                  setSubmitError(e.message);
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
                if (!window.confirm("Abort this review?")) return;
                try {
                  setAborting(true);
                  await fetch(`/api/review/${data.reviewId}/abort`, {
                    method: "POST",
                  });
                  clearWorkingCopy();
                  localStorage.removeItem(storageKey(data.reviewId));
                  localStorage.removeItem(returnRouteKey(data.reviewId));
                  router.push(URL_REVIEW_LIST);
                } catch (e: any) {
                  setAbortError(e.message);
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
    </ReviewWorkingCopyProvider>
  );
}

// Lightweight read-only audit panel
function AuditPanel({ reviewId }: { reviewId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch(`/api/audit?reviewId=${reviewId}&limit=20`);
      const j = await res.json();
      setItems(j.items || []);
      setLoading(false);
    }
    load();
  }, [reviewId]);

  return (
    <div>
      {loading && <div className="text-sm">Loading events...</div>}
      {items.length === 0 && !loading && (
        <div className="text-sm opacity-70">No audit events yet.</div>
      )}
      <ul className="text-sm space-y-1 max-h-64 overflow-auto">
        {items.map((it: any) => (
          <li key={it.id} className="border-b last:border-b-0 pb-1">
            <span className="badge badge-ghost mr-2">{it.operation}</span>
            <span className="opacity-80 mr-2">
              {it.entityType}:{it.entityId}
            </span>
            <span className="opacity-60">
              {new Date(it.createdAt).toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
