import { db } from "@/utils/server/db";
import deleteNullPropertiesFromObject from "@/utils/deleteNullPropertiesFromObject";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id)
    return new Response(JSON.stringify({ error: "No id provided" }), {
      status: 400,
    });
  const personResult = await db.person.findUnique({
    where: {
      id: id,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      birthYear: true,
      deathYear: true,
    },
  });
  const person = personResult
    ? deleteNullPropertiesFromObject(personResult) // We ensure properties will not be initiated with null values
    : null;

  return Response.json(person);
}
