import deleteNullPropertiesFromObject from "@/utils/deleteNullPropertiesFromObject";
import { db } from "@/utils/db";
import ComposerEditForm from "@/app/(signedIn)/edition/composer/ComposerEditForm";

async function getData(personId: string) {
  if (!personId) {
    console.log(`[ComposerUpdate] personId is undefined`);
    return { composer: null };
  }
  // Fetch the previously created composer
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
  console.log(`[ComposerUpdate getData] composer :`, composer);
  return {
    composer: composer ? deleteNullPropertiesFromObject(composer) : null,
  };
}

export default async function ComposerUpdate({ params: { id: personId } }) {
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
