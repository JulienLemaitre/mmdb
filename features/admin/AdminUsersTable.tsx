"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AdminListResponse, AdminUserItem } from "@/types/adminTypes";
import { formatDate } from "@/features/admin/formatters";
import { userRoleOrderedList } from "@/utils/constants";

const PAGE_SIZE = 25;

export default function AdminUsersTable() {
  const [items, setItems] = useState<AdminUserItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [role, setRole] = useState("");

  const fetchUsers = useCallback(
    async ({ cursor, append }: { cursor?: string | null; append?: boolean }) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("limit", String(PAGE_SIZE));
        if (cursor) params.set("cursor", cursor);
        if (from) params.set("from", from);
        if (to) params.set("to", to);
        if (role) params.set("role", role);

        const res = await fetch(`/api/admin/users?${params.toString()}`);
        const data = (await res.json()) as AdminListResponse<AdminUserItem> & {
          error?: string;
        };

        if (!res.ok) {
          throw new Error(data.error || "Failed to load users");
        }

        setItems((prev) => (append ? [...prev, ...data.items] : data.items));
        setNextCursor(data.nextCursor ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unexpected error");
      } finally {
        setLoading(false);
      }
    },
    [from, to, role],
  );

  useEffect(() => {
    fetchUsers({});
  }, [fetchUsers]);

  const handleLoadMore = () => {
    if (!nextCursor || loading) return;
    fetchUsers({ cursor: nextCursor, append: true });
  };

  const handleClearFilters = () => {
    setFrom("");
    setTo("");
    setRole("");
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3 items-end">
        <label className="form-control">
          <span className="label-text">From</span>
          <input
            type="date"
            className="input input-bordered input-sm"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="form-control">
          <span className="label-text">To</span>
          <input
            type="date"
            className="input input-bordered input-sm"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <label className="form-control">
          <span className="label-text">Role</span>
          <select
            className="select select-bordered select-sm"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="">All</option>
            {userRoleOrderedList.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="btn btn-sm" onClick={handleClearFilters}>
          Clear
        </button>
      </div>

      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Signup</th>
              <th>Email verified</th>
              <th>Role</th>
              <th>Total MM Sources</th>
              <th>Approved MM Sources</th>
              <th>Submitted review</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && !loading ? (
              <tr>
                <td colSpan={8} className="text-center text-sm text-gray-500">
                  No users found.
                </td>
              </tr>
            ) : null}
            {items.map((user) => (
              <tr key={user.id}>
                <td>{user.name || "-"}</td>
                <td>{user.email || "-"}</td>
                <td>{formatDate(user.createdAt)}</td>
                <td>{user.emailVerified ? "Yes" : "No"}</td>
                <td>{user.role || "-"}</td>
                <td>{user.mmSourceCount}</td>
                <td>{user.approvedMMSourceCount}</td>
                <td>{user.submittedReviewCount}</td>
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
          {loading ? "Loading..." : "Load more"}
        </button>
        {nextCursor ? null : (
          <span className="text-xs text-gray-500">End of results</span>
        )}
      </div>
    </div>
  );
}
