import { db } from "@/utils/db";
import deleteNullPropertiesFromObject from "@/utils/deleteNullPropertiesFromObject";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const composerId = searchParams.get("composerId");
  if (!composerId)
    return new Response(JSON.stringify({ error: "No composerId provided" }), {
      status: 400,
    });
  const piecesResult = await db.piece.findMany({
    where: {
      composerId: composerId,
    },
    select: {
      id: true,
      title: true,
      nickname: true,
      yearOfComposition: true,
    },
  });
  const pieces = piecesResult.map((piece: any) => {
    return piece
      ? deleteNullPropertiesFromObject(piece) // We ensure properties will not be initiated with null values
      : null;
  });

  return Response.json({ pieces });
}
