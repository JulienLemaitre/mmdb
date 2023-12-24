export const dynamic = "force-dynamic";
export const revalidate = 0;

import { db } from "@/utils/db";
import ComposerEditForm from "@/app/(signedIn)/edition/composer/ComposerEditForm";

async function getData(personId: string) {
  if (!personId) {
    console.log(`[ComposerUpdate] personId is undefined`);
    return { composer: null };
  }
  // Fetch the previously selected composer
  const composer = await db.person.findUnique({
    where: {
      id: personId,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      birthYear: true,
      deathYear: true,
    },
  });
  return { composer };
}

export default async function ComposerUpdate({ searchParams: { personId } }) {
  const { composer } = await getData(personId);
  console.log(`[ComposerUpdate] composer :`, JSON.stringify(composer));

  if (!composer) {
    return (
      <div className="w-full max-w-md">
        <h1 className="mb-4 text-4xl font-bold">Composer update error</h1>
        <p className="mb-4 text-lg">
          The composer you are trying to update was not found.
        </p>
      </div>
    );
  }

  return <ComposerEditForm composer={composer} />;
}
