"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChecklistEntityType,
  expandRequiredChecklistItems,
  type RequiredChecklistItem,
} from "@/utils/ReviewChecklistSchema";
import { computeChangedChecklistFieldPaths } from "@/utils/reviewDiff";
import { URL_REVIEW_LIST, URL_FEED } from "@/utils/routes";
import { ApiOverview } from "@/types/reviewTypes";
import { ReviewWorkingCopyProvider } from "@/context/reviewWorkingCopyContext";
import { ChecklistRow } from "@/features/review/ChecklistRow";
import { SliceHeader } from "@/features/review/SliceHeader";
import { useReviewWorkingCopy } from "@/context/reviewWorkingCopyContext";
import {
  buildFeedFormStateFromWorkingCopy,
  writeBootStateForFeedForm,
  rebuildWorkingCopyFromFeedForm,
  type BridgeAnchors,
} from "@/utils/reviewEditBridge";
import { FEED_FORM_LOCAL_STORAGE_KEY } from "@/utils/constants";
import type { FeedFormState } from "@/types/feedFormTypes";

// Minimal working copy persisted in localStorage; future forms will mutate this.
// Initialize from the overview's graph for now.
type ReviewWorkingCopy = {
  graph: any;
  updatedAt: string; // ISO timestamp
};

function storageKey(reviewId: string) {
  return `review:${reviewId}:checklist`;
}

// function encodeKey(it: {
//   entityType: ChecklistEntityType;
//   entityId?: string | null;
//   fieldPath: string;
// }) {
//   return `${it.entityType}:${it.entityId ?? ""}:${it.fieldPath}`;
// }

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

const SLICE_LABELS: Record<ChecklistEntityType, string> = {
  MM_SOURCE: "Source",
  COLLECTION: "Collections",
  PIECE: "Pieces",
  PIECE_VERSION: "Piece versions",
  MOVEMENT: "Movements",
  SECTION: "Sections",
  TEMPO_INDICATION: "Tempo indications",
  METRONOME_MARK: "Metronome marks",
  REFERENCE: "References",
  CONTRIBUTION: "Contributions",
  PERSON: "Persons",
  ORGANIZATION: "Organizations",
};

