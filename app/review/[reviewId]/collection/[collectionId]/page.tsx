import Link from "next/link";
import { headers } from "next/headers";

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
    sourceContents: any[];
    progress: {
      source: { required: number; checked: number };
      perCollection: Record<string, { required: number; checked: number }>;
      perPiece: Record<string, { required: number; checked: number }>;
    };
  };
}

export default async function CollectionOverviewPage({
  params,
}: {
  params: { reviewId: string; collectionId: string };
}) {
  const { reviewId, collectionId } = params;
  const data = await fetchOverview(reviewId);
  const { graph, progress } = data;

  const collection = (graph.collections ?? []).find(
    (c: any) => c.id === collectionId,
  );
  const pieces = (graph.pieces ?? [])
    .filter((p: any) => p.collectionId === collectionId)
    .sort(
      (a: any, b: any) => (a.collectionRank ?? 0) - (b.collectionRank ?? 0),
    );

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <Link href={`/review/${reviewId}`} className="btn btn-sm btn-neutral">
          ← Back to overview
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Collection Overview</h1>
        <div className="flex items-center gap-2">
          <h2 className="text-xl">{collection?.title ?? "Collection"}</h2>
          <span className="badge badge-ghost">
            {progress.perCollection[collectionId]?.checked ?? 0}/
            {progress.perCollection[collectionId]?.required ?? 0}
          </span>
        </div>
        <p className="text-sm opacity-70">Pieces: {pieces.length}</p>
      </div>

      <div className="card bg-warning/10 p-4 mb-6">
        <h3 className="card-title mb-2">Collection description</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div>Title: {collection?.title ?? "—"}</div>
          <div>Composer: {collection?.composerId ?? "—"}</div>
        </div>
      </div>

      <div className="card bg-base-100 border p-4">
        <h3 className="font-semibold mb-3">Pieces in this collection</h3>
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>No.</th>
                <th>Piece</th>
                <th>Progress</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pieces.map((p: any) => {
                const pieceProg = data.progress.perPiece[p.id] || {
                  required: 0,
                  checked: 0,
                };
                return (
                  <tr key={p.id}>
                    <td>{p.collectionRank ?? "—"}</td>
                    <td>{p.title}</td>
                    <td>
                      <span className="badge badge-ghost">
                        {pieceProg.checked}/{pieceProg.required}
                      </span>
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
    </div>
  );
}
