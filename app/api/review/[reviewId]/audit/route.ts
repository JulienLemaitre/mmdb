import { NextResponse } from "next/server";
import { db } from "@/utils/db";

export async function GET(req: Request, { params }: { params: { reviewId: string } }) {
  const { reviewId } = params;
  const url = new URL(req.url);
  const limitParam = url.searchParams.get("limit");
  const cursor = url.searchParams.get("cursor");

  const limitRaw = limitParam ? parseInt(limitParam, 10) : 20;
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 20;

  try {
    const items = await db.auditLog.findMany({
      where: { reviewId },
      orderBy: { id: "desc" },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const nextCursor = items.length === limit ? items[items.length - 1]?.id ?? null : null;

    return NextResponse.json({ reviewId, items, nextCursor });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Service unavailable: database not reachable", detail: e?.message ?? String(e) },
      { status: 503 },
    );
  }
}
