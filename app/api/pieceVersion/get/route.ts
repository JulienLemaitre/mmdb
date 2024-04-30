import { db } from "@/utils/db";
import deleteNullPropertiesFromObject from "@/utils/deleteNullPropertiesFromObject";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id)
    return new Response(JSON.stringify({ error: "No id provided" }), {
      status: 400,
    });
  const pieceVersionResult = await db.pieceVersion.findUnique({
    where: {
      id: id,
    },
    select: {
      id: true,
      category: true,
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
  const pieceVersion = pieceVersionResult
    ? deleteNullPropertiesFromObject(pieceVersionResult) // We ensure properties will not be initiated with null values
    : null;

  return Response.json(pieceVersion);
}
