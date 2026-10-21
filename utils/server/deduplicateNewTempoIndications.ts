import { FeedFormState } from "@/types/feedFormTypes";
import { db } from "@/utils/server/db";
import { normalizeForSearch } from "@/utils/normalizeForSearch";

/**
 * Reuses persisted tempo indications when newly created values differ only by
 * case or accents, and updates every section that references the new ID.
 */
export async function deduplicateNewTempoIndications(
  state: FeedFormState,
): Promise<FeedFormState> {
  const newTempoIndications = (state.tempoIndications ?? []).filter(
    (tempoIndication) => tempoIndication.isNew,
  );

  if (newTempoIndications.length === 0) return state;

  const existingTempoIndications = await db.tempoIndication.findMany({
    select: { id: true, text: true },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });

  const existingByNormalizedText = new Map<
    string,
    { id: string; text: string }
  >();
  for (const tempoIndication of existingTempoIndications) {
    const normalizedText = normalizeForSearch(tempoIndication.text);
    if (!existingByNormalizedText.has(normalizedText)) {
      existingByNormalizedText.set(normalizedText, tempoIndication);
    }
  }

  const matchingExistingByNewId = new Map<
    string,
    { id: string; text: string }
  >();
  for (const tempoIndication of newTempoIndications) {
    const existingTempoIndication = existingByNormalizedText.get(
      normalizeForSearch(tempoIndication.text),
    );
    if (existingTempoIndication) {
      matchingExistingByNewId.set(tempoIndication.id, existingTempoIndication);
    }
  }

  if (matchingExistingByNewId.size === 0) return state;

  const tempoIndicationsById = new Map<string, { id: string; text: string }>();
  for (const tempoIndication of state.tempoIndications ?? []) {
    const resolvedTempoIndication =
      matchingExistingByNewId.get(tempoIndication.id) ?? tempoIndication;
    if (!tempoIndicationsById.has(resolvedTempoIndication.id)) {
      tempoIndicationsById.set(
        resolvedTempoIndication.id,
        resolvedTempoIndication,
      );
    }
  }

  return {
    ...state,
    tempoIndications: Array.from(tempoIndicationsById.values()),
    pieceVersions: state.pieceVersions?.map((pieceVersion) => ({
      ...pieceVersion,
      movements: pieceVersion.movements.map((movement) => ({
        ...movement,
        sections: movement.sections.map((section) => {
          const existingTempoIndication = matchingExistingByNewId.get(
            section.tempoIndicationId,
          );
          return existingTempoIndication
            ? {
                ...section,
                tempoIndicationId: existingTempoIndication.id,
              }
            : section;
        }),
      })),
    })),
  };
}
