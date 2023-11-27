import { db } from "@/utils/db";
import SourceContributionSelectForm from "@/components/SourceContributionSelectForm";

async function getData() {
  // Fetch all persons
  const persons = await db.person.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  });

  // Fetch all organizations
  const organizations = await db.organization.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  return { persons, organizations };
}

export default async function SourceContribution() {
  const { persons, organizations } = await getData();

  return (
    <div>
      <h1 className="mb-4 text-4xl font-bold">Add contributions</h1>
      <SourceContributionSelectForm
        persons={persons}
        organizations={organizations}
      />
    </div>
  );
}
