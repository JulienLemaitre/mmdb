import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";

export async function POST(req: NextRequest) {
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
