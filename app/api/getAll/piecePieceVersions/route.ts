import { db } from "@/utils/server/db";
import deleteNullPropertiesFromObject from "@/utils/deleteNullPropertiesFromObject";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pieceId = searchParams.get("pieceId");
  if (!pieceId)
    return new Response(JSON.stringify({ error: "No pieceId provided" }), {
      status: 400,
    });

  // 1. Fetch all piece version IDs for this piece
  const candidateVersions = await db.pieceVersion.findMany({
    where: {
      pieceId: pieceId,
    },
    select: {
      id: true,
    },
  });

  const candidateIds = candidateVersions.map((v) => v.id);

  if (candidateIds.length === 0) {
    return Response.json({ pieceVersions: [] });
  }

  // 2. Identify which of these versions are reviewed
  const reviewedEntities = await db.reviewedEntity.findMany({
    where: {
      entityType: "PIECE_VERSION",
      entityId: { in: candidateIds },
    },
    select: {
      entityId: true,
    },
  });

  const reviewedIds = reviewedEntities.map((re) => re.entityId);

  // 3. Fetch the details for only the reviewed versions
  const pieceVersionsResult = await db.pieceVersion.findMany({
    where: {
      id: { in: reviewedIds },
    },
    select: {
      id: true,
      category: true,
      pieceId: true,
      movements: {
        select: {
          id: true,
          rank: true,
          key: true,
          sections: {
            select: {
              id: true,
              rank: true,
              metreNumerator: true,
              metreDenominator: true,
              isCommonTime: true,
              isCutTime: true,
              tempoIndication: {
                select: {
                  id: true,
                  text: true,
                },
              },
              comment: true,
              fastestStaccatoNotesPerBar: true,
              fastestStructuralNotesPerBar: true,
              fastestRepeatedNotesPerBar: true,
              fastestOrnamentalNotesPerBar: true,
              isFastestStructuralNoteBelCanto: true,
            },
            orderBy: {
              rank: "asc",
            },
          },
        },
        orderBy: {
          rank: "asc",
        },
      },
    },
  });

  const pieceVersions = pieceVersionsResult.map((pieceVersion: any) => {
    return pieceVersion
      ? deleteNullPropertiesFromObject(pieceVersion) // We ensure properties will not be initiated with null values
      : null;
  });

  return Response.json({ pieceVersions });
}
