import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import isReqAuthorized from "@/utils/isReqAuthorized";
import getDecodedTokenFromReq from "@/utils/getDecodedTokenFromReq";
import { ReferenceTypeAndReference } from "@/types/editFormTypes";

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

  const references: ReferenceTypeAndReference[] = referencesInput.map(
    (reference) => ({
      type: reference.type.value,
      reference: reference.reference,
    }),
  );

  const source = await db.mMSource.create({
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
      references: {
        create: references,
      },
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
