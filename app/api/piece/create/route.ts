import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import isReqAuthorized from "@/utils/isReqAuthorized";
import getDecodedTokenFromReq from "@/utils/getDecodedTokenFromReq";

export async function POST(req: NextRequest) {
  if (!isReqAuthorized(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const decodedToken = await getDecodedTokenFromReq(req);
  const creatorId = decodedToken?.id;
  if (!creatorId) {
    return new Response(JSON.stringify({ error: "Unauthorized creator" }), {
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
      creator: {
        connect: {
          id: creatorId,
        },
      },
      composer: {
        connect: {
          id: composerId,
        },
      },
    },
  });

  return NextResponse.json(piece);
}
