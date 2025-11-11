"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { computeChangedChecklistFieldPaths } from "@/features/review/reviewDiff";
import { URL_REVIEW_LIST, URL_FEED } from "@/utils/routes";
import {
  ApiOverview,
  ChecklistGraph,
  RequiredChecklistItem,
} from "@/types/reviewTypes";
import { ReviewWorkingCopyProvider } from "@/context/reviewWorkingCopyContext";
import { useReviewWorkingCopy } from "@/context/reviewWorkingCopyContext";
import {
  buildFeedFormBootStateFromWorkingCopy,
  writeBootStateForFeedForm,
  rebuildWorkingCopyFromFeedForm,
} from "@/features/review/reviewEditBridge";
import { FEED_FORM_LOCAL_STORAGE_KEY } from "@/utils/constants";
import { SummarySlice } from "@/features/review/slices/SummarySlice";
import { CollectionSlice } from "@/features/review/slices/CollectionSlice";
import { PieceSlice } from "@/features/review/slices/PieceSlice";
import { FeedFormState } from "@/types/feedFormTypes";
import { expandRequiredChecklistItems } from "@/features/review/utils/expandRequiredChecklistItems";
import { debug, prodLog } from "@/utils/debugLogger";
// import AuditPanel from "@/features/review/components/AuditPanel";

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

  const [reviewData, setReviewData] = useState<ApiOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkedKeys, setCheckedKeys] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [aborting, setAborting] = useState(false);
  const [abortError, setAbortError] = useState<string | null>(null);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);
  const [workingGraph, setWorkingGraph] = useState<ChecklistGraph | null>(null);
  const [currentView, setCurrentView] = useState<ReviewView>({
    view: "SUMMARY",
  });
  const isCollectionView = currentView.view === "COLLECTION";
  const isPieceView = currentView.view === "PIECE";

  const { allRequiredItems } = useMemo(() => {
    if (!workingGraph || !reviewData?.globallyReviewed) {
      return { allRequiredItems: [], uncheckedKeys: [] };
    }
    const gr = reviewData.globallyReviewed;
    const newAllRequiredItems = expandRequiredChecklistItems(workingGraph, {
      globallyReviewed: {
        personIds: new Set(gr.personIds ?? []),
        organizationIds: new Set(gr.organizationIds ?? []),
        collectionIds: new Set(gr.collectionIds ?? []),
        pieceIds: new Set(gr.pieceIds ?? []),
      },
    });
    debug.log("newAllRequiredItems", newAllRequiredItems);

    const uncheckedKeys = newAllRequiredItems.filter(
      (item) => !checkedKeys.has(item.fieldPath),
    );
    debug.log("uncheckedKeys", uncheckedKeys);

    return { allRequiredItems: newAllRequiredItems, uncheckedKeys };
  }, [workingGraph, checkedKeys, reviewData?.globallyReviewed]);

  const summaryItemList = useMemo(() => {
    return allRequiredItems.filter(
      (it) => !it.lineage.pieceId && !it.lineage.collectionId,
    );
  }, [allRequiredItems]);

  const collectionItemList = useMemo(() => {
    if (!isCollectionView) return [];
    const itemListWithCollectionLineage = allRequiredItems.filter(
      (it) => it.lineage.collectionId === currentView.collectionId,
    );
    const collectionTypeItemList = allRequiredItems
      .filter((item) => item.entityType === "COLLECTION")
      .map((item) => ({
        ...item,
        ...(item.entityId && {
          lineage: { ...item?.lineage, collectionId: item.entityId },
        }),
      }));
    return [...itemListWithCollectionLineage, ...collectionTypeItemList];
  }, [allRequiredItems, isCollectionView, currentView]);

  const pieceItemList = useMemo(() => {
    if (!isPieceView) return [];
    const itemListWithPieceLineage = allRequiredItems.filter(
      (it) => it.lineage.pieceId === currentView.pieceId,
    );
    const pieceTypeItemList = allRequiredItems
      .filter((item) => item.entityType === "PIECE")
      .map((item) => {
        const pieceVersion = allRequiredItems.find(
          (it) =>
            it.entityType === "PIECE_VERSION" &&
            "path" in it.field &&
            it.field.path === "category" &&
            item.entityId === it.lineage?.pieceId,
        );
        return {
          ...item,
          lineage: {
            ...(pieceVersion?.lineage?.pieceId && {
              pieceId: pieceVersion?.lineage?.pieceId,
            }),
            ...(pieceVersion?.lineage?.collectionId && {
              collectionId: pieceVersion?.lineage?.collectionId,
            }),
          },
        };
      });
    // TODO: include tempo indication per se ?
    // const tempoIndicationList = allRequiredItems
    //   .filter((item) => item.entityType === "TEMPO_INDICATION")
    //   .map((item) => {
    //     const section = allRequiredItems.find(
    //       (it) =>
    //         it.entityType === "SECTION" &&
    //         "path" in it.field &&
    //         it.field.path === "tempoIndicationId" &&
    //         item.value === it.value,
    //     );
    //     return {
    //       ...item,
    //       lineage: section?.lineage || {},
    //     };
    //   });
    return [
      ...itemListWithPieceLineage,
      ...pieceTypeItemList,
      // ...tempoIndicationList,
    ];
  }, [allRequiredItems, isPieceView, currentView]);

  const changedKeys = useMemo(() => {
    if (!reviewData?.graph || !workingGraph) {
      return new Set<string>();
    }
    try {
      const changes = computeChangedChecklistFieldPaths(
        reviewData.graph,
        workingGraph,
      );
      return new Set(changes.map((c) => c.fieldPath));
    } catch {
      return new Set<string>();
    }
  }, [reviewData?.graph, workingGraph]);

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
    if (!reviewData || !workingGraph) return;

    const bootState = buildFeedFormBootStateFromWorkingCopy(
      { graph: workingGraph, updatedAt: new Date().toISOString() },
      item,
      { reviewId: reviewData.reviewId },
    );
    writeBootStateForFeedForm(bootState);

    // Store return route payload, now with the view state
    try {
      localStorage.setItem(
        returnRouteKey(reviewData.reviewId),
        JSON.stringify({ currentView, fieldPath: item.fieldPath }),
      );
    } catch {
      // ignore
    }
    router.push(URL_FEED + "?debug=true");
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
        const reviewData = (await res.json()) as ApiOverview;
        debug.log("reviewData", reviewData);
        if (!mounted) return;
        setReviewData(reviewData);
        const raw = localStorage.getItem(storageKey(reviewData.reviewId));
        if (raw) {
          try {
            setCheckedKeys(new Set(JSON.parse(raw) as string[]));
          } catch {
            setStorageWarning("Local progress was corrupt and has been reset.");
            localStorage.removeItem(storageKey(reviewData.reviewId));
          }
        }
        const wcGraph = getWorkingCopy()?.graph;
        if (wcGraph) {
          setWorkingGraph(wcGraph);
          debug.info("NEW WORKING GRAPH: ", reviewData.graph);
        } else {
          saveWorkingCopy(reviewData.graph);
          setWorkingGraph(reviewData.graph);
          debug.info("NEW WORKING GRAPH: ", reviewData.graph);
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
  }, [reviewId, router, getWorkingCopy, saveWorkingCopy]);

  // Persist checked keys to localStorage
  useEffect(() => {
    if (reviewData?.reviewId) {
      localStorage.setItem(
        storageKey(reviewData.reviewId),
        JSON.stringify(Array.from(checkedKeys)),
      );
    }
  }, [checkedKeys, reviewData?.reviewId]);

  // Handle return from edit mode
  useEffect(() => {
    if (!reviewData || !workingGraph) {
      return;
    }
    try {
      const raw = localStorage.getItem(FEED_FORM_LOCAL_STORAGE_KEY);
      if (!raw) return;
      const feedState = JSON.parse(raw) as FeedFormState;
      const rc = feedState?.formInfo?.reviewContext;
      if (!rc || !rc.reviewEdit || rc.reviewId !== reviewData.reviewId) return;

      const prevWc = {
        graph: workingGraph,
        updatedAt: getWorkingCopy()?.updatedAt ?? new Date().toISOString(),
      };
      const nextWc = rebuildWorkingCopyFromFeedForm(feedState, prevWc as any);
      saveWorkingCopy(nextWc.graph);
      setWorkingGraph(nextWc.graph);
      debug.info("NEW WORKING GRAPH: ", nextWc.graph);

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

      const retKey = returnRouteKey(reviewData.reviewId);
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
      prodLog.error("[return from edit] Error:", e);
    }
  }, [
    reviewData,
    workingGraph,
    saveWorkingCopy,
    getWorkingCopy,
    allRequiredItems,
  ]);

  if (loading || !workingGraph) return <div className="p-6">Loading…</div>;
  if (error)
    return (
      <div className="p-6">
        <div className="text-error">{error}</div>
      </div>
    );
  if (!reviewData) return <div className="p-6">No data</div>;

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
      reviewId={reviewData.reviewId}
      initialGraph={reviewData.graph}
    >
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Piece Review Checklist</h1>
            <p className="text-sm opacity-80">
              Review ID: {reviewData.reviewId}
            </p>
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
            <SummarySlice items={summaryItemList} {...commonSliceProps} />
          )}
          {currentView.view === "COLLECTION" && (
            <CollectionSlice
              collectionId={currentView.collectionId}
              items={collectionItemList}
              {...commonSliceProps}
            />
          )}
          {currentView.view === "PIECE" && (
            <PieceSlice
              pieceId={currentView.pieceId}
              items={pieceItemList}
              {...commonSliceProps}
            />
          )}
        </div>

        {/*<div className="card bg-base-100 border p-4">
          <div className="font-semibold mb-2">Audit events (read-only)</div>
          <AuditPanel reviewId={reviewData.reviewId} />
        </div>*/}

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
                if (!reviewData || !workingGraph) return;
                try {
                  setSubmitting(true);
                  // Submission logic remains the same...
                  const res = await fetch(
                    `/api/review/${reviewData.reviewId}/submit`,
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
                  if (!res.ok)
                    throw new Error(
                      `Submit failed ${res.status} ${res.statusText} ${await res.text()}`,
                    );
                  // log result on success
                  const result = (await res.json()) as {};
                  debug.log("submit result", result);

                  clearWorkingCopy();
                  localStorage.removeItem(storageKey(reviewData.reviewId));
                  localStorage.removeItem(returnRouteKey(reviewData.reviewId));
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
                if (!reviewData) return;
                if (!window.confirm("Abort this review?")) return;
                try {
                  setAborting(true);
                  await fetch(`/api/review/${reviewData.reviewId}/abort`, {
                    method: "POST",
                  });
                  clearWorkingCopy();
                  localStorage.removeItem(storageKey(reviewData.reviewId));
                  localStorage.removeItem(returnRouteKey(reviewData.reviewId));
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
