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
        { error: "[selfEdit abort] Unauthorized" },
        { status: 401 },
      );
    }

    const { sourceId } = await params;
    if (!sourceId) {
      return NextResponse.json(
        { error: "[selfEdit abort] Missing sourceId in route parameters" },
        { status: 400 },
      );
    }

    const source = await db.mMSource.findUnique({
      where: { id: sourceId },
      select: { id: true, creatorId: true, reviewState: true },
    });

    if (!source) {
      return NextResponse.json(
        { error: "[selfEdit abort] MM Source not found" },
        { status: 404 },
      );
    }

    const isOwner = source.creatorId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "[selfEdit abort] Forbidden: only creator or admin" },
        { status: 403 },
      );
    }

    if (source.reviewState !== REVIEW_STATE.IN_SELF_EDIT) {
      return NextResponse.json(
        { error: "[selfEdit abort] Source is not currently in self-edit" },
        { status: 400 },
      );
    }

    await db.$transaction(async (tx) => {
      await tx.mMSource.update({
        where: { id: sourceId },
        data: { reviewState: REVIEW_STATE.PENDING },
      });
    });

    return NextResponse.json({
      ok: true,
      mMSourceId: sourceId,
    });
  } catch (err: any) {
    console.error("/api/source/[sourceId]/edit/abort error:", err);
    return NextResponse.json(
      { error: "[selfEdit abort] Unexpected error" },
      { status: 500 },
    );
  }
}
