"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { computeChangedChecklistFieldPaths } from "@/features/review/reviewDiff";
import { URL_REVIEW_LIST, URL_FEED } from "@/utils/routes";
import {
  ApiOverview,
  ChecklistGraph,
  RequiredChecklistItem,
  ReviewSubmitError,
  ReviewSubmitSuccess,
} from "@/types/reviewTypes";
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
import dynamic from "next/dynamic";
import ReviewAuditLogPanel from "@/features/review/ReviewAuditLogPanel";
import AuditLogHeader from "@/features/audit/AuditLogHeader";
import AuditLogContent from "@/features/audit/AuditLogContent";
import { composeAuditEntries } from "@/features/review/utils/auditCompose";
import { AuditLogItem } from "@/types/auditTypes";

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

const REVIEW_SUBMIT_INFO_MODAL_ID = "review-submit-info-modal";
const InfoModal = dynamic(() => import("@/ui/modal/InfoModal"), {
  ssr: false,
});

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
  const [submitError, setSubmitError] = useState<ReviewSubmitError | null>(
    null,
  );
  const [submitSuccess, setSubmitSuccess] =
    useState<ReviewSubmitSuccess | null>(null);
  const [aborting, setAborting] = useState(false);
  const [abortError, setAbortError] = useState<string | null>(null);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);
  const [workingGraph, setWorkingGraph] = useState<ChecklistGraph | null>(null);
  const [currentView, setCurrentView] = useState<ReviewView>({
    view: "SUMMARY",
  });
  const [showDiff, setShowDiff] = useState(false);
  const [diffItems, setDiffItems] = useState<AuditLogItem[]>([]);
  const [diffTimestamp, setDiffTimestamp] = useState<string | null>(null);
  const isCollectionView = currentView?.view === "COLLECTION";
  const isPieceView = currentView?.view === "PIECE";

  const onInfoModalOpen = (modalId: string) => {
    //@ts-ignore => Daisy UI modal has an unconventional showModal method
    document?.getElementById(modalId)?.showModal();
  };

  const onInfoModalClosed = (modalId: string) => {
    //@ts-ignore => Daisy UI modal has an unconventional showModal method
    document?.getElementById(modalId)?.close();
    if (submitSuccess && reviewData) {
      clearWorkingCopy();
      localStorage.removeItem(storageKey(reviewData.reviewId));
      localStorage.removeItem(returnRouteKey(reviewData.reviewId));
      router.push(URL_REVIEW_LIST);
    }
    setSubmitSuccess(null);
    setSubmitError(null);
  };

  useEffect(() => {
    if (!submitError && !submitSuccess) return;

    onInfoModalOpen(REVIEW_SUBMIT_INFO_MODAL_ID);
  }, [submitError, submitSuccess]);

  const { allRequiredItems } = useMemo(() => {
    if (!workingGraph || !reviewData?.globallyReviewed) {
      return { allRequiredItems: [], uncheckedKeys: [] };
    }
    const gr = reviewData.globallyReviewed;
    // TODO: Add requiredItems for deleted items by comparing reviewData.graph with workingGraph.
    //  We need to provide a way to identify deleted items in the graph so that can be double-checked server-side before submitting.
    const newAllRequiredItems = expandRequiredChecklistItems(workingGraph, {
      globallyReviewed: {
        personIds: new Set(gr.personIds ?? []),
        organizationIds: new Set(gr.organizationIds ?? []),
        collectionIds: new Set(gr.collectionIds ?? []),
        pieceIds: new Set(gr.pieceIds ?? []),
        pieceVersionIds: new Set(gr.pieceVersionIds ?? []),
      },
    });
    // debug.log("newAllRequiredItems", newAllRequiredItems);

    const uncheckedKeys = newAllRequiredItems.filter(
      (item) => !checkedKeys.has(item.fieldPath),
    );
    // debug.log("uncheckedKeys", uncheckedKeys);

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

  function toggleCheckedAll(items: RequiredChecklistItem[]) {
    setCheckedKeys((prev) => {
      const next = new Set(prev);
      const allChecked = items.every((item) => next.has(item.fieldPath));
      if (allChecked) {
        items.forEach((item) => next.delete(item.fieldPath));
      } else {
        items.forEach((item) => next.add(item.fieldPath));
      }
      return next;
    });
  }

  function openEditForItem(item: RequiredChecklistItem) {
    if (!reviewData || !workingGraph) return;

    const bootState = buildFeedFormBootStateFromWorkingCopy(
      {
        graph: workingGraph,
        updatedAt: new Date().toISOString(),
      },
      reviewData?.globallyReviewed,
      item,
      { reviewId: reviewData.reviewId },
    );
    if (!bootState?.feedFormState?.formInfo?.reviewContext) {
      console.error(
        "ERROR: Something went wrong in buildFeedFormBootStateFromWorkingCopy",
      );
      return;
    }
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
        const reviewData = (await res.json()) as ApiOverview;
        if (!mounted) return;
        setReviewData((prev) => {
          // Only update if the reviewId has actually changed or if we have no previous data
          if (prev?.reviewId === reviewData.reviewId) return prev;
          debug.info("SET reviewData", reviewData);
          return reviewData;
        });
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
          debug.info("NEW WORKING GRAPH from stored workingCopy: ", wcGraph);
        } else {
          saveWorkingCopy(reviewData.graph);
          setWorkingGraph(reviewData.graph);
          debug.info("NEW WORKING GRAPH from reviewData: ", reviewData.graph);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewId]);

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
      debug.info(
        "NEW WORKING GRAPH from rebuilt workingCopy: ",
        JSON.stringify(nextWc.graph),
      );

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
        if (ret.currentView) {
          setCurrentView(ret.currentView);
        }
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
    onToggleAll: toggleCheckedAll,
    onEdit: openEditForItem,
    onNavigate: setCurrentView,
  };
  const handleShowDiff = () => {
    if (!reviewData || !workingGraph) return;
    const entries = composeAuditEntries(
      reviewId,
      reviewData.graph,
      workingGraph,
    );
    const now = new Date().toISOString();
    const items: AuditLogItem[] = entries.map((entry, index) => ({
      id: `${entry.entityType}-${entry.entityId}-${entry.operation}-${index}`,
      reviewId,
      entityType: entry.entityType,
      entityId: entry.entityId,
      operation: entry.operation,
      before: entry.before ?? null,
      after: entry.after ?? null,
      authorId: null,
      createdAt: now,
      comment: null,
    }));
    setDiffItems(items);
    setDiffTimestamp(now);
    setShowDiff(true);
  };

  return (
    <>
      <div className="container mx-auto p-4 space-y-6">
        <div className="card bg-info/10 p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="font-medium mb-1">
                Source title : {workingGraph.source?.title ?? "(no title)"}
              </div>
              <div className="text-md">
                Editor : {workingGraph.source?.enteredBy?.name ?? "(no editor)"}
              </div>
            </div>
            <button
              type="button"
              className="btn btn-sm"
              onClick={handleShowDiff}
            >
              Show diff
            </button>
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

        <div className="text-md text-secondary">Checklist items</div>

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

        <div className="flex flex-col gap-2">
          {abortError && <div className="text-sm text-error">{abortError}</div>}
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="button"
              className="btn btn-primary"
              disabled={submitDisabled}
              onClick={async () => {
                if (!reviewData || !workingGraph) return;
                try {
                  setSubmitting(true);
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
                  // if (!res.ok)
                  //   throw new Error(
                  //     `Submit failed ${res.type} ${res.status} ${res.statusText} ${await res.text()}`,
                  //   );

                  const result = (await res.json()) as any;
                  debug.log("submit result", result);

                  if (result?.error) {
                    setSubmitError(result);
                    return;
                  } else {
                    setSubmitSuccess(result);
                    return;
                  }
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
      <InfoModal
        modalId={REVIEW_SUBMIT_INFO_MODAL_ID}
        type={submitSuccess ? "success" : "error"}
        content={
          submitSuccess ? (
            <>
              <ReviewAuditLogPanel
                reviewId={reviewData?.reviewId ?? reviewId}
                enabled={!!submitSuccess}
              >
                <div className="font-semibold">
                  Review submitted successfully!
                </div>
                <div className="text-md mt-6">{`Summary`}</div>
                <div className="text-sm">
                  {Object.entries(submitSuccess.summary).map(([k, v]) => (
                    <div key={k}>
                      <span className="font-semibold">{k}:</span>{" "}
                      {typeof v === "string" || typeof v === "number"
                        ? v
                        : JSON.stringify(v)}
                    </div>
                  ))}
                </div>
              </ReviewAuditLogPanel>
            </>
          ) : submitError ? (
            <>
              <div className="font-semibold text-error">
                Review submitted failed!
              </div>
              <div className="text-md mt-6">{submitError.error}</div>
              <div className="text-sm mt-6">{`${submitError.missingCount} Missing checks:`}</div>
              <div className="overflow-x-auto">
                <table className="table table-xs">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>entityType</th>
                      {/*<th>entityId</th>*/}
                      {/*<th>fieldPath</th>*/}
                      <th>field.path</th>
                      <th>label</th>
                      <th>value</th>
                      <th>lineage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submitError.missing?.map((m, index) => (
                      <tr key={m.entityId + m.fieldPath}>
                        <th>{index + 1}</th>
                        <td>{m.entityType}</td>
                        {/*<td>{m.entityId}</td>*/}
                        {/*<td>{m.fieldPath}</td>*/}
                        <td>
                          {"path" in m.field
                            ? m.field.path
                            : JSON.stringify(m.field)}
                        </td>
                        <td>{m.label}</td>
                        <td>{m.value}</td>
                        <td>{JSON.stringify(m.lineage, null, 2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null
        }
        onClose={() => onInfoModalClosed(REVIEW_SUBMIT_INFO_MODAL_ID)}
      />

      {showDiff ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-5xl rounded bg-base-100 p-4 shadow-lg max-h-[85vh] overflow-y-auto">
            <AuditLogHeader
              title={workingGraph.source?.title ?? "Audit log"}
              action={
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => setShowDiff(false)}
                >
                  Close
                </button>
              }
            />
            <AuditLogContent
              items={diffItems}
              nextCursor={null}
              loading={false}
              resetKey={diffTimestamp ?? undefined}
              emptyLabel="No changes detected."
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
