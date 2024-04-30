import { db } from "@/utils/db";
import deleteNullPropertiesFromObject from "@/utils/deleteNullPropertiesFromObject";

type RequestBody = {
  idList: string[];
};

export async function POST(request: Request) {
  const body = (await request.json()) as RequestBody;
  console.log(`[] body :`, body);
  const { idList } = body;
  if (!idList || idList.length === 0)
    return new Response(JSON.stringify({ error: "No idList provided" }), {
      status: 400,
    });
  const pieceVersionsResult = await db.pieceVersion.findMany({
    where: {
      id: { in: idList },
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
  const pieceVersions = pieceVersionsResult.map((pieceVersion) => {
    return pieceVersion
      ? deleteNullPropertiesFromObject(pieceVersion) // We ensure properties will not be initiated with null values
      : null;
  });

  return Response.json(pieceVersions);
}
