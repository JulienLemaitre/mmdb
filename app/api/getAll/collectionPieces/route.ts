import { db } from "@/utils/server/db";
import deleteNullPropertiesFromObject from "@/utils/deleteNullPropertiesFromObject";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const collectionId = searchParams.get("collectionId");
  if (!collectionId)
    return new Response(JSON.stringify({ error: "No collectionId provided" }), {
      status: 400,
    });
  const piecesResult = await db.piece.findMany({
    where: {
      collectionId: collectionId,
    },
    select: {
      id: true,
      title: true,
      nickname: true,
      yearOfComposition: true,
      collectionId: true,
      collectionRank: true,
      composerId: true,
    },
  });
  const pieces = piecesResult.map((collection: any) => {
    return collection
      ? deleteNullPropertiesFromObject(collection) // We ensure properties will not be initiated with null values
      : null;
  });

  return Response.json({ pieces });
}
