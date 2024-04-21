import { NextResponse } from "next/server";
import { db } from "@/utils/db";

export async function GET() {
  const tempoIndications = await db.tempoIndication.findMany({
    orderBy: {
      text: "asc",
    },
  });

  return NextResponse.json(tempoIndications);
}
