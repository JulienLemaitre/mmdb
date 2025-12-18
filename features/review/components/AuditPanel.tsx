import { useEffect, useState } from "react";

/**
 * Lightweight read-only audit panel
 * @param reviewId
 */
export default function AuditPanel({ reviewId }: { reviewId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch(`/api/audit?reviewId=${reviewId}&limit=20`);
      const j = await res.json();
      setItems(j.items || []);
      setLoading(false);
    }
    load();
  }, [reviewId]);

  return (
    <div>
      {loading && <div className="text-sm">Loading events...</div>}
      {items.length === 0 && !loading && (
        <div className="text-sm opacity-70">No audit events yet.</div>
      )}
      <ul className="text-sm space-y-1 max-h-64 overflow-auto">
        {items.map((it: any) => (
          <li key={it.id} className="border-b last:border-b-0 pb-1">
            <span className="badge badge-ghost mr-2">{it.operation}</span>
            <span className="opacity-80 mr-2">
              {it.entityType}:{it.entityId}
            </span>
            <span className="opacity-60">
              {new Date(it.createdAt).toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
