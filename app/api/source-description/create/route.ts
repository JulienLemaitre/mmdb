import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { Prisma } from "@prisma/client";
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
  console.log(`[POST source-description] body :`, JSON.stringify(body));
  const {
    title,
    type,
    link,
    year,
    references: referencesInput = [],
    comment,
    pieceVersionId,
  } = body;

  const references = referencesInput.map((reference) => ({
    type: reference.type.value,
    reference: reference.reference,
  })) as Prisma.JsonArray;

  const source = await db.source.create({
    data: {
      pieceVersions: {
        connect: {
          id: pieceVersionId,
        },
      },
      creator: {
        connect: {
          id: creatorId,
        },
      },
      title,
      type: type.value,
      link,
      year,
      references,
      ...(comment && { comment }),
    },
    select: {
      id: true,
      title: true,
      type: true,
      link: true,
      year: true,
      references: true,
      comment: true,
    },
  });

  return NextResponse.json(source);
}
