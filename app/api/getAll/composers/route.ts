import { db } from "@/utils/server/db";
import { comparePersons } from "@/utils/sort/comparePersons";

export async function GET() {
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

  return Response.json({ composers: composers.sort(comparePersons) });
}
