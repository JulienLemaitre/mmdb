import {
  SourceDescriptionInput,
  MMSourceDescriptionState,
} from "@/types/formTypes";

function normalizeOptionalYear(
  year: SourceDescriptionInput["year"],
): number | null {
  if (year == null) {
    return null;
  }
  if (typeof year === "number" && Number.isNaN(year)) {
    return null;
  }
  return year;
}

export default function getMMSourceDescriptionStateFromInput(
  sourceDescriptionInput: SourceDescriptionInput,
): MMSourceDescriptionState {
  const { id, title, year, isYearEstimated, type, link, comment, references } =
    sourceDescriptionInput;

  const normalizedYear = normalizeOptionalYear(year);

  return {
    id,
    title: title ?? null,
    year: normalizedYear,
    // DB CHECK: null year requires isYearEstimated = false
    isYearEstimated: normalizedYear == null ? false : !!isYearEstimated,
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
