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
  console.log(`[POST person update] body :`, body);
  const { firstName, lastName, birthYear, deathYear, id } = body;

  const person = await db.person.update({
    where: {
      id,
    },
    data: {
      firstName,
      lastName,
      birthYear,
      ...(deathYear && { deathYear }),
      creator: {
        connect: {
          id: creatorId,
        },
      },
    },
  });

  return NextResponse.json(person);
}
