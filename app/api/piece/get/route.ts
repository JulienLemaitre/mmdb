import { db } from "@/utils/server/db";
import deleteNullPropertiesFromObject from "@/utils/deleteNullPropertiesFromObject";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id)
    return new Response(JSON.stringify({ error: "No id provided" }), {
      status: 400,
    });
  const pieceResult = await db.piece.findUnique({
    where: {
      id: id,
    },
    select: {
      id: true,
      title: true,
      nickname: true,
      yearOfComposition: true,
    },
  });
  const piece = pieceResult
    ? deleteNullPropertiesFromObject(pieceResult) // We ensure properties will not be initiated with null values
    : null;

  return Response.json(piece);
}
