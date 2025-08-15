import Link from "next/link";
import { headers } from "next/headers";
import type { ReactNode } from "react";

async function fetchOverview(reviewId: string) {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host");
  const base = host ? `${proto}://${host}` : "";
  const res = await fetch(`${base}/api/review/${reviewId}/overview`, {
    cache: "no-store",
  });
  if (!res.ok)
    throw new Error(`Failed to load review overview (${res.status})`);
  return (await res.json()) as {
    reviewId: string;
    graph: any;
    globallyReviewed: {
      personIds: string[];
      organizationIds: string[];
      collectionIds: string[];
      pieceIds: string[];
    };
    sourceContents: Array<{
      joinId: string;
      mMSourceId: string;
      pieceVersionId: string;
      rank: number;
      pieceId: string;
      collectionId?: string;
      collectionRank?: number;
    }>;
    progress: {
      source: { required: number; checked: number };
      perCollection: Record<string, { required: number; checked: number }>;
      perPiece: Record<string, { required: number; checked: number }>;
    };
  };
}

function Badge({ children }: { children: ReactNode }) {
  return <span className="badge badge-ghost">{children}</span>;
}

export default async function ReviewOverviewPage({
  params,
}: {
  params: { reviewId: string };
}) {
  const { reviewId } = params;
  const data = await fetchOverview(reviewId);
  const { graph, progress, sourceContents } = data;

  const collectionsById: Record<string, any> = Object.fromEntries(
    (graph.collections ?? []).map((c: any) => [c.id, c]),
  );
  const piecesById: Record<string, any> = Object.fromEntries(
    (graph.pieces ?? []).map((p: any) => [p.id, p]),
  );

  // Group source contents by collection (collectionId undefined => single pieces group)
  const groups: Record<
    string,
    { title: string; items: any[]; collectionId?: string }
  > = {};
  for (const row of sourceContents ?? []) {
    const colId = row.collectionId ?? "__single__";
    if (!groups[colId]) {
      const title =
        colId === "__single__"
          ? "Single pieces"
          : (collectionsById[colId]?.title ?? "Collection");
      groups[colId] = {
        title,
        items: [],
        collectionId: colId === "__single__" ? undefined : colId,
      };
    }
    groups[colId].items.push(row);
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Review Overview</h1>
        <div className="flex items-center gap-2">
          <h2 className="text-xl">{graph.source?.title ?? "MM Source"}</h2>
          <Badge>
            Progress {progress.source.checked}/{progress.source.required}
          </Badge>
        </div>
        <p className="text-sm opacity-70">
          Type: {graph.source?.type} · Year: {graph.source?.year}
        </p>
        {graph.source?.link && (
          <p className="text-sm">
            Link:{" "}
            <a href={graph.source.link} className="link" target="_blank">
              {graph.source.link}
            </a>
          </p>
        )}
      </div>

      <div className="mb-8 card bg-base-200 p-4">
        <h3 className="card-title mb-2">Source details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div>
            <div className="text-sm">
              Permalink: {graph.source?.permalink || "—"}
            </div>
            <div className="text-sm">
              Comment: {graph.source?.comment || "—"}
            </div>
          </div>
          <div>
            <div className="text-sm">
              References: {(graph.references ?? []).length}
            </div>
            <div className="text-sm">
              Contributions: {(graph.contributions ?? []).length}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {Object.values(groups).map((g) => (
          <div
            key={g.collectionId ?? "single"}
            className="card bg-base-100 border p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">
                  {g.collectionId ? (
                    <Link
                      href={`/review/${reviewId}/collection/${g.collectionId}`}
                      className="link"
                    >
                      {g.title}
                    </Link>
                  ) : (
                    g.title
                  )}
                </h3>
                {g.collectionId && (
                  <Badge>
                    {progress.perCollection[g.collectionId]?.checked ?? 0}/
                    {progress.perCollection[g.collectionId]?.required ?? 0}
                  </Badge>
                )}
              </div>
              {g.collectionId && (
                <Link
                  href={`/review/${reviewId}/collection/${g.collectionId}`}
                  className="btn btn-sm btn-ghost"
                >
                  Open collection
                </Link>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Piece</th>
                    <th>Progress</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {g.items
                    .slice()
                    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
                    .map((row) => {
                      const piece = piecesById[row.pieceId];
                      const pieceProg = data.progress.perPiece[row.pieceId] || {
                        required: 0,
                        checked: 0,
                      };
                      return (
                        <tr key={row.joinId}>
                          <td>{row.rank}</td>
                          <td>{piece?.title ?? row.pieceId}</td>
                          <td>
                            <Badge>
                              {pieceProg.checked}/{pieceProg.required}
                            </Badge>
                          </td>
                          <td>
                            <button
                              className="btn btn-xs btn-ghost"
                              disabled
                              title="Coming soon"
                            >
                              Open piece checklist
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
