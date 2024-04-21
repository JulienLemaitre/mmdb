import { db } from "@/utils/db";
import ComposerSelectForm from "@/components/entities/composer/ComposerSelectForm";

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

  return (
    <div className="w-full max-w-md">
      <h1 className="mb-4 text-4xl font-bold">Select a composer</h1>
      <p className="italic">
        {`Search by typing the name.
          If it is not listed yet, you will be able to create it.`}
      </p>
      <ComposerSelectForm
        composers={composers}
        onComposerSelect={(composer) => {}}
        onComposerCreationClick={() => console.log("onComposerCreationClick")}
      />
    </div>
  );
}
