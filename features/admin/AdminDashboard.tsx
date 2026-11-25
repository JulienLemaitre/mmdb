"use client";

import React, { useState } from "react";
import AdminUsersTable from "@/features/admin/AdminUsersTable";
import AdminMMSourcesTable from "@/features/admin/AdminMMSourcesTable";
import AdminReviewsTable from "@/features/admin/AdminReviewsTable";
import AdminTempoIndicationsTable from "@/features/admin/AdminTempoIndicationsTable";
import AdminTempoCategoriesTable from "@/features/admin/AdminTempoCategoriesTable";
import AuditLogViewer from "@/features/admin/AuditLogViewer";

type TabKey =
  | "users"
  | "sources"
  | "reviews"
  | "tempoIndications"
  | "tempoCategories";

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
        <button
          type="button"
          role="tab"
          className={`tab ${activeTab === "tempoIndications" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("tempoIndications")}
        >
          Tempo Indications
        </button>
        <button
          type="button"
          role="tab"
          className={`tab ${activeTab === "tempoCategories" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("tempoCategories")}
        >
          Tempo Categories
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

      {activeTab === "tempoIndications" ? (
        <section className="rounded border border-base-300 p-4">
          <h2 className="text-xl font-semibold mb-3">Tempo Indications</h2>
          <AdminTempoIndicationsTable />
        </section>
      ) : null}

      {activeTab === "tempoCategories" ? (
        <section className="rounded border border-base-300 p-4">
          <h2 className="text-xl font-semibold mb-3">Tempo Categories</h2>
          <AdminTempoCategoriesTable />
        </section>
      ) : null}

      <AuditLogViewer
        reviewId={activeReviewId}
        onCloseAction={() => setActiveReviewId(null)}
      />
    </div>
  );
}
