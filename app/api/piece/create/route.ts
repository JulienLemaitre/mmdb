import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import isReqAuthorized from "@/utils/isReqAuthorized";

export async function POST(req: NextRequest) {
  if (!isReqAuthorized(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const body = await req.json();
  console.log(`[POST piece] body :`, body);
  const { title, nickname, yearOfComposition, composerId } = body;

  const piece = await db.piece.create({
    data: {
      title,
      ...(yearOfComposition && { yearOfComposition }),
      ...(nickname && { nickname }),
      composer: {
        connect: {
          id: composerId,
        },
      },
    },
  });

  return NextResponse.json(piece);
}
