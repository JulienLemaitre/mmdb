import { db } from "@/utils/db";
import SourceDescriptionEditForm from "@/app/(signedIn)/edition/source-description/SourceDescriptionEditForm";
import deleteNullPropertiesFromObject from "@/utils/deleteNullPropertiesFromObject";

async function getData(sourceDescriptionId: string) {
  if (!sourceDescriptionId) {
    console.log(`[UpdateSourceDescription] sourceDescriptionId is undefined`);
    return { sourceDescription: null };
  }
  // Fetch the previously selected sourceDescription
  const sourceDescription = await db.source.findUnique({
    where: {
      id: sourceDescriptionId,
    },
    select: {
      id: true,
      type: true,
      title: true,
      year: true,
      link: true,
      references: true,
      comment: true,
    },
  });
  return {
    sourceDescription: sourceDescription
      ? deleteNullPropertiesFromObject(sourceDescription)
      : null,
  };
}

export default async function UpdateSourceDescription({
  params: { id: sourceDescriptionId },
}) {
  const { sourceDescription } = await getData(sourceDescriptionId);
  console.log(
    `[UpdateSourceDescription] sourceDescription`,
    JSON.stringify(sourceDescription, null, 2),
  );

  if (!sourceDescription) {
    return (
      <div className="w-full max-w-md">
        <h1 className="mb-4 text-4xl font-bold">
          Source description update error
        </h1>
        <p className="mb-4 text-lg">
          The source description you are trying to update was not found.
        </p>
      </div>
    );
  }

  const sourceDescriptionInput = {
    id: sourceDescription.id,
    type: sourceDescription.type,
    title: sourceDescription.title,
    year: sourceDescription.year,
    link: sourceDescription.link,
    comment: sourceDescription.comment,
    references: sourceDescription.references,
  };

  return (
    <SourceDescriptionEditForm sourceDescription={sourceDescriptionInput} />
  );
}
