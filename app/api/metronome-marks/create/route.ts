import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { MetronomeMarksInput } from "@/types/editFormTypes";
import isReqAuthorized from "@/utils/isReqAuthorized";

export async function POST(req: NextRequest) {
  if (!isReqAuthorized(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const body = await req.json();
  console.log(`[POST metronome marks] body :`, body);
  const { metronomeMarks, sourceId } = body;

  const metronomeMarksRes = await db.metronomeMark.createMany({
    data: metronomeMarks.map((metronomeMark: MetronomeMarksInput) => ({
      sourceId: sourceId,
      sectionId: metronomeMark.sectionId,
      bpm: metronomeMark.bpm,
      beatUnit: metronomeMark.beatUnit.value,
    })),
  });
  console.log(
    `[API metronome marks create] metronomeMarksRes :`,
    metronomeMarksRes,
  );

  return NextResponse.json({
    ok: !!metronomeMarksRes?.count,
    ...metronomeMarksRes,
  });
}
