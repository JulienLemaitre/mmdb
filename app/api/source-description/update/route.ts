import isReqAuthorized from "@/utils/isReqAuthorized";
import getDecodedTokenFromReq from "@/utils/getDecodedTokenFromReq";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
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
  console.log(`[POST piece update] body :`, body);
  const {
    title,
    year,
    type,
    link,
    comment,
    references: referencesInput,
    id,
    pieceVersionId,
  } = body;

  const references: ReferenceTypeAndReference[] = referencesInput.map(
    (reference) => ({
      type: reference.type.value,
      reference: reference.reference,
    }),
  );

  const sourceDescription = await db.mMSource.update({
    where: {
      id,
    },
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
        connectOrCreate: references.map((reference) => ({
          where: {
            type_reference: {
              reference: reference.reference,
              type: reference.type,
            },
          },
          create: {
            type: reference.type,
            reference: reference.reference,
          },
        })),
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

  return NextResponse.json(sourceDescription);
}
