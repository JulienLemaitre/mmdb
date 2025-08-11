// ReviewChecklistSchema.ts
// Declarative checklist of required review fields for each entity involved in an MM Source review.
// Notes:
// - "description only" for Collection and Piece means all fields from their respective tables that are edited in the forms, not their dependent entities.
// - Person and Organization are included here but should be filtered out when they already appear in ReviewedEntity.
// - For arrays (e.g., multiple References or Contributions), the consumer should render one checklist instance per entity row.

export type ChecklistEntityType =
  | "MM_SOURCE"
  | "COLLECTION"
  | "PIECE"
  | "PIECE_VERSION"
  | "MOVEMENT"
  | "SECTION"
  | "TEMPO_INDICATION"
  | "METRONOME_MARK"
  | "REFERENCE"
  | "CONTRIBUTION"
  | "PERSON"
  | "ORGANIZATION";

export type ChecklistField = {
  // Field path relative to the entity object used in your working copy payload.
  // Use simple dot paths for scalar fields.
  path: string;
  // Human-friendly label to show next to the checkbox in the UI.
  label: string;
  // Optional helper for validation or UI rules (e.g., XOR on Contribution.personId/organizationId)
  meta?: {
    required?: boolean; // default true
    notes?: string;
  };
};

export type ChecklistEntitySchema = {
  entity: ChecklistEntityType;
  // If true, omit from the checklist when a ReviewedEntity flag exists for this entity row.
  doNotReviewTwice?: boolean;
  // The fields that must be checked for this entity.
  fields: ChecklistField[];
};

export type ReviewChecklistSchema = Record<
  ChecklistEntityType,
  ChecklistEntitySchema
>;

// Central schema
export const REVIEW_CHECKLIST_SCHEMA: ReviewChecklistSchema = {
  MM_SOURCE: {
    entity: "MM_SOURCE",
    fields: [
      { path: "title", label: "Source title" }, // nullable in schema, still must be reviewed
      { path: "type", label: "Source type" },
      // The link is what is entered at first. The permalink is computed from it and will be the only usable url over time. => Both should be verified accordingly.
      { path: "link", label: "Link to online score" },
      { path: "permalink", label: "Permalink" },
      { path: "year", label: "Publication year" },
      { path: "comment", label: "Source comment" },
    ],
  },

  COLLECTION: {
    entity: "COLLECTION",
    doNotReviewTwice: true,
    // Description-only: all fields from Collection table that are edited directly for a collection
    fields: [
      { path: "title", label: "Collection title" },
      { path: "composerId", label: "Composer" },
      // creatorId, createdAt, updatedAt, id are system fields and intentionally excluded
    ],
  },

  PIECE: {
    entity: "PIECE",
    doNotReviewTwice: true,
    // Description-only: fields on Piece itself (not PieceVersion/child entities)
    fields: [
      { path: "title", label: "Piece title" },
      { path: "nickname", label: "Nickname" },
      { path: "composerId", label: "Composer" },
      { path: "yearOfComposition", label: "Year of composition" },
      { path: "collectionId", label: "Collection" },
      { path: "collectionRank", label: "Collection rank (No.)" },
    ],
  },

  PIECE_VERSION: {
    entity: "PIECE_VERSION",
    fields: [
      { path: "category", label: "Piece version category" },
      // pieceId is implied by context
    ],
  },

  MOVEMENT: {
    entity: "MOVEMENT",
    fields: [
      { path: "rank", label: "Movement rank" },
      { path: "key", label: "Key" },
    ],
  },

  SECTION: {
    entity: "SECTION",
    fields: [
      { path: "rank", label: "Section rank" },
      { path: "metreNumerator", label: "Metre numerator" },
      { path: "metreDenominator", label: "Metre denominator" },
      { path: "isCommonTime", label: "Is common time (C)" },
      { path: "isCutTime", label: "Is cut time (¢)" },
      {
        path: "fastestStructuralNotesPerBar",
        label: "Max structural notes per bar",
      },
      {
        path: "fastestStaccatoNotesPerBar",
        label: "Max staccato notes per bar",
      },
      {
        path: "fastestRepeatedNotesPerBar",
        label: "Max repeated notes per bar",
      },
      {
        path: "fastestOrnamentalNotesPerBar",
        label: "Max ornamental notes per bar",
      },
      {
        path: "isFastestStructuralNoteBelCanto",
        label: "Fastest structural note is bel canto",
      },
      { path: "tempoIndicationId", label: "Tempo indication" },
      { path: "comment", label: "Section comment" },
      { path: "commentForReview", label: "Reviewer-only comment" },
    ],
  },

  TEMPO_INDICATION: {
    entity: "TEMPO_INDICATION",
    fields: [{ path: "text", label: "Tempo indication text" }],
  },

  METRONOME_MARK: {
    entity: "METRONOME_MARK",
    fields: [
      { path: "beatUnit", label: "Beat unit (note value)" },
      { path: "bpm", label: "BPM" },
      { path: "comment", label: "Metronome mark comment" },
    ],
  },

  REFERENCE: {
    entity: "REFERENCE",
    fields: [
      { path: "type", label: "Reference type" },
      { path: "reference", label: "Reference value" },
    ],
  },

  CONTRIBUTION: {
    entity: "CONTRIBUTION",
    fields: [
      { path: "role", label: "Contribution role" },
      {
        path: "personId",
        label: "Person (XOR with Organization)",
        meta: {
          notes: "Exactly one of personId or organizationId must be set.",
        },
      },
      {
        path: "organizationId",
        label: "Organization (XOR with Person)",
        meta: {
          notes: "Exactly one of personId or organizationId must be set.",
        },
      },
    ],
  },

  PERSON: {
    entity: "PERSON",
    doNotReviewTwice: true,
    fields: [
      { path: "firstName", label: "First name" },
      { path: "lastName", label: "Last name" },
      { path: "birthYear", label: "Birth year" },
      { path: "deathYear", label: "Death year" },
    ],
  },

  ORGANIZATION: {
    entity: "ORGANIZATION",
    doNotReviewTwice: true,
    fields: [{ path: "name", label: "Organization name" }],
  },
};

// Helper: get the set of required fields for an entity type.
// The caller typically renders these for each concrete entity instance in the working copy.
export function getChecklistFields(
  entityType: ChecklistEntityType,
): ChecklistField[] {
  return REVIEW_CHECKLIST_SCHEMA[entityType].fields;
}

// Helper: returns whether the entity type participates in “do not review twice.”
export function isDoNotReviewTwice(entityType: ChecklistEntityType): boolean {
  return !!REVIEW_CHECKLIST_SCHEMA[entityType].doNotReviewTwice;
}