const SLICE_ORDER: ChecklistEntityType[] = [
  "MM_SOURCE",
  "COLLECTION",
  "PIECE",
  "PIECE_VERSION",
  "MOVEMENT",
  "SECTION",
  "TEMPO_INDICATION",
  "METRONOME_MARK",
  "REFERENCE",
  "CONTRIBUTION",
  "PERSON",
  "ORGANIZATION",
];

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
  const [changedKeys, setChangedKeys] = useState<Set<string>>(new Set());

  function openEditForItem(item: RequiredChecklistItem) {
    if (!data) return;

    // Build anchors based on the clicked entity to help the feed form focus
    let anchors: BridgeAnchors | undefined = undefined;
    if (item.entityType === "PIECE_VERSION" && item.entityId) {
      anchors = { pvId: item.entityId };
    } else if (item.entityType === "MOVEMENT" && item.entityId) {
      anchors = { movId: item.entityId };
    } else if (item.entityType === "SECTION" && item.entityId) {
      anchors = { secId: item.entityId };
    } else if (item.entityType === "TEMPO_INDICATION" && item.entityId) {
      // Find the section that owns this tempo indication
      const section = (data.graph?.sections ?? []).find(
        (s: any) => s.tempoIndicationId === item.entityId,
      );
      if (section?.id) anchors = { secId: section.id };
    } else if (item.entityType === "METRONOME_MARK" && item.entityId) {
      const mm = (data.graph?.metronomeMarks ?? []).find(
        (m: any) => m.id === item.entityId,
      );
      if (mm?.sectionId) anchors = { mmId: item.entityId, secId: mm.sectionId };
    }

    // Prepare working copy (fallback to initial graph if none yet)
    const wc = getWorkingCopy();
    const workingCopy = wc ?? {
      graph: data.graph,
      updatedAt: new Date().toISOString(),
    };

    // Compose a boot state for the feed form and persist it to localStorage
    const feedState = buildFeedFormStateFromWorkingCopy(
      workingCopy as any,
      item,
      {
        reviewId: data.reviewId,
        sliceKey: item.fieldPath,
        anchors,
      },
    );
    writeBootStateForFeedForm(feedState);

    // Store return route payload to restore slice/scroll on return
    try {
      localStorage.setItem(
        `review:${data.reviewId}:returnRoute`,
        JSON.stringify({
          reviewId: data.reviewId,
          sliceKey: item.fieldPath,
          scrollY: window.scrollY,
        }),
      );
    } catch {
      // ignore storage errors
    }

    // Navigate to the feed form (it will consume the boot state on mount)
    router.push(URL_FEED);
  }

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
            const reason =
              res.status === 403
                ? "notOwner"
                : res.status === 404
                  ? "notFound"
                  : "notActive"; // 400
            router.push(`${URL_REVIEW_LIST}?reason=${reason}`);
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
            setStorageWarning(
              "Local review progress (checked items) was corrupted and has been reset.",
            );
            localStorage.removeItem(storageKey(j.reviewId));
            setCheckedKeys(new Set());
          }
        }
        // Initialize working copy via Provider if empty:
        // Use the hook's save() only if nothing is present.
        const current = getWorkingCopy();
        if (!current) {
          saveWorkingCopy(j.graph);
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
  }, [reviewId, reloadNonce, router, getWorkingCopy, saveWorkingCopy]);

  // Persist changes in localStorage for checked keys only (working copy is handled by the hook/provider)
  useEffect(() => {
    if (!data) return;
    localStorage.setItem(
      storageKey(data.reviewId),
      JSON.stringify(Array.from(checkedKeys)),
    );
  }, [checkedKeys, data]);

  // Return from Edit mode: rebuild working copy, impact-scoped reset, recompute required, restore scroll
  useEffect(() => {
    if (!data) return;
    try {
      const raw = localStorage.getItem(FEED_FORM_LOCAL_STORAGE_KEY);
      if (!raw) return;
      let feedState: FeedFormState | null = null;
      try {
        feedState = JSON.parse(raw) as FeedFormState;
      } catch {
        // Malformed feed form state; clear it to avoid infinite errors
        localStorage.removeItem(FEED_FORM_LOCAL_STORAGE_KEY);
        return;
      }
      const rc = feedState?.formInfo?.reviewContext;
      if (!rc || !rc.reviewEdit || rc.reviewId !== data.reviewId) return;

      const prev = getWorkingCopy() ?? {
        graph: data.graph,
        updatedAt: new Date().toISOString(),
      };
      const next = rebuildWorkingCopyFromFeedForm(feedState, prev as any);

      // Save the new working copy graph
      saveWorkingCopy(next.graph);

      // Compute impacted field paths (prev vs next working copy)
      const impacted = computeChangedChecklistFieldPaths(
        prev.graph as any,
        next.graph as any,
      );
      const impactedKeys = new Set(impacted.map((c) => c.fieldPath));

      // Recompute required checklist items for the new working graph
      const gr = data.globallyReviewed;
      const nextRequiredItems = expandRequiredChecklistItems(next.graph, {
        globallyReviewed: {
          personIds: new Set(gr?.personIds ?? []),
          organizationIds: new Set(gr?.organizationIds ?? []),
          collectionIds: new Set(gr?.collectionIds ?? []),
          pieceIds: new Set(gr?.pieceIds ?? []),
        },
      });
      const nextRequiredKeySet = new Set(
        nextRequiredItems.map((it) => it.fieldPath),
      );

      // Update checked map
      setCheckedKeys((prevSet) => {
        const ns = new Set(prevSet);
        // Drop keys that are not required anymore
        for (const k of Array.from(ns)) {
          if (!nextRequiredKeySet.has(k)) ns.delete(k);
        }
        // Uncheck impacted
        impactedKeys.forEach((k) => ns.delete(k));
        return ns;
      });

      // Update changed flags for visual hint (against initial baseline from server)
      const changed = computeChangedChecklistFieldPaths(
        data.graph as any,
        next.graph as any,
      );
      setChangedKeys(new Set(changed.map((c) => c.fieldPath)));

      // Clear feed form storage so normal feed openings don't inherit review context
      localStorage.removeItem(FEED_FORM_LOCAL_STORAGE_KEY);

      // Restore slice scroll position (prefer slice anchor over raw scrollY)
      try {
        const retKey = `review:${data.reviewId}:returnRoute`;
        const retRaw = localStorage.getItem(retKey);
        if (retRaw) {
          const ret = JSON.parse(retRaw) as {
            reviewId: string;
            sliceKey?: string;
            scrollY?: number;
          };

          const tryAnchorScroll = () => {
            if (ret.sliceKey) {
              const selector = `[data-fieldpath="${ret.sliceKey}"]`;
              const el = document.querySelector(selector) as HTMLElement | null;
              if (el && typeof (el as any).scrollIntoView === "function") {
                el.scrollIntoView({ block: "center", behavior: "smooth" });
                return true;
              }
            }
            return false;
          };

          let attempts = 0;
          const maxAttempts = 10;
          const tick = () => {
            if (tryAnchorScroll()) return;
            if (attempts < maxAttempts) {
              attempts += 1;
              setTimeout(tick, 50);
            } else if (typeof ret.scrollY === "number") {
              window.scrollTo({ top: ret.scrollY, behavior: "auto" });
            }
          };

          // Start trying immediately
          tick();

          localStorage.removeItem(retKey);
        }
      } catch {
        // ignore
      }
    } catch {
      // ignore for now ?
    }
  }, [data, getWorkingCopy, saveWorkingCopy]);

  const requiredItems: RequiredChecklistItem[] = useMemo(() => {
    if (!data) return [];
    const wc = getWorkingCopy();
    const g = wc?.graph ?? data.graph;
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
  }, [data, getWorkingCopy]);

  const totals = useMemo(() => {
    const totalRequired = requiredItems.length;
    const checkedRequired = requiredItems.filter((i) =>
      checkedKeys.has(i.fieldPath),
    ).length;
    const pct =
      totalRequired === 0
        ? 0
        : Math.round((checkedRequired / totalRequired) * 100);
    return { totalRequired, checkedRequired, pct };
  }, [requiredItems, checkedKeys]);

  // Group items by entity type to render sticky slice headers
  const groupedByType = useMemo(() => {
    const map: Partial<Record<ChecklistEntityType, RequiredChecklistItem[]>> =
      {};
    for (const it of requiredItems) {
      (map[it.entityType] = map[it.entityType] || []).push(it);
    }
    return map;
  }, [requiredItems]);

  // Recompute changed keys whenever working copy or baseline (data.graph) changes
  useEffect(() => {
    if (!data) return;
    const wc = getWorkingCopy();
    const workingGraph = wc?.graph ?? data.graph;
    try {
      const changes = computeChangedChecklistFieldPaths(
        data.graph,
        workingGraph,
      );
      setChangedKeys(new Set(changes.map((c) => c.fieldPath)));
    } catch {
      setChangedKeys(new Set());
    }
  }, [data, reloadNonce, getWorkingCopy]);

  function toggle(item: RequiredChecklistItem) {
    const key = item.fieldPath;
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
    submitting ||
    totals.totalRequired === 0 ||
    totals.checkedRequired < totals.totalRequired;

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
            Title: {data.graph.source?.title ?? "(no title)"}
          </div>
          <div className="text-sm">
            Link:{" "}
            {data.graph.source?.link ? (
              <a
                className="link"
                href={data.graph.source.link}
                target="_blank"
                rel="noreferrer"
              >
                open score
              </a>
            ) : (
              "—"
            )}
          </div>
          <div className="text-sm">
            Permalink:{" "}
            {data.graph.source?.permalink ? (
              <a
                className="link"
                href={data.graph.source.permalink}
                target="_blank"
                rel="noreferrer"
              >
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

        <div className="card bg-base-100 border p-4">
          <div className="mb-3">
            <div className="font-semibold">Checklist items</div>
          </div>
          {storageWarning && (
            <div className="alert alert-warning mb-3">
              <span>{storageWarning}</span>
              <button
                className="btn btn-xs btn-ghost ml-auto"
                onClick={() => setStorageWarning(null)}
              >
                Dismiss
              </button>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Checked</th>
                  <th>Entity</th>
                  <th>Label</th>
                  <th>Field path</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {SLICE_ORDER.flatMap((t) => {
                  const group = (groupedByType as any)[t] as
                    | RequiredChecklistItem[]
                    | undefined;
                  if (!group || group.length === 0) return [];
                  const header = (
                    <SliceHeader
                      key={`hdr-${t}`}
                      id={`slice-${t.toLowerCase()}`}
                      title={SLICE_LABELS[t]}
                    />
                  );
                  const rows = group.map((it) => {
                    const key = it.fieldPath;
                    const isChecked = checkedKeys.has(key);
                    const badgeClass =
                      ENTITY_BADGE[it.entityType] || "badge-ghost";
                    const rowChanged = changedKeys.has(key);
                    return (
                      <ChecklistRow
                        key={key}
                        rowId={`row-${key}`}
                        item={it}
                        checked={isChecked}
                        changed={rowChanged}
                        onToggle={() => toggle(it)}
                        onEdit={() => openEditForItem(it)}
                        entityBadge={
                          <span className={`badge ${badgeClass}`}>
                            {it.entityType}
                          </span>
                        }
                      />
                    );
                  });
                  return [header, ...rows];
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card bg-base-100 border p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">Audit events (read-only)</div>
          </div>
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
                if (!data) return;
                try {
                  setSubmitError(null);
                  setSubmitting(true);

                  // Load working copy graph (fallback to current data.graph)
                  const wc = getWorkingCopy();
                  const workingGraph = wc?.graph ?? data.graph;

                  // Pre-check: ensure any changed checklist field is checked
                  const changes = computeChangedChecklistFieldPaths(
                    data.graph,
                    workingGraph,
                  );
                  const changeKeys = new Set(changes.map((c) => c.fieldPath));
                  const requiredKeyMap = new Map(
                    requiredItems.map((it) => [it.fieldPath, it]),
                  );
                  const relevantChangeKeys = Array.from(changeKeys).filter(
                    (k) => requiredKeyMap.has(k),
                  );
                  const missing = relevantChangeKeys.filter(
                    (k) => !checkedKeys.has(k),
                  );
                  if (missing.length > 0) {
                    const samples = missing.slice(0, 5).map((k) => {
                      const it = requiredKeyMap.get(k)!;
                      return `${it.label} (${it.fieldPath})`;
                    });
                    setSubmitting(false);
                    setSubmitError(
                      `Some changed fields must be checked before submitting. Please review: ${samples.join(", ")}${missing.length > samples.length ? `, and ${missing.length - samples.length} more…` : ""}`,
                    );
                    return;
                  }

                  const requiredItemsChecked = requiredItems
                    .filter((it) => checkedKeys.has(it.fieldPath))
                    .map((it) => ({
                      entityType: it.entityType,
                      entityId: it.entityId ?? null,
                      fieldPath: it.fieldPath,
                      checked: true,
                    }));

                  const res = await fetch(
                    `/api/review/${data.reviewId}/submit`,
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        workingCopy: workingGraph,
                        checklistState: requiredItemsChecked,
                        overallComment: null,
                      }),
                    },
                  );
                  if (!res.ok) {
                    const j = await res.json().catch(() => ({}));
                    throw new Error(
                      j?.error || `Submit failed (status ${res.status})`,
                    );
                  }
                  localStorage.removeItem(storageKey(data.reviewId));
                  // Clear any pending return route payload
                  try {
                    localStorage.removeItem(
                      `review:${data.reviewId}:returnRoute`,
                    );
                  } catch {
                    // ignore
                  }
                  clearWorkingCopy(); // clear working copy via hook
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
                  const res = await fetch(
                    `/api/review/${data.reviewId}/abort`,
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({}),
                    },
                  );
                  if (!res.ok) {
                    const j = await res.json().catch(() => ({}));
                    throw new Error(
                      j?.error || `Abort failed (status ${res.status})`,
                    );
                  }
                  localStorage.removeItem(storageKey(data.reviewId));
                  // Clear any pending return route payload
                  try {
                    localStorage.removeItem(
                      `review:${data.reviewId}:returnRoute`,
                    );
                  } catch {
                    // ignore
                  }
                  clearWorkingCopy(); // clear working copy via hook
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
    </ReviewWorkingCopyProvider>
  );
}

// Lightweight read-only audit panel for the current review
function AuditPanel({ reviewId }: { reviewId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (cursor?: string | null) => {
    try {
      setLoading(true);
      setError(null);
      const qs = new URLSearchParams();
      qs.set("reviewId", reviewId);
      if (cursor) qs.set("cursor", cursor);
      qs.set("limit", "20");
      const res = await fetch(`/api/audit?${qs.toString()}`, {
        cache: "no-store",
      });
      const j = await res.json();
      if (!res.ok)
        throw new Error(j?.error || `Failed to load audit (${res.status})`);
      if (cursor) setItems((prev) => [...prev, ...(j.items || [])]);
      else setItems(j.items || []);
      setNextCursor(j.nextCursor ?? null);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewId]);

  return (
    <div>
      {error && (
        <div className="alert alert-warning mb-2">
          <span>{error}</span>
          <button
            className="btn btn-xs btn-ghost ml-auto"
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      )}
      <div className="flex items-center gap-2 mb-2">
        <button
          type="button"
          className="btn btn-xs"
          onClick={() => load()}
          disabled={loading}
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
        {nextCursor && (
          <button
            type="button"
            className="btn btn-xs btn-outline"
            onClick={() => load(nextCursor)}
            disabled={loading}
          >
            Load more
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <div className="text-sm opacity-70">No audit events yet.</div>
      ) : (
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
      )}
    </div>
  );
}
