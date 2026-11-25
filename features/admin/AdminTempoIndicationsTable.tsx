"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  AdminListResponse,
  AdminTempoCategoryItem,
  AdminTempoIndicationItem,
  AdminTempoIndicationSortOrder,
} from "@/types/adminTypes";
import { formatDate } from "@/features/admin/formatters";
import { LoaderCentered } from "@/ui/LoaderCentered";
import TempoIndicationCategoriesModal from "@/features/admin/TempoIndicationCategoriesModal";

const PAGE_SIZE = 25;

export default function AdminTempoIndicationsTable() {
  const [items, setItems] = useState<AdminTempoIndicationItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState<AdminTempoCategoryItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortOrder, setSortOrder] =
    useState<AdminTempoIndicationSortOrder>("desc");
  const [editingIndicationId, setEditingIndicationId] = useState<string | null>(
    null,
  );

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/tempo-categories");
      const data = (await res.json()) as {
        items?: AdminTempoCategoryItem[];
      };
      if (res.ok && Array.isArray(data.items)) {
        setCategories(data.items);
      }
    } catch {
      // Categories list is auxiliary for filter/modal; main table error handling covers API failures.
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const fetchTempoIndications = useCallback(
    async ({
      cursor,
      append,
    }: {
      cursor?: string | null;
      append?: boolean;
    }) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("limit", String(PAGE_SIZE));
        params.set("sortOrder", sortOrder);
        params.set("categoryFilter", categoryFilter);
        if (cursor) params.set("cursor", cursor);

        const res = await fetch(
          `/api/admin/tempo-indications?${params.toString()}`,
        );
        const data =
          (await res.json()) as AdminListResponse<AdminTempoIndicationItem> & {
            error?: string;
          };

        if (!res.ok) {
          throw new Error(data.error || "Failed to load tempo indications");
        }

        setItems((prev) => (append ? [...prev, ...data.items] : data.items));
        setNextCursor(data.nextCursor ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unexpected error");
      } finally {
        setLoading(false);
      }
    },
    [sortOrder, categoryFilter],
  );

  useEffect(() => {
    fetchTempoIndications({});
  }, [fetchTempoIndications]);

  const handleLoadMore = () => {
    if (!nextCursor || loading) return;
    fetchTempoIndications({ cursor: nextCursor, append: true });
  };

  const handleToggleSortOrder = () => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
  };

  const handleClearFilters = () => {
    setCategoryFilter("all");
    setSortOrder("desc");
  };

  const handleCategoriesUpdated = (
    indicationId: string,
    updatedCategories: Array<{ id: string; name: string }>,
  ) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === indicationId
          ? { ...item, categories: updatedCategories }
          : item,
      ),
    );
  };

  const editingIndication =
    items.find((item) => item.id === editingIndicationId) ?? null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3 items-end">
        <label className="form-control">
          <span className="label-text">Category</span>
          <select
            aria-label="Filter by category"
            className="select select-bordered select-sm"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="uncategorized">Uncategorized</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="btn btn-sm"
          onClick={handleClearFilters}
        >
          Clear
        </button>
      </div>

      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 font-bold hover:underline cursor-pointer"
                  onClick={handleToggleSortOrder}
                  aria-label={`Sort by created date (${sortOrder === "desc" ? "descending" : "ascending"})`}
                >
                  <span>Created</span>
                  <span aria-hidden="true">
                    {sortOrder === "desc" ? "↓" : "↑"}
                  </span>
                </button>
              </th>
              <th>Author</th>
              <th>Tempo Indication</th>
              <th>Categories</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && !loading ? (
              <tr>
                <td colSpan={5} className="text-center text-sm text-gray-500">
                  No tempo indications found.
                </td>
              </tr>
            ) : null}
            {items.map((item) => (
              <tr key={item.id}>
                <td>{formatDate(item.createdAt)}</td>
                <td>{item.author?.name || item.author?.email || "-"}</td>
                <td>{item.text}</td>
                <td>
                  {item.categories.length === 0 ? (
                    <span className="text-base-content/50">-</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {item.categories.map((cat) => (
                        <span
                          key={cat.id}
                          className="badge badge-outline badge-sm"
                        >
                          {cat.name}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td>
                  <button
                    type="button"
                    className="btn btn-xs"
                    onClick={() => setEditingIndicationId(item.id)}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="btn btn-sm"
          onClick={handleLoadMore}
          disabled={!nextCursor || loading}
        >
          {loading ? <LoaderCentered /> : "Load more"}
        </button>
        {nextCursor ? null : (
          <span className="text-xs text-gray-500">End of results</span>
        )}
      </div>

      <TempoIndicationCategoriesModal
        indication={editingIndication}
        allCategories={categories}
        onCloseAction={() => setEditingIndicationId(null)}
        onCategoriesUpdatedAction={handleCategoriesUpdated}
      />
    </div>
  );
}
