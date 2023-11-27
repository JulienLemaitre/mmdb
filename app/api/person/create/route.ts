import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";

export async function POST(req: NextRequest) {
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
