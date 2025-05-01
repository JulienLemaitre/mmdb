import { db } from "@/utils/db";
import deleteNullPropertiesFromObject from "@/utils/deleteNullPropertiesFromObject";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const composerId = searchParams.get("composerId");
  if (!composerId)
    return new Response(JSON.stringify({ error: "No composerId provided" }), {
      status: 400,
    });

  const collectionSelect = Prisma.validator<Prisma.CollectionSelect>()({
    id: true,
    composerId: true,
    title: true,
    // pieces: {
    //   select: {
    //     id: true,
    //     title: true,
    //     nickname: true,
    //     yearOfComposition: true,
    //   },
    // },
  });

  type CollectionWithPieces = Prisma.CollectionGetPayload<{
    select: typeof collectionSelect;
  }>;

  const collectionsWithPiecesResult = await db.collection.findMany({
    where: {
      composerId: composerId,
    },
    select: collectionSelect,
  });
  const collectionsWithPieces = collectionsWithPiecesResult.map(
    (collection: CollectionWithPieces) => {
      return collection
        ? deleteNullPropertiesFromObject(collection) // We ensure properties will not be initiated with null values
        : null;
    },
  );
  // TODO: explore for type: https://stackoverflow.com/a/69943634/4676117

  return Response.json({ collections: collectionsWithPieces });
}
