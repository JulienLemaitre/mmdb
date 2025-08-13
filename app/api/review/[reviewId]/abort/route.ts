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

    const reviewId = params?.reviewId as string | undefined;
    if (!reviewId) {
      return json(
        { error: "[review abort] reviewId is required in route params" },
        { status: 400 },
      );
    }

    // Optional reason in body, not persisted in MVP but accepted to keep API stable
    let reason: string | undefined;
    try {
      const body = await req.json();
      reason = body?.reason;
    } catch {
      // ignore non-JSON or empty body
    }

    const review = await db.review.findUnique({
      where: { id: reviewId },
      select: { id: true, creatorId: true, state: true, mMSourceId: true },
    });
    if (!review) {
      return json({ error: "[review abort] Review not found" }, { status: 404 });
    }

    const isOwner = review.creatorId === session.user.id;
    const isAdmin = role === "ADMIN";
    if (!isOwner && !isAdmin) {
      return json(
        { error: "[review abort] Forbidden: only owner or admin" },
        { status: 403 },
      );
    }

    if (review.state !== REVIEW_STATE.IN_REVIEW) {
      return json(
        { error: "[review abort] Review is not active (IN_REVIEW)" },
        { status: 400 },
      );
    }

    const abortedAt = new Date();

    await db.$transaction(async (tx) => {
      await tx.review.update({
        where: { id: reviewId },
        data: {
          state: REVIEW_STATE.ABORTED,
          endedAt: abortedAt,
          // Could store reason later in dedicated column if needed
        },
      });

      await tx.mMSource.update({
        where: { id: review.mMSourceId },
        data: { reviewState: REVIEW_STATE.ABORTED },
      });
    });

    return json({ ok: true, reviewId, abortedAt, reason: reason ?? null });
  } catch (err) {
    console.error("/api/reviews/[reviewId]/abort error:", err);
    return json({ error: "[gUNX006] Unexpected error" }, { status: 500 });
  }
}
