"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChecklistEntityType,
  expandRequiredChecklistItems,
  type RequiredChecklistItem,
} from "@/utils/ReviewChecklistSchema";
import {
  computeChangedChecklistFieldPaths,
  toEncodedKeys,
} from "@/utils/reviewDiff";
import { URL_REVIEW_LIST } from "@/utils/routes";
import SourceDescriptionEditForm from "@/components/entities/source-description/SourceDescriptionEditForm";
import PieceEditForm from "@/components/entities/piece/PieceEditForm";
import PieceVersionQuickEditForm from "@/components/entities/piece-version/PieceVersionQuickEditForm";
import MovementQuickEditForm from "@/components/entities/movement/MovementQuickEditForm";
import SectionQuickEditForm from "@/components/entities/section/SectionQuickEditForm";
import OrganizationEditForm from "@/components/entities/organization/OrganizationEditForm";
import {
  SourceDescriptionAdapter,
  PieceAdapter,
  PieceVersionAdapter,
  MovementAdapter,
  SectionAdapter,
  OrganizationAdapter,
} from "@/utils/reviewAdapters";
import type { PieceInput } from "@/types/formTypes";
import { ApiOverview } from "@/types/reviewTypes";
import { ReviewWorkingCopyProvider } from "@/components/context/reviewWorkingCopyContext";

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

