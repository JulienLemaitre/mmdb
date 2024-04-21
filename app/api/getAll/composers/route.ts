import { db } from "@/utils/db";

export async function GET(request: Request) {
  // Fetch all composers
  const composers = await db.person.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      birthYear: true,
      deathYear: true,
    },
  });

  return Response.json({ composers });
}
