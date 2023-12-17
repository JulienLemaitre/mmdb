import { db } from "@/utils/db";
import ComposerSelectForm from "@/app/(signedIn)/edition/composer/ComposerSelectForm";

async function getData() {
  // Fetch all persons as composers
  const composers = await db.person.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      birthYear: true,
      deathYear: true,
    },
    orderBy: [
      {
        lastName: "asc",
      },
      {
        firstName: "asc",
      },
    ],
  });
  return { composers };
}

export default async function Composer() {
  const { composers } = await getData();
  console.log(
    `[Composer] composers (${composers.length}) :`,
    JSON.stringify(composers),
  );

  return (
    <div
    // className="flex flex-col items-center justify-center"
    >
      <h1 className="mb-4 text-4xl font-bold">Select a composer</h1>
      <ComposerSelectForm composers={composers} />
    </div>
  );
}
