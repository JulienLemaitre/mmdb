import {
  SourceDescriptionInput,
  MMSourceDescriptionState,
} from "@/types/formTypes";

export default function getMMSourceDescriptionStateFromInput(
  sourceDescriptionInput: SourceDescriptionInput,
): MMSourceDescriptionState {
  const { id, title, year, isYearEstimated, type, link, comment, references } =
    sourceDescriptionInput;

  return {
    id,
    title: title ?? null,
    year,
    isYearEstimated,
    type: type.value as MMSourceDescriptionState["type"],
    link,
    comment: comment ?? null,
    references: (references ?? []).map((reference) => ({
      id: reference.id,
      type: reference.type
        .value as MMSourceDescriptionState["references"][0]["type"],
      reference: reference.reference,
    })),
  };
}
