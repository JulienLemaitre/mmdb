import { db } from "@/utils/db";

export async function GET(request: Request) {
  // Fetch all persons
  const personsFecth = db.person.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      birthYear: true,
      deathYear: true,
    },
  });

  // Fetch all organizations
  const organizationsFetch = db.organization.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  const [persons, organizations] = await Promise.all([
    personsFecth,
    organizationsFetch,
  ]);

  return Response.json({ persons, organizations });
}
