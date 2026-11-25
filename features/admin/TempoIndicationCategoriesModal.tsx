"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AdminTempoCategoryItem,
  AdminTempoIndicationItem,
} from "@/types/adminTypes";

type Props = {
  indication: AdminTempoIndicationItem | null;
  allCategories: AdminTempoCategoryItem[];
  onCloseAction: () => void;
  onCategoriesUpdatedAction: (
    indicationId: string,
    categories: Array<{ id: string; name: string }>,
  ) => void;
};

export default function TempoIndicationCategoriesModal({
  indication,
  allCategories,
  onCloseAction,
  onCategoriesUpdatedAction,
}: Props) {
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableCategories = useMemo(() => {
    if (!indication) return [];
    const linkedIds = new Set(indication.categories.map((c) => c.id));
    return allCategories.filter((c) => !linkedIds.has(c.id));
  }, [indication, allCategories]);

  useEffect(() => {
    setError(null);
  }, [indication?.id]);

  useEffect(() => {
    if (availableCategories.length === 0) {
      setSelectedCategoryId("");
      return;
    }
    if (!availableCategories.some((c) => c.id === selectedCategoryId)) {
      setSelectedCategoryId(availableCategories[0].id);
    }
  }, [availableCategories, selectedCategoryId]);

  if (!indication) return null;

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategoryId || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/tempo-indications/${indication.id}/categories`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tempoCategoryId: selectedCategoryId }),
        },
      );
      const data = (await res.json()) as {
        categories?: Array<{ id: string; name: string }>;
        error?: string;
      };
      if (!res.ok || !data.categories) {
        throw new Error(data.error || "Failed to add category");
      }
      onCategoriesUpdatedAction(indication.id, data.categories);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveCategory = async (tempoCategoryId: string) => {
    if (submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/tempo-indications/${indication.id}/categories?tempoCategoryId=${encodeURIComponent(tempoCategoryId)}`,
        {
          method: "DELETE",
        },
      );
      const data = (await res.json()) as {
        categories?: Array<{ id: string; name: string }>;
        error?: string;
      };
      if (!res.ok || !data.categories) {
        throw new Error(data.error || "Failed to remove category");
      }
      onCategoriesUpdatedAction(indication.id, data.categories);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tempo-indication-categories-modal-title"
    >
      <div className="w-full max-w-lg rounded bg-base-100 p-5 shadow-lg space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3
              id="tempo-indication-categories-modal-title"
              className="text-lg font-semibold"
            >
              Edit Categories
            </h3>
            <p className="text-sm text-base-content/70">{indication.text}</p>
          </div>
          <button
            type="button"
            className="btn btn-sm"
            onClick={onCloseAction}
            disabled={submitting}
          >
            Close
          </button>
        </div>

        {error ? <div className="text-sm text-error">{error}</div> : null}

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Linked categories</h4>
          {indication.categories.length === 0 ? (
            <p className="text-sm text-base-content/60">
              No categories linked.
            </p>
          ) : (
            <ul className="space-y-2">
              {indication.categories.map((cat) => (
                <li
                  key={cat.id}
                  className="flex items-center justify-between rounded border border-base-300 px-3 py-2"
                >
                  <span className="text-sm font-medium">{cat.name}</span>
                  <button
                    type="button"
                    className="btn btn-xs btn-error btn-outline"
                    onClick={() => handleRemoveCategory(cat.id)}
                    disabled={submitting}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <form onSubmit={handleAddCategory} className="space-y-2 pt-2 border-t border-base-300">
          <label className="block text-sm font-medium" htmlFor="add-tempo-category-select">
            Add category
          </label>
          <div className="flex items-center gap-2">
            <select
              id="add-tempo-category-select"
              className="select select-bordered select-sm flex-1"
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              disabled={availableCategories.length === 0 || submitting}
            >
              {availableCategories.length === 0 ? (
                <option value="">All categories already linked</option>
              ) : (
                availableCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))
              )}
            </select>
            <button
              type="submit"
              className="btn btn-sm btn-primary"
              disabled={!selectedCategoryId || submitting}
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
