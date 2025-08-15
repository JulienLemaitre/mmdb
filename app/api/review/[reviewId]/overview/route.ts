import { NextResponse } from "next/server";
import { computeOverviewProgress } from "@/utils/reviewProgress";
import { buildMockOverview } from "@/utils/reviewMock";

export async function GET(
  _req: Request,
  { params }: { params: { reviewId: string } },
) {
  const reviewId = params.reviewId;
  const { graph, globallyReviewed } = buildMockOverview(reviewId);
  const progress = computeOverviewProgress(graph);

  return NextResponse.json({
    reviewId,
    graph,
    globallyReviewed,
    sourceContents: graph.sourceContents,
    progress,
  });
}
