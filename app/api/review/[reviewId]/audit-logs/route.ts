import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/options";
import { getAuditLogs } from "@/utils/server/getAuditLogs";
import { db } from "@/utils/server/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ reviewId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.user.role || !["REVIEWER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json(
      { error: "Forbidden: reviewer role required" },
      { status: 403 },
    );
  }

  const { reviewId } = await params;
  if (!reviewId) {
    return NextResponse.json({ error: "reviewId is required" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const limitRaw = Number(searchParams.get("limit"));
  const limit = Number.isFinite(limitRaw) ? limitRaw : undefined;
  const cursor = searchParams.get("cursor");

  const result = await getAuditLogs({
    mode: "review",
    reviewId,
    cursor,
    limit,
  });

  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: {
      startedAt: true,
      endedAt: true,
      creator: { select: { name: true, email: true } },
      mMSource: { select: { title: true } },
    },
  });

  const authorName = review?.creator?.name || review?.creator?.email || null;
  const dateValue = (review?.endedAt ?? review?.startedAt) ?? null;

  return NextResponse.json({
    ...result,
    review: review
      ? {
          sourceTitle: review.mMSource?.title ?? null,
          authorName,
          date: dateValue ? dateValue.toISOString() : null,
        }
      : null,
  });
}
