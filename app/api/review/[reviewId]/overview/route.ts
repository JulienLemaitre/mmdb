import { NextResponse } from "next/server";
import { computeOverviewProgress } from "@/utils/reviewProgress";
import { ApiOverview } from "@/types/reviewTypes";
import { getReviewOverview } from "@/utils/server/getReviewOverview";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ reviewId: string }> },
) {
  try {
    const { reviewId } = await params;
    if (!reviewId)
      return NextResponse.json({ error: "Missing reviewId" }, { status: 400 });

    const { graph, globallyReviewed } = await getReviewOverview(reviewId);

    if (!graph.sourceContents) {
      return NextResponse.json(
        { error: "No content found in MM source" },
        { status: 400 },
      );
    }

    const progress = computeOverviewProgress(graph, {
      globallyReviewed: {
        personIds: new Set(globallyReviewed.personIds ?? []),
        organizationIds: new Set(globallyReviewed.organizationIds ?? []),
        collectionIds: new Set(globallyReviewed.collectionIds ?? []),
        pieceIds: new Set(globallyReviewed.pieceIds ?? []),
      },
    });

    const result: ApiOverview = {
      reviewId,
      graph,
      globallyReviewed,
      sourceContents: graph.sourceContents,
      progress,
    };

    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unexpected server error";
    const lc = msg.toLowerCase();

    // Map common error messages thrown by getReviewOverview to HTTP status codes
    let status = 500;
    if (lc.includes("unauthorized")) status = 401;
    else if (lc.startsWith("forbidden")) status = 403;
    else if (lc.includes("required") || lc.includes("must be")) status = 400;
    else if (lc.includes("not found")) status = 404;

    return NextResponse.json({ error: msg }, { status });
  }
}
