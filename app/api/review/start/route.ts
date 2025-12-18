import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/utils/server/db";
import { REVIEW_STATE } from "@/prisma/client/enums";
import { authOptions } from "@/auth/options";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "[review start] Unauthorized" },
        { status: 401 },
      );
    }

    const role = session.user.role;
    if (!role || !["REVIEWER", "ADMIN"].includes(role)) {
      return NextResponse.json(
        { error: "[review start] Forbidden: reviewer role required" },
        { status: 403 },
      );
    }

    const body = await req.json().catch(() => null);
    const mmSourceId: string | undefined = body?.mmSourceId;
    if (!mmSourceId || typeof mmSourceId !== "string") {
      return NextResponse.json(
        { error: "[review start] mmSourceId is required" },
        { status: 400 },
      );
    }

    // Fetch source and basic validations
    const source = await db.mMSource.findUnique({
      where: { id: mmSourceId },
      select: { id: true, creatorId: true, reviewState: true },
    });
    if (!source) {
      return NextResponse.json(
        { error: "[review start] MMSource not found" },
        { status: 404 },
      );
    }

    if (source.creatorId && source.creatorId === session.user.id) {
      return NextResponse.json(
        { error: "[review start] Reviewer cannot review own MM Source" },
        { status: 400 },
      );
    }

    // Check existing active review lock
    const active = await db.review.findFirst({
      where: { mMSourceId: mmSourceId, state: REVIEW_STATE.IN_REVIEW },
      select: { id: true },
    });
    if (active) {
      return NextResponse.json(
        { error: "[review start] Review already in progress for this source" },
        { status: 409 },
      );
    }

    // Create review and flip MMSource state atomically
    const result = await db.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: {
          mMSourceId: mmSourceId,
          creatorId: session.user.id,
          state: REVIEW_STATE.IN_REVIEW,
          // startedAt has default now()
        },
        select: { id: true },
      });

      await tx.mMSource.update({
        where: { id: mmSourceId },
        data: { reviewState: REVIEW_STATE.IN_REVIEW },
      });

      return review.id;
    });

    return NextResponse.json({ reviewId: result });
  } catch (err: any) {
    // If unique partial index is enforced, a race condition could throw here; translate to 409
    const message =
      typeof err?.message === "string" ? err.message : String(err);
    const isConflict = /unique|constraint|duplicate/i.test(message);
    if (isConflict) {
      return NextResponse.json(
        { error: "[review start] Another review just started for this source" },
        { status: 409 },
      );
    }
    console.error("/api/reviews/start error:", err);
    return NextResponse.json(
      { error: "[review start] Unexpected error" },
      { status: 500 },
    );
  }
}
