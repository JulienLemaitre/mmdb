import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/utils/db";
import { REVIEW_STATE } from "@prisma/client";
import { authOptions } from "@/auth/options";

function json(data: unknown, init?: any) {
  return NextResponse.json(data as any, init as any);
}

export async function POST(req: Request, { params }: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return json({ error: "[review abort] Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;
    if (!role || !["REVIEWER", "ADMIN"].includes(role)) {
      return json(
        { error: "[review abort] Forbidden: reviewer role required" },
        { status: 403 },
      );
    }

    const reviewId = params?.reviewId as string;
    if (!reviewId) {
      return json(
        { error: "[review abort] reviewId param is required" },
        { status: 400 },
      );
    }

    const review = await db.review.findUnique({
      where: { id: reviewId },
      select: { id: true, creatorId: true, state: true, mMSourceId: true },
    });
    if (!review) {
      return json(
        { error: "[review abort] Review not found" },
        { status: 404 },
      );
    }

    const isOwner = review.creatorId === session.user.id;
    const isAdmin = role === "ADMIN";
    if (!isOwner && !isAdmin) {
      return json(
        { error: "[review abort] Forbidden: only owner or admin can abort" },
        { status: 403 },
      );
    }

    if (review.state !== REVIEW_STATE.IN_REVIEW) {
      return json(
        { error: "[review abort] Only IN_REVIEW reviews can be aborted" },
        { status: 400 },
      );
    }

    await db.$transaction(async (tx) => {
      await tx.review.update({
        where: { id: reviewId },
        data: { state: REVIEW_STATE.ABORTED, endedAt: new Date() },
      });

      await tx.mMSource.update({
        where: { id: review.mMSourceId },
        data: { reviewState: REVIEW_STATE.ABORTED },
      });
    });

    return json({ ok: true });
  } catch (err) {
    console.error("/api/reviews/[reviewId]/abort error:", err);
    return json({ error: "[review abort] Unexpected error" }, { status: 500 });
  }
}
