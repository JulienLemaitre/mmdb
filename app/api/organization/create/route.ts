import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  console.log(`[POST organization] body :`, body);
  const { name } = body;

  const organization = await db.organization.create({
    data: {
      name,
    },
  });

  return NextResponse.json(organization);
}
