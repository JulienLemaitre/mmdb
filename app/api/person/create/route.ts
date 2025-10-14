import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/server/db";
import isReqAuthorized from "@/utils/server/isReqAuthorized";
import getDecodedTokenFromReq from "@/utils/server/getDecodedTokenFromReq";

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
  console.log(`[POST person] body :`, body);
  const { firstName, lastName, birthYear, deathYear } = body;

  const person = await db.person.create({
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
