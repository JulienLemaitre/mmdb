import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { MetronomeMarksInput } from "@/types/editFormTypes";

export async function POST(req: NextRequest) {
  const body = await req.json();
  console.log(`[POST metronome marks] body :`, body);
  const { metronomeMarks, sourceId } = body;

  const organization = await db.metronomeMark.createMany({
    data: metronomeMarks.map((metronomeMark: MetronomeMarksInput) => ({
      sourceId: sourceId,
      sectionId: metronomeMark.sectionId,
      bpm: metronomeMark.bpm,
      beatUnit: metronomeMark.beatUnit.value,
    })),
  });

  return NextResponse.json(organization);
}
