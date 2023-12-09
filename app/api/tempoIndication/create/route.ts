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
  console.log(`[POST tempoIndication] body :`, body);
  const { text } = body;

  const tempoIndication = await db.tempoIndication.create({
    data: {
      text,
    },
  });

  return NextResponse.json(tempoIndication);
}
