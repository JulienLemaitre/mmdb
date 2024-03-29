import {
  SourceDescriptionInput,
  SourceDescriptionState,
} from "@/types/editFormTypes";

export default function getSourceDescriptionInputFromState(
  sourceDescription: SourceDescriptionState,
): SourceDescriptionInput {
  const { id, title, year, type, link, comment, references } =
    sourceDescription;

  // Convert the 'type' and 'references' properties to match the SourceDescriptionInput type
  const sourceDescriptionInput: SourceDescriptionInput = {
    id,
    ...(title ? { title } : {}),
    year,
    link,
    type: { value: type, label: type },
    ...(comment ? { comment } : {}),
    ...(references.length > 0
      ? {
          references: references.map((reference) => ({
            type: { value: reference.type, label: reference.type },
            reference: reference.reference,
          })),
        }
      : {}),
  };

  return sourceDescriptionInput;
}
