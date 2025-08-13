"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { GET_URL_REVIEW_CHECKLIST } from "@/utils/routes";

export type ToReviewItem = {
  id: string;
  title: string | null;
  composers: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  }[];
  link: string | null;
  permalink: string | null;
  enteredBy: { id: string; name: string | null; email: string | null } | null;
  sectionsCount: number;
  creationDate: Date;
};

export default function ReviewListClient({ items }: { items: ToReviewItem[] }) {
  const router = useRouter();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const empty = !items || items.length === 0;

  const onStart = (id: string) => {
    setError(null);
    setConfirmId(id);
  };

  const doConfirm = async () => {
    if (!confirmId) return;
    setBusyId(confirmId);
    try {
      const res = await fetch("/api/review/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mmSourceId: confirmId }),
      });
      if (res.ok) {
        const data = (await res.json()) as { reviewId: string };
        router.push(GET_URL_REVIEW_CHECKLIST(data.reviewId));
        return;
      }
      // Non-OK
      let msg = "Unable to start review.";
      let apiError: string | undefined;
      try {
        const j = (await res.json()) as any;
        apiError = j?.error;
      } catch {
        // ignore JSON parse error; keep defaults
      }
      if (res.status === 409) {
        setError("This source was just locked by another reviewer. Refreshing list…");
        router.refresh();
      } else if (res.status === 400 && (apiError?.toLowerCase()?.includes("own mm source") ?? false)) {
        setError("You cannot review an MM Source you entered yourself.");
      } else if (res.status === 403) {
        setError("You do not have permission to start reviews.");
      } else if (apiError) {
        setError(apiError);
      } else {
        setError(msg);
      }
    } catch (_e: any) {
      setError("Network error while starting review.");
    } finally {
      setBusyId(null);
      setConfirmId(null);
    }
  };

  const cancelModal = () => {
    setConfirmId(null);
  };

  return (
    <div>
      {error && (
        <div className="mb-3 rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {empty ? (
        <div className="text-sm text-gray-600">
          No MM Sources are available for review.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="text-left text-sm text-gray-700">
                <th className="border-b p-2">Title</th>
                <th className="border-b p-2">Composers</th>
                <th className="border-b p-2">Online score</th>
                <th className="border-b p-2">Entered by</th>
                <th className="border-b p-2">Sections</th>
                <th className="border-b p-2">Created</th>
                <th className="border-b p-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => {
                const composersStr = it.composers
                  .map((c) =>
                    [c.lastName, c.firstName].filter(Boolean).join(", "),
                  )
                  .join("; ");
                const created = new Date(it.creationDate).toLocaleDateString();
                const isBusy = busyId === it.id;
                return (
                  <tr key={it.id} className="text-sm">
                    <td className="border-b p-2">{it.title ?? "Untitled"}</td>
                    <td className="border-b p-2">{composersStr || "—"}</td>
                    <td className="border-b p-2">
                      {it.link ? (
                        <a
                          className="text-blue-600 hover:underline"
                          href={it.link}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="border-b p-2">
                      {it.enteredBy?.name || it.enteredBy?.email || "—"}
                    </td>
                    <td className="border-b p-2">{it.sectionsCount}</td>
                    <td className="border-b p-2">{created}</td>
                    <td className="border-b p-2 text-right">
                      <button
                        className="rounded bg-black px-3 py-1 text-white disabled:opacity-50"
                        onClick={() => onStart(it.id)}
                        disabled={isBusy}
                      >
                        Start review
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded bg-white p-4 shadow">
            <h2 className="mb-3 text-lg font-semibold">Start review</h2>
            <p className="mb-4 text-sm text-gray-700">
              You are about to start reviewing this MM Source. This will lock it
              for other reviewers until you finish or abort.
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="rounded border px-3 py-1"
                onClick={cancelModal}
              >
                Cancel
              </button>
              <button
                className="rounded bg-black px-3 py-1 text-white disabled:opacity-50"
                onClick={doConfirm}
                disabled={busyId === confirmId}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
