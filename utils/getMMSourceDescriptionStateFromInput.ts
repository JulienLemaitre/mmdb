import {
  SourceDescriptionInput,
  MMSourceDescriptionState,
} from "@/types/formTypes";

export default function getMMSourceDescriptionStateFromInput(
  sourceDescriptionInput: SourceDescriptionInput,
): MMSourceDescriptionState {
  const { id, title, year, type, link, comment, references } =
    sourceDescriptionInput;

  const sourceDescriptionState: MMSourceDescriptionState = {
    id,
    title: title ?? null,
    year: year,
    type: type.value as MMSourceDescriptionState["type"],
    link,
    comment: comment ?? null,
    references: (references ?? []).map((reference) => ({
      type: reference.type
        .value as MMSourceDescriptionState["references"][0]["type"],
      reference: reference.reference,
    })),
  };

  return sourceDescriptionState;
}
