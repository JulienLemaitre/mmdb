import { db } from "@/utils/db";
import ComposerSelectForm from "@/components/ComposerSelectForm";

async function getData() {
  // Fetch all composers as person with et least 1 composition
  const composers = await db.person.findMany({
    // where: {
    //   compositions: {
    //     some: {},
    //   },
    // },
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
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
