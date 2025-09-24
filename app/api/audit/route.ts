import { NextResponse } from "next/server";
import { getAuditLogs } from "@/utils/server/getAuditLogs";

// GET /api/audit?reviewId=...&cursor=...&limit=...
// OR  /api/audit?entityType=PERSON|ORGANIZATION|COLLECTION|PIECE&entityId=...&cursor=...&limit=...
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const reviewId = url.searchParams.get("reviewId");
    const entityType = url.searchParams.get("entityType");
    const entityId = url.searchParams.get("entityId");
    const cursor = url.searchParams.get("cursor");
    const limitStr = url.searchParams.get("limit");
    const limit = limitStr ? parseInt(limitStr, 10) : undefined;

    const hasReview = !!reviewId;
    const hasEntity = !!entityType && !!entityId;

    if ((hasReview && hasEntity) || (!hasReview && !hasEntity)) {
      return NextResponse.json(
        {
          error:
            "Provide exactly one filter: either reviewId OR entityType+entityId",
        },
        { status: 400 },
      );
    }

    const result = await getAuditLogs(
      hasReview
        ? { mode: "review", reviewId: reviewId!, cursor: cursor ?? undefined, limit }
        : {
            mode: "entity",
            entityType: (entityType || "").toUpperCase(),
            entityId: entityId!,
            cursor: cursor ?? undefined,
            limit,
          },
    );

    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unexpected server error";
    const lc = msg.toLowerCase();

    let status = 500;
    if (lc.includes("unauthorized")) status = 401;
    else if (lc.startsWith("forbidden")) status = 403;
    else if (lc.includes("required") || lc.includes("invalid") || lc.includes("provide exactly one")) status = 400;

    return NextResponse.json({ error: msg }, { status });
  }
}
