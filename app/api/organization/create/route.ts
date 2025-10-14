import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/server/db";
import isReqAuthorized from "@/utils/server/isReqAuthorized";

export async function POST(req: NextRequest) {
  if (!isReqAuthorized(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

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
