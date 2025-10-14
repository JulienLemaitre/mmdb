import { NextResponse } from "next/server";
import { db } from "@/utils/server/db";

// GET /api/audit/search?entityType=&entityId=&reviewId=&cursor=&limit=
// Minimal search endpoint for AuditLog with cursor pagination.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const entityType = url.searchParams.get("entityType");
  const entityId = url.searchParams.get("entityId");
  const reviewId = url.searchParams.get("reviewId");
  const cursor = url.searchParams.get("cursor");
  const limitParam = url.searchParams.get("limit");

  const limitRaw = limitParam ? parseInt(limitParam, 10) : 20;
  const limit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(limitRaw, 1), 100)
    : 20;

  // Build where clause: prefer entityType+entityId, else reviewId. Require at least one of these filters.
  const useEntityFilter = !!entityType && !!entityId;
  const useReviewFilter = !!reviewId;
  if (!useEntityFilter && !useReviewFilter) {
    return NextResponse.json(
      { error: "Missing query: provide entityType+entityId or reviewId" },
      { status: 400 },
    );
  }

  const where: any = {};
  if (useEntityFilter) {
    where.entityType = entityType as any; // Prisma AUDIT_ENTITY_TYPE
    where.entityId = entityId as string;
  }
  if (useReviewFilter) {
    where.reviewId = reviewId as string;
  }

  try {
    const items = await db.auditLog.findMany({
      where,
      orderBy: { id: "desc" },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const nextCursor =
      items.length === limit ? (items[items.length - 1]?.id ?? null) : null;
    return NextResponse.json({ items, nextCursor });
  } catch (e: any) {
    return NextResponse.json(
      {
        error: "Service unavailable: database not reachable",
        detail: e?.message ?? String(e),
      },
      { status: 503 },
    );
  }
}
