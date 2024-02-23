import {
  SourceDescriptionInput,
  SourceDescriptionState,
} from "@/types/editFormTypes";

export default function getSourceDescriptionStateFromInput(
  sourceDescriptionInput: SourceDescriptionInput,
): SourceDescriptionState {
  const { id, title, year, type, link, comment, references } =
    sourceDescriptionInput;

  const sourceDescriptionState: SourceDescriptionState = {
    id,
    title: title ?? null,
    year,
    type: type.value as SourceDescriptionState["type"],
    link,
    comment: comment ?? null,
    references: (references ?? []).map((reference) => ({
      type: reference.type
        .value as SourceDescriptionState["references"][0]["type"],
      reference: reference.reference,
    })),
  };

  return sourceDescriptionState;
}