function encodeKey(it: {
  entityType: ChecklistEntityType;
  entityId?: string | null;
  fieldPath: string;
}) {
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
  const [storageWarning, setStorageWarning] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "UNCHECKED" | "CHANGED">("ALL");
  const [changedKeys, setChangedKeys] = useState<Set<string>>(new Set());
  const [editState, setEditState] = useState<
    | { kind: "MM_SOURCE" }
    | { kind: "PIECE"; id: string }
    | { kind: "PIECE_VERSION"; id: string }
    | { kind: "MOVEMENT"; id: string }
    | { kind: "SECTION"; id: string }
    | { kind: "ORGANIZATION"; id: string }
    | null
  >(null);

  function getWorkingCopy(): ReviewWorkingCopy | null {
    if (!reviewId) return null;
    const rwcRaw = localStorage.getItem(reviewWorkingCopyKey(reviewId));
    if (!rwcRaw) return null;
    try {
      return JSON.parse(rwcRaw) as ReviewWorkingCopy;
    } catch {
      return null;
    }
  }
  function saveWorkingCopyGraph(updatedGraph: any) {
    if (!reviewId) return;
    const next: ReviewWorkingCopy = {
      graph: updatedGraph,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(reviewWorkingCopyKey(reviewId), JSON.stringify(next));
  }

  function resetChecksFor(
    affectedFieldPaths: string[],
    entityType: ChecklistEntityType,
    entityId?: string | null,
  ) {
    setCheckedKeys((prev) => {
      const next = new Set(prev);
      for (const fp of affectedFieldPaths) {
        const key = `${entityType}:${entityId ?? ""}:${fp}`;
        if (next.has(key)) next.delete(key);
      }
      return next;
    });
  }

  function openEditForItem(it: RequiredChecklistItem) {
    if (it.entityType === "MM_SOURCE") {
      setEditState({ kind: "MM_SOURCE" });
      return;
    }
    if (it.entityType === "PIECE" && it.entityId) {
      setEditState({ kind: "PIECE", id: it.entityId });
      return;
    }
    if (it.entityType === "PIECE_VERSION" && it.entityId) {
      setEditState({ kind: "PIECE_VERSION", id: it.entityId });
      return;
    }
    if (it.entityType === "MOVEMENT" && it.entityId) {
      setEditState({ kind: "MOVEMENT", id: it.entityId });
      return;
    }
    if (it.entityType === "SECTION" && it.entityId) {
      setEditState({ kind: "SECTION", id: it.entityId });
      return;
    }
    if (it.entityType === "TEMPO_INDICATION" && it.entityId) {
      // Map to the owning section and open section editor
      const section = (data?.graph?.sections ?? []).find(
        (s: any) => s.tempoIndicationId === it.entityId,
      );
      if (section?.id) {
        setEditState({ kind: "SECTION", id: section.id });
        return;
      }
    }
    if (it.entityType === "METRONOME_MARK" && it.entityId) {
      // Map to the owning section via metronomeMarks array if present
      const mm = (data?.graph?.metronomeMarks ?? []).find(
        (m: any) => m.id === it.entityId,
      );
      if (mm?.sectionId) {
        setEditState({ kind: "SECTION", id: mm.sectionId });
        return;
      }
    }
    if (it.entityType === "ORGANIZATION" && it.entityId) {
      setEditState({ kind: "ORGANIZATION", id: it.entityId });
      return;
    }
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
            setStorageWarning(
              "Local review progress (checked items) was corrupted and has been reset.",
            );
            localStorage.removeItem(storageKey(j.reviewId));
            setCheckedKeys(new Set());
          }
        }
        // Initialize or validate working copy
        const rwcKey = reviewWorkingCopyKey(j.reviewId);
        const rwcRaw = localStorage.getItem(rwcKey);
        if (!rwcRaw) {
          const rwc: ReviewWorkingCopy = {
            graph: j.graph,
            updatedAt: new Date().toISOString(),
          };
          localStorage.setItem(rwcKey, JSON.stringify(rwc));
        } else {
          try {
            JSON.parse(rwcRaw) as ReviewWorkingCopy;
          } catch {
            setStorageWarning(
              "Local working copy was corrupted and has been reset to server data.",
            );
            const rwc: ReviewWorkingCopy = {
              graph: j.graph,
              updatedAt: new Date().toISOString(),
            };
            localStorage.setItem(rwcKey, JSON.stringify(rwc));
          }
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
    localStorage.setItem(
      storageKey(data.reviewId),
      JSON.stringify(Array.from(checkedKeys)),
    );
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
    const checkedRequired = requiredItems.filter((i) =>
      checkedKeys.has(encodeKey(i)),
    ).length;
    const pct =
      totalRequired === 0
        ? 0
        : Math.round((checkedRequired / totalRequired) * 100);
    return { totalRequired, checkedRequired, pct };
  }, [requiredItems, checkedKeys]);

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
      setChangedKeys(new Set(toEncodedKeys(changes)));
    } catch {
      setChangedKeys(new Set());
    }
  }, [data, reloadNonce]);

  const filteredItems = useMemo(() => {
    if (!requiredItems) return [] as RequiredChecklistItem[];
    if (filter === "ALL") return requiredItems;
    if (filter === "UNCHECKED")
      return requiredItems.filter((it) => !checkedKeys.has(encodeKey(it)));
    // CHANGED
    return requiredItems.filter((it) => changedKeys.has(encodeKey(it)));
  }, [requiredItems, checkedKeys, changedKeys, filter]);

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
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold">Checklist items</div>
            <div className="join">
              <button
                className={`btn btn-xs join-item ${filter === "ALL" ? "btn-active" : "btn-ghost"}`}
                onClick={() => setFilter("ALL")}
                type="button"
              >
                All
              </button>
              <button
                className={`btn btn-xs join-item ${filter === "UNCHECKED" ? "btn-active" : "btn-ghost"}`}
                onClick={() => setFilter("UNCHECKED")}
                type="button"
              >
                Unchecked
              </button>
              <button
                className={`btn btn-xs join-item ${filter === "CHANGED" ? "btn-active" : "btn-ghost"}`}
                onClick={() => setFilter("CHANGED")}
                type="button"
              >
                Changed
              </button>
            </div>
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
          {editState && (
            <dialog className="modal modal-open">
              <div className="modal-box w-11/12 max-w-3xl">
                <h3 className="font-bold text-lg mb-3">Edit</h3>
                {(() => {
                  const wc = getWorkingCopy();
                  const graph = wc?.graph ?? data.graph; // fall back to current graph
                  if (editState.kind === "MM_SOURCE") {
                    const initial =
                      SourceDescriptionAdapter.buildInitialValues(graph);
                    return (
                      <SourceDescriptionEditForm
                        initialValues={initial}
                        onCancel={() => setEditState(null)}
                        onSubmit={(values) => {
                          const res = SourceDescriptionAdapter.applySave(
                            graph,
                            values,
                          );
                          saveWorkingCopyGraph(res.updatedGraph);
                          resetChecksFor(
                            res.affectedFieldPaths,
                            res.entityType,
                            res.entityId,
                          );
                          setEditState(null);
                          setReloadNonce((n) => n + 1);
                        }}
                      />
                    );
                  }
                  if (editState.kind === "PIECE") {
                    const initial = PieceAdapter.buildInitialValues(
                      graph,
                      editState.id,
                    );
                    if (!initial)
                      return <div className="text-error">Piece not found</div>;
                    const pieceInput: PieceInput = {
                      id: initial.id,
                      title: (initial.title as any) ?? "",
                      nickname: (initial.nickname as any) ?? "",
                      yearOfComposition:
                        (initial.yearOfComposition as any) ?? null,
                    };
                    return (
                      <PieceEditForm
                        piece={pieceInput}
                        onCancel={() => setEditState(null)}
                        onSubmit={(vals) => {
                          const res = PieceAdapter.applySave(graph, {
                            id: initial.id,
                            title: vals.title ?? null,
                            nickname: vals.nickname ?? null,
                            yearOfComposition:
                              (vals.yearOfComposition as any) ?? null,
                          });
                          saveWorkingCopyGraph(res.updatedGraph);
                          resetChecksFor(
                            res.affectedFieldPaths,
                            res.entityType,
                            res.entityId,
                          );
                          setEditState(null);
                          setReloadNonce((n) => n + 1);
                        }}
                      />
                    );
                  }
                  if (editState.kind === "PIECE_VERSION") {
                    const initial = PieceVersionAdapter.buildInitialValues(
                      graph,
                      editState.id,
                    );
                    if (!initial)
                      return (
                        <div className="text-error">
                          Piece version not found
                        </div>
                      );
                    return (
                      <PieceVersionQuickEditForm
                        initialValues={{
                          id: initial.id,
                          category: initial.category ?? undefined,
                        }}
                        onCancel={() => setEditState(null)}
                        onSubmit={(vals) => {
                          const res = PieceVersionAdapter.applySave(graph, {
                            id: initial.id,
                            category: vals.category ?? null,
                          });
                          saveWorkingCopyGraph(res.updatedGraph);
                          resetChecksFor(
                            res.affectedFieldPaths,
                            res.entityType,
                            res.entityId,
                          );
                          setEditState(null);
                          setReloadNonce((n) => n + 1);
                        }}
                      />
                    );
                  }
                  if (editState.kind === "MOVEMENT") {
                    const initial = MovementAdapter.buildInitialValues(
                      graph,
                      editState.id,
                    );
                    if (!initial)
                      return (
                        <div className="text-error">Movement not found</div>
                      );
                    const movement = (graph.movements ?? []).find(
                      (m: any) => m.id === editState.id,
                    );
                    const pvId = movement?.pieceVersionId as string | undefined;
                    return (
                      <div className="space-y-3">
                        {pvId && (
                          <div className="alert alert-info text-sm">
                            <div className="flex items-center justify-between w-full">
                              <span>
                                Anchor: Movement belongs to a Piece Version.
                              </span>
                              <button
                                className="btn btn-xs btn-ghost hover:btn-accent"
                                onClick={() =>
                                  setEditState({
                                    kind: "PIECE_VERSION",
                                    id: pvId,
                                  })
                                }
                              >
                                Open PieceVersion editor
                              </button>
                            </div>
                          </div>
                        )}
                        <MovementQuickEditForm
                          initialValues={{
                            id: initial.id,
                            rank: (initial as any).rank ?? undefined,
                            key: (initial as any).key ?? undefined,
                          }}
                          onCancel={() => setEditState(null)}
                          onSubmit={(vals) => {
                            const res = MovementAdapter.applySave(graph, {
                              id: initial.id,
                              rank: vals.rank ?? null,
                              key: (vals.key as any) ?? null,
                            });
                            saveWorkingCopyGraph(res.updatedGraph);
                            resetChecksFor(
                              res.affectedFieldPaths,
                              res.entityType,
                              res.entityId,
                            );
                            setEditState(null);
                            setReloadNonce((n) => n + 1);
                          }}
                        />
                      </div>
                    );
                  }
                  if (editState.kind === "SECTION") {
                    const initial = SectionAdapter.buildInitialValues(
                      graph,
                      editState.id,
                    );
                    if (!initial)
                      return (
                        <div className="text-error">Section not found</div>
                      );
                    const section = (graph.sections ?? []).find(
                      (s: any) => s.id === editState.id,
                    );
                    let pvId: string | undefined;
                    if (section?.movementId) {
                      const mv = (graph.movements ?? []).find(
                        (m: any) => m.id === section.movementId,
                      );
                      pvId = mv?.pieceVersionId;
                    }
                    return (
                      <div className="space-y-3">
                        {pvId && (
                          <div className="alert alert-info text-sm">
                            <div className="flex items-center justify-between w-full">
                              <span>
                                Anchor: Section belongs to a Piece Version.
                              </span>
                              <button
                                className="btn btn-xs btn-ghost hover:btn-accent"
                                onClick={() =>
                                  setEditState({
                                    kind: "PIECE_VERSION",
                                    id: pvId!,
                                  })
                                }
                              >
                                Open PieceVersion editor
                              </button>
                            </div>
                          </div>
                        )}
                        <SectionQuickEditForm
                          initialValues={initial}
                          readonlyPreview={section}
                          onCancel={() => setEditState(null)}
                          onSubmit={(vals) => {
                            const res = SectionAdapter.applySave(graph, {
                              ...vals,
                              id: initial.id,
                            });
                            saveWorkingCopyGraph(res.updatedGraph);
                            resetChecksFor(
                              res.affectedFieldPaths,
                              res.entityType,
                              res.entityId,
                            );
                            setEditState(null);
                            setReloadNonce((n) => n + 1);
                          }}
                        />
                      </div>
                    );
                  }
                  if (editState.kind === "ORGANIZATION") {
                    const initial = OrganizationAdapter.buildInitialValues(
                      graph,
                      editState.id,
                    );
                    if (!initial)
                      return (
                        <div className="text-error">Organization not found</div>
                      );
                    return (
                      <OrganizationEditForm
                        initialValues={{
                          id: initial.id,
                          name: initial.name ?? "",
                        }}
                        onCancel={() => setEditState(null)}
                        onSubmit={(vals) => {
                          const res = OrganizationAdapter.applySave(graph, {
                            id: initial.id,
                            name: vals.name ?? null,
                          });
                          saveWorkingCopyGraph(res.updatedGraph);
                          resetChecksFor(
                            res.affectedFieldPaths,
                            res.entityType,
                            res.entityId,
                          );
                          setEditState(null);
                          setReloadNonce((n) => n + 1);
                        }}
                      />
                    );
                  }
                  return null;
                })()}
                <div className="modal-action">
                  <button
                    className="btn btn-neutral"
                    onClick={() => setEditState(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </dialog>
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
                {filteredItems.map((it) => {
                  const key = encodeKey(it);
                  const isChecked = checkedKeys.has(key);
                  const badgeClass =
                    ENTITY_BADGE[it.entityType] || "badge-ghost";
                  const rowChanged = changedKeys.has(key);
                  return (
                    <tr key={key} className={rowChanged ? "bg-warning/10" : ""}>
                      <td>
                        <input
                          type="checkbox"
                          className="checkbox checkbox-primary"
                          checked={isChecked}
                          onChange={() => toggle(it)}
                        />
                      </td>
                      <td>
                        <span className={`badge ${badgeClass}`}>
                          {it.entityType}
                        </span>
                      </td>
                      <td>
                        {it.label}
                        {rowChanged && (
                          <span className="badge badge-warning badge-outline ml-2">
                            Changed
                          </span>
                        )}
                      </td>
                      <td className="opacity-70 text-xs">{it.fieldPath}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-xs btn-ghost hover:btn-accent"
                          onClick={() => openEditForItem(it)}
                          title="Edit this entity"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
                  const changeKeys = new Set(toEncodedKeys(changes));
                  const requiredKeyMap = new Map(
                    requiredItems.map((it) => [encodeKey(it), it]),
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
                    .filter((it) => checkedKeys.has(encodeKey(it)))
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
    </ReviewWorkingCopyProvider>
  );
}
