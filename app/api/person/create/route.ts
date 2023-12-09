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
  console.log(`[POST person] body :`, body);
  const { firstName, lastName, birthYear, deathYear } = body;

  const person = await db.person.create({
    data: {
      firstName,
      lastName,
      birthYear,
      ...(deathYear && { deathYear }),
    },
  });

  return NextResponse.json(person);
}
