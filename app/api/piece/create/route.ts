import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  console.log(`[POST piece] body :`, body);
  const { title, nickname, yearOfComposition, composerId } = body;

  const piece = await db.piece.create({
    data: {
      title,
      composerId,
      ...(yearOfComposition && { yearOfComposition }),
      ...(nickname && { nickname }),
    },
  });

  return NextResponse.json(piece);
}
