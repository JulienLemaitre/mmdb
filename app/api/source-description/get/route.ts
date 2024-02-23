import { db } from "@/utils/db";
import deleteNullPropertiesFromObject from "@/utils/deleteNullPropertiesFromObject";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id)
    return new Response(JSON.stringify({ error: "No id provided" }), {
      status: 400,
    });
  const sourceDescriptionResult = await db.source.findUnique({
    where: {
      id,
    },
    select: {
      comment: true,
      id: true,
      link: true,
      references: true,
      title: true,
      type: true,
      year: true,
    },
  });
  const sourceDescription = sourceDescriptionResult
    ? deleteNullPropertiesFromObject(sourceDescriptionResult) // We ensure properties will not be initiated with null values
    : null;
  return Response.json(sourceDescription);
}
