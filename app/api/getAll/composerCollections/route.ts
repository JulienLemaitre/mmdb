import { db } from "@/utils/server/db";
import deleteNullPropertiesFromObject from "@/utils/deleteNullPropertiesFromObject";
import { Prisma } from "@/prisma/client";
import { CollectionState } from "@/types/formTypes";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const composerId = searchParams.get("composerId");
  if (!composerId)
    return new Response(JSON.stringify({ error: "No composerId provided" }), {
      status: 400,
    });

  const collectionSelect = {
    id: true,
    composerId: true,
    title: true,
    _count: {
      select: {
        pieces: true,
      },
    },
  } satisfies Prisma.CollectionSelect;

  type CollectionWithPieces = Prisma.CollectionGetPayload<{
    select: typeof collectionSelect;
  }>;

  let collections = [] as CollectionState[];
  const collectionsWithPiecesResult = await db.collection.findMany({
    where: {
      composerId: composerId,
    },
    select: collectionSelect,
  });
  if (collectionsWithPiecesResult.length > 0) {
    collections = collectionsWithPiecesResult
      .map((collection: CollectionWithPieces) =>
        deleteNullPropertiesFromObject(collection),
      )
      .map((c) => ({
        id: c.id,
        title: c.title ?? null,
        composerId: c.composerId ?? null,
        pieceCount: c._count.pieces,
      }));
    // TODO: explore for type: https://stackoverflow.com/a/69943634/4676117
  }

  return Response.json({ collections });
}
