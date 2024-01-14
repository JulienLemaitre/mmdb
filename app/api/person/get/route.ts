import { db } from "@/utils/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id)
    return new Response(JSON.stringify({ error: "No id provided" }), {
      status: 400,
    });
  const person = await db.person.findUnique({
    where: {
      id: id,
    },
  });

  return Response.json(person);
}
