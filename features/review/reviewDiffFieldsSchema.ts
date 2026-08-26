// reviewDiffFieldsSchema.ts
// Note : tout nouveau champ de base de données édité par le formulaire doit être ajouté ici, faute de quoi sa modification ne sera pas auditée.

import {
  ReviewDiffFieldsSchema,
  ReviewDiffField,
  ReviewEntityType,
} from "@/types/reviewTypes";

// Central schema
export const REVIEW_DIFF_FIELDS_SCHEMA: ReviewDiffFieldsSchema = {
  MM_SOURCE: {
    entity: "MM_SOURCE",
    fields: [
      { path: "title" },
      { path: "type" },
      { path: "link" },
      { path: "permalink" },
      { path: "year" },
      { path: "isYearEstimated" },
      { path: "comment" },
    ],
  },

  MM_SOURCE_ON_PIECE_VERSION: {
    entity: "MM_SOURCE_ON_PIECE_VERSION",
    fields: [{ path: "rank" }],
  },

  COLLECTION: {
    entity: "COLLECTION",
    doNotReviewTwice: true,
    fields: [{ path: "title" }, { path: "composerId" }],
  },

  PIECE: {
    entity: "PIECE",
    doNotReviewTwice: true,
    fields: [
      { path: "title" },
      { path: "nickname" },
      { path: "composerId" },
      { path: "yearOfComposition" },
      { path: "collectionId" },
      { path: "collectionRank" },
    ],
  },

  PIECE_VERSION: {
    entity: "PIECE_VERSION",
    doNotReviewTwice: true,
    fields: [{ path: "category" }],
  },

  MOVEMENT: {
    entity: "MOVEMENT",
    fields: [{ path: "rank" }, { path: "key" }, { path: "isVariation" }],
  },

  SECTION: {
    entity: "SECTION",
    fields: [
      { path: "rank" },
      { path: "metreNumerator" },
      { path: "metreDenominator" },
      { path: "isCommonTime" },
      { path: "isCutTime" },
      { path: "fastestStructuralNotesPerBar" },
      { path: "fastestBelCantoNotesPerBar" },
      { path: "fastestStaccatoNotesPerBar" },
      { path: "fastestRepeatedNotesPerBar" },
      { path: "fastestOrnamentalNotesPerBar" },
      { path: "tempoIndicationId" },
      { path: "comment" },
      { path: "commentForReview" },
    ],
  },

  TEMPO_INDICATION: {
    entity: "TEMPO_INDICATION",
    fields: [{ path: "text" }],
  },

  METRONOME_MARK: {
    entity: "METRONOME_MARK",
    fields: [{ path: "beatUnit" }, { path: "bpm" }, { path: "comment" }],
  },

  REFERENCE: {
    entity: "REFERENCE",
    fields: [{ path: "type" }, { path: "reference" }],
  },

  CONTRIBUTION: {
    entity: "CONTRIBUTION",
    fields: [
      { path: "role" },
      { path: "personId" },
      { path: "organizationId" },
    ],
  },

  PERSON: {
    entity: "PERSON",
    doNotReviewTwice: true,
    fields: [
      { path: "firstName" },
      { path: "lastName" },
      { path: "birthYear" },
      { path: "deathYear" },
    ],
  },

  ORGANIZATION: {
    entity: "ORGANIZATION",
    doNotReviewTwice: true,
    fields: [{ path: "name" }],
  },
};

// Helper: get the set of diff fields for an entity type.
export function getDiffFields(entityType: ReviewEntityType): ReviewDiffField[] {
  return REVIEW_DIFF_FIELDS_SCHEMA[entityType].fields;
}

// Helper: returns whether the entity type participates in “do not review twice.”
export function isDoNotReviewTwice(entityType: ReviewEntityType): boolean {
  return !!REVIEW_DIFF_FIELDS_SCHEMA[entityType].doNotReviewTwice;
}

export const ENTITY_PREFIX: Record<ReviewEntityType, string> = {
  MM_SOURCE: "source",
  MM_SOURCE_ON_PIECE_VERSION: "sourceOnPieceVersion",
  COLLECTION: "collection",
  PIECE: "piece",
  PIECE_VERSION: "pieceVersion",
  MOVEMENT: "movement",
  SECTION: "section",
  TEMPO_INDICATION: "tempoIndication",
  METRONOME_MARK: "metronomeMark",
  REFERENCE: "reference",
  CONTRIBUTION: "contribution",
  PERSON: "person",
  ORGANIZATION: "organization",
};

/**
 * Builds a stable field path according to the convention.
 * - For MM_SOURCE: no id bracket; e.g., source.title
 * - For others: prefix[entityId].field.relative.path
 */
export function buildFieldPath(
  entityType: ReviewEntityType,
  entityId: string | null | undefined,
  relativePath: string,
): string {
  const prefix = ENTITY_PREFIX[entityType];
  if (entityType === "MM_SOURCE") {
    return `${prefix}.${relativePath}`;
  }
  if (!entityId || typeof entityId !== "string" || entityId.trim() === "") {
    console.warn(
      `[reviewDiffFieldsSchema] buildFieldPath: missing entityId for ${entityType} (non-singleton). relativePath=${relativePath}`,
    );
  }
  const idPart = entityId ? `[${entityId}]` : "";
  return `${prefix}${idPart}.${relativePath}`;
}

export function buildSourceJoinRankPath(pieceVersionId: string): string {
  return `source.pieceVersions[${pieceVersionId}].rank`;
}
