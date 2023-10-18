import { db } from "@/utils/db";
import ComposerSelect from "@/components/ComposerSelect";

async function getData() {
  // Fetch all composers as person with et least 1 composition
  const composers = await db.person.findMany({
    where: {
      compositions: {
        some: {},
      },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  });
  return { composers };
}

export default async function Contribute() {
  const { composers } = await getData();
  console.log(
    `[Contribute] composers (${composers.length}) :`,
    JSON.stringify(composers, ["firstName", "lastName"]),
  );

  return (
    <div className="flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">Select a composer</h1>
      <ComposerSelect composers={composers} />
      <button className="btn mt-4">Next</button>
    </div>
  );
}
