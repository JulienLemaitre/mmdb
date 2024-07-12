import { db } from "@/utils/db";
import deleteNullPropertiesFromObject from "@/utils/deleteNullPropertiesFromObject";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const composerId = searchParams.get("composerId");
  if (!composerId)
    return new Response(JSON.stringify({ error: "No composerId provided" }), {
      status: 400,
    });
  const collectionsResult = await db.collection.findMany({
    where: {
      composerId: composerId,
    },
    select: {
      id: true,
      title: true,
      _count: {
        select: {
          pieces: true,
        },
      },
    },
  });
  const collections = collectionsResult.map((collection: any) => {
    return collection
      ? deleteNullPropertiesFromObject(collection) // We ensure properties will not be initiated with null values
      : null;
  });

  return Response.json({ collections });
}
