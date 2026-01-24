"use client";

import React, { useState } from "react";
import AdminUsersTable from "@/features/admin/AdminUsersTable";
import AdminMMSourcesTable from "@/features/admin/AdminMMSourcesTable";
import AdminReviewsTable from "@/features/admin/AdminReviewsTable";
import AuditLogViewer from "@/features/admin/AuditLogViewer";

type TabKey = "users" | "sources" | "reviews";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabKey>("users");
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div role="tablist" className="tabs tabs-bordered">
        <button
          type="button"
          role="tab"
          className={`tab ${activeTab === "users" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          Users
        </button>
        <button
          type="button"
          role="tab"
          className={`tab ${activeTab === "sources" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("sources")}
        >
          MM Sources
        </button>
        <button
          type="button"
          role="tab"
          className={`tab ${activeTab === "reviews" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("reviews")}
        >
          Reviews
        </button>
      </div>

      {activeTab === "users" ? (
        <section className="rounded border border-base-300 p-4">
          <h2 className="text-xl font-semibold mb-3">Users</h2>
          <AdminUsersTable />
        </section>
      ) : null}

      {activeTab === "sources" ? (
        <section className="rounded border border-base-300 p-4">
          <h2 className="text-xl font-semibold mb-3">MM Sources</h2>
          <AdminMMSourcesTable />
        </section>
      ) : null}

      {activeTab === "reviews" ? (
        <section className="rounded border border-base-300 p-4">
          <h2 className="text-xl font-semibold mb-3">Reviews</h2>
          <AdminReviewsTable onViewAuditLogAction={setActiveReviewId} />
        </section>
      ) : null}

      <AuditLogViewer
        reviewId={activeReviewId}
        onCloseAction={() => setActiveReviewId(null)}
      />
    </div>
  );
}
