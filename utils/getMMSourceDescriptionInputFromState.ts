import {
  SourceDescriptionInput,
  MMSourceDescriptionState,
} from "@/types/formTypes";
import getReferenceTypeLabel from "@/utils/getReferenceTypeLabel";
import formatToPhraseCase from "@/utils/formatToPhraseCase";

export default function getMMSourceDescriptionInputFromState(
  sourceDescription?: MMSourceDescriptionState,
): SourceDescriptionInput | undefined {
  if (!sourceDescription) {
    return;
  }

  const { id, title, year, isYearEstimated, type, link, comment, references } =
    sourceDescription;

  // Convert the 'type' and 'references' properties to match the SourceDescriptionInput type
  const sourceDescriptionInput: SourceDescriptionInput = {
    id,
    ...(title ? { title } : {}),
    year,
    isYearEstimated,
    link,
    type: { value: type, label: formatToPhraseCase(type) },
    ...(comment ? { comment } : {}),
    ...(references.length > 0
      ? {
          references: references.map((reference) => ({
            type: {
              value: reference.type,
              label: getReferenceTypeLabel(reference.type),
            },
            reference: reference.reference,
          })),
        }
      : {
          references: [],
        }),
  };

  return sourceDescriptionInput;
}
