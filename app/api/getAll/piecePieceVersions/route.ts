import { db } from "@/utils/server/db";
import deleteNullPropertiesFromObject from "@/utils/deleteNullPropertiesFromObject";
import {
  pieceVersionSelect,
  PieceVersion,
  tempoIndicationSelect,
} from "@/types/prismaSelections";
import { getTempoIndicationIdListFromPieceVersionList } from "@/features/pieceVersion/utils/getTempoIndicationIdListFromPieceVersionList";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pieceId = searchParams.get("pieceId");
  if (!pieceId)
    return new Response(JSON.stringify({ error: "No pieceId provided" }), {
      status: 400,
    });

  const pieceVersionsResult = await db.pieceVersion.findMany({
    where: {
      pieceId: pieceId,
    },
    select: pieceVersionSelect,
  });

  const pieceVersions: PieceVersion[] = pieceVersionsResult.map(
    (pieceVersion: any) => {
      return pieceVersion
        ? deleteNullPropertiesFromObject(pieceVersion) // We ensure properties will not be initiated with null values
        : null;
    },
  );

  const tempoIndicationIdList =
    getTempoIndicationIdListFromPieceVersionList(pieceVersions);

  const tempoIndications = await db.tempoIndication.findMany({
    where: {
      id: { in: tempoIndicationIdList },
    },
    select: tempoIndicationSelect,
  });

  return Response.json({ pieceVersions, tempoIndications });
}
