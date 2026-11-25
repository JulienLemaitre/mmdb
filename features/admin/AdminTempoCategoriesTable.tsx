"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AdminTempoCategoryItem } from "@/types/adminTypes";
import { LoaderCentered } from "@/ui/LoaderCentered";

export default function AdminTempoCategoriesTable() {
  const [items, setItems] = useState<AdminTempoCategoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/tempo-categories");
      const data = (await res.json()) as {
        items?: AdminTempoCategoryItem[];
        error?: string;
      };
      if (!res.ok || !Array.isArray(data.items)) {
        throw new Error(data.error || "Failed to load tempo categories");
      }
      setItems(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/tempo-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = (await res.json()) as {
        item?: AdminTempoCategoryItem;
        error?: string;
      };
      if (!res.ok || !data.item) {
        throw new Error(data.error || "Failed to create category");
      }
      setItems((prev) => [...prev, data.item!]);
      setNewCategoryName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (category: AdminTempoCategoryItem) => {
    if (category.tempoIndicationCount > 0 || deletingId) return;

    setDeletingId(category.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/tempo-categories/${category.id}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as {
        deletedId?: string;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete category");
      }
      setItems((prev) => prev.filter((item) => item.id !== category.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleCreateCategory}
        className="flex flex-wrap items-end gap-3"
      >
        <label className="form-control">
          <span className="label-text">New category name</span>
          <input
            type="text"
            className="input input-bordered input-sm"
            placeholder="e.g. Scherzo"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            disabled={submitting}
          />
        </label>
        <button
          type="submit"
          className="btn btn-sm btn-primary"
          disabled={!newCategoryName.trim() || submitting}
        >
          {submitting ? "Adding..." : "Add category"}
        </button>
      </form>

      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      {loading ? (
        <LoaderCentered />
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>Linked Tempo Indications</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center text-sm text-gray-500">
                    No tempo categories found.
                  </td>
                </tr>
              ) : null}
              {items.map((category) => {
                const isLinked = category.tempoIndicationCount > 0;
                const isDeleting = deletingId === category.id;
                return (
                  <tr key={category.id}>
                    <td className="font-medium">{category.name}</td>
                    <td>{category.tempoIndicationCount}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-xs btn-error btn-outline"
                        disabled={isLinked || isDeleting}
                        title={
                          isLinked
                            ? "Cannot delete a category with linked tempo indications"
                            : "Delete category"
                        }
                        onClick={() => handleDeleteCategory(category)}
                      >
                        {isDeleting ? "Deleting..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
