import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/options";
import { db } from "@/utils/server/db";
import { REVIEW_STATE } from "@/prisma/client";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ sourceId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "[selfEdit start] Unauthorized" },
        { status: 401 },
      );
    }

    const { sourceId } = await params;
    if (!sourceId) {
      return NextResponse.json(
        { error: "[selfEdit start] Missing sourceId in route parameters" },
        { status: 400 },
      );
    }

    const source = await db.mMSource.findUnique({
      where: { id: sourceId },
      select: { id: true, creatorId: true, reviewState: true },
    });

    if (!source) {
      return NextResponse.json(
        { error: "[selfEdit start] MM Source not found" },
        { status: 404 },
      );
    }

    if (source.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: "[selfEdit start] Forbidden: only creator can edit" },
        { status: 403 },
      );
    }

    if (source.reviewState === REVIEW_STATE.IN_REVIEW) {
      return NextResponse.json(
        {
          error:
            "[selfEdit start] A review is currently in progress on this MM Source",
        },
        { status: 409 },
      );
    }

    const activeReview = await db.review.findFirst({
      where: { mMSourceId: sourceId, state: REVIEW_STATE.IN_REVIEW },
      select: { id: true },
    });

    if (activeReview) {
      return NextResponse.json(
        {
          error:
            "[selfEdit start] A review is currently in progress on this MM Source",
        },
        { status: 409 },
      );
    }

    if (source.reviewState === REVIEW_STATE.IN_SELF_EDIT) {
      return NextResponse.json({
        success: true,
        mMSourceId: sourceId,
        status: "resumed",
      });
    }

    if (source.reviewState !== REVIEW_STATE.PENDING) {
      return NextResponse.json(
        { error: "[selfEdit start] Only PENDING MM Sources can be edited" },
        { status: 400 },
      );
    }

    await db.$transaction(async (tx) => {
      await tx.mMSource.update({
        where: { id: sourceId },
        data: { reviewState: REVIEW_STATE.IN_SELF_EDIT },
      });
    });

    return NextResponse.json({
      success: true,
      mMSourceId: sourceId,
      status: "locked",
    });
  } catch (err: any) {
    console.error("/api/source/[sourceId]/edit/start error:", err);
    return NextResponse.json(
      { error: "[selfEdit start] Unexpected error" },
      { status: 500 },
    );
  }
}
