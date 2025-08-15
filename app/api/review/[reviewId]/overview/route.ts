import { NextResponse } from "next/server";
import { computeOverviewProgress } from "@/utils/reviewProgress";
import { buildMockOverview } from "@/utils/reviewMock";

export async function GET(
  _req: Request,
  { params }: { params: { reviewId: string } },
) {
  const reviewId = params.reviewId;
  const { graph, globallyReviewed } = buildMockOverview(reviewId);
  const progress = computeOverviewProgress(graph, {
    globallyReviewed: {
      personIds: new Set(globallyReviewed.personIds ?? []),
      organizationIds: new Set(globallyReviewed.organizationIds ?? []),
      collectionIds: new Set(globallyReviewed.collectionIds ?? []),
      pieceIds: new Set(globallyReviewed.pieceIds ?? []),
    },
  });

  return NextResponse.json({
    reviewId,
    graph,
    globallyReviewed,
    sourceContents: graph.sourceContents,
    progress,
  });
}
