import { db } from "@/utils/server/db";
import { comparePersons } from "@/features/composer/utils";
import { compareOrganizations } from "@/features/organization/utils";

export async function GET() {
  // Fetch all persons
  const personsFetch = db.person.findMany({
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
    personsFetch,
    organizationsFetch,
  ]);

  return Response.json({
    persons: persons.sort(comparePersons),
    organizations: organizations.sort(compareOrganizations),
  });
}
