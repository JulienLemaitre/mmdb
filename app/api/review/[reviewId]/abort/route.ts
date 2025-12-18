import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/utils/server/db";
import { REVIEW_STATE } from "@/prisma/client/enums";
import { authOptions } from "@/auth/options";

export async function POST(
  req: Request,
  props: { params: Promise<{ reviewId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "[review abort] Unauthorized" },
        { status: 401 },
      );
    }

    const role = session.user.role;
    if (!role || !["REVIEWER", "ADMIN"].includes(role)) {
      return NextResponse.json(
        { error: "[review abort] Forbidden: reviewer role required" },
        { status: 403 },
      );
    }

    const { reviewId } = await props.params;
    if (!reviewId) {
      return NextResponse.json(
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
      return NextResponse.json(
        { error: "[review abort] Review not found" },
        { status: 404 },
      );
    }

    const isOwner = review.creatorId === session.user.id;
    const isAdmin = role === "ADMIN";
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "[review abort] Forbidden: only owner or admin" },
        { status: 403 },
      );
    }

    if (review.state !== REVIEW_STATE.IN_REVIEW) {
      return NextResponse.json(
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

    return NextResponse.json({
      ok: true,
      reviewId,
      abortedAt,
      reason: reason ?? null,
    });
  } catch (err) {
    console.error("/api/reviews/[reviewId]/abort error:", err);
    return NextResponse.json(
      { error: "[gUNX006] Unexpected error" },
      { status: 500 },
    );
  }
}
