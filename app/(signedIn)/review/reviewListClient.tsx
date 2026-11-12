"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { GET_URL_REVIEW } from "@/utils/routes";
import getIMSLPPermaLink from "@/utils/getIMSLPPermaLink";

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
  const [modalError, setModalError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const empty = !items || items.length === 0;

  const onStart = (id: string) => {
    setError(null);
    setModalError(null);
    setConfirmId(id);
  };

  const doConfirm = async () => {
    if (!confirmId) return;
    setBusyId(confirmId);
    setModalError(null);
    try {
      const res = await fetch("/api/review/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mmSourceId: confirmId }),
      });
      if (res.ok) {
        const data = (await res.json()) as { reviewId: string };
        setConfirmId(null);
        router.push(GET_URL_REVIEW(data.reviewId));
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
        if (
          apiError &&
          apiError.toLowerCase().includes("currently being edited by its author")
        ) {
          setModalError(apiError);
          router.refresh();
        } else if (
          apiError &&
          (apiError.toLowerCase().includes("active review in progress") ||
            apiError.toLowerCase().includes("already have an active review"))
        ) {
          setModalError(apiError.replace(/^\[review start]\s*/, ""));
        } else {
          setModalError(
            apiError ||
              "This source was just locked by another reviewer. Refreshing list…",
          );
          router.refresh();
        }
      } else if (
        res.status === 400 &&
        (apiError?.toLowerCase()?.includes("own mm source") ?? false)
      ) {
        setModalError("You cannot review an MM Source you entered yourself.");
      } else if (res.status === 403) {
        setModalError("You do not have permission to start reviews.");
      } else if (apiError) {
        setModalError(apiError);
      } else {
        setModalError(msg);
      }
    } catch (_e: any) {
      setModalError("Network error while starting review.");
    } finally {
      setBusyId(null);
    }
  };

  const cancelModal = () => {
    setConfirmId(null);
    setModalError(null);
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
              <tr className="text-left text-sm">
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
                          href={getIMSLPPermaLink(it.link)}
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
                        className="btn btn-primary px-3 py-1 text-white disabled:opacity-50"
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
        <dialog className="modal modal-open" open>
          <div className="modal-box">
            <h3 className="font-bold text-lg">Start review</h3>
            <p className="py-2">
              You are about to start reviewing this MM Source. This will lock it
              for other reviewers until you finish or abort.
            </p>
            {modalError && (
              <div className="alert alert-error text-xs py-2 my-2">
                <span>{modalError}</span>
              </div>
            )}
            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={cancelModal}
                disabled={busyId === confirmId}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={doConfirm}
                disabled={busyId === confirmId}
              >
                {busyId === confirmId ? "Starting..." : "Confirm"}
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}
