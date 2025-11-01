// ReviewChecklistSchema.ts
// Declarative checklist of required review fields for each entity involved in an MM Source review.
// Notes:
// - "description only" for Collection and Piece means all fields from their respective tables that are edited in the forms, not their dependent entities.
// - Person and Organization are included here but should be filtered out when they already appear in ReviewedEntity.
// - For arrays (e.g., multiple References or Contributions), the consumer should render one checklist instance per entity row.

import { SourceOnPieceVersion } from "@/types/reviewTypes";
import {
  CollectionState,
  ContributionState,
  MetronomeMarkState,
  MMSourceDescriptionState,
  OrganizationState,
  PersonState,
  PieceState,
  PieceVersionState,
  TempoIndicationState,
} from "@/types/formTypes";

export type ChecklistEntityType =
  | "MM_SOURCE"
  | "MM_SOURCE_ON_PIECE_VERSION"
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

export type ChecklistGraph = {
  // Singleton source node for this review context
  source: MMSourceDescriptionState & { id: string };
  // Arrays of nodes in scope
  collections?: (CollectionState & { pieceCount: number })[];
  pieces: PieceState[];
  pieceVersions: PieceVersionState[];
  tempoIndications?: TempoIndicationState[];
  metronomeMarks: MetronomeMarkState[];
  contributions: ContributionState[];
  persons?: PersonState[];
  organizations?: OrganizationState[];
  // Ordering join rows for the source contents (MMSourcesOnPieceVersions)
  sourceOnPieceVersions: SourceOnPieceVersion[];
};

export type RequiredPredicateCtx = {
  graph: ChecklistGraph;
  entityType: ChecklistEntityType;
  entityId?: string | null;
  fieldRelativePath: string;
};

export type ChecklistField = {
  // Field path relative to the entity object used in your working copy payload.
  // Use simple dot paths for scalar fields.
  path: string;
  // Human-friendly label to show next to the checkbox in the UI.
  label: string;
  // Optional helper for validation or UI rules (e.g., XOR on Contribution.personId/organizationId)
  meta?: {
    required?: boolean | ((ctx: RequiredPredicateCtx) => boolean); // default true; predicate can inspect contextual graph
    notes?: string;
  };
};

export type ChecklistEntitySchema = {
  entity: ChecklistEntityType;
  graphProperty?: keyof ChecklistGraph;
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
    graphProperty: "source",
    fields: [
      { path: "title", label: "Source title" }, // nullable in schema, still must be reviewed
      { path: "type", label: "Source type" },
      // The link is what is entered at first. The permalink is computed from it and will be the only usable url over time. => Both should be verified accordingly.
      { path: "link", label: "Link to online score" },
      { path: "permalink", label: "Permalink" },
      { path: "year", label: "Publication year" },
      { path: "comment", label: "Source comment" },
      // // Logical checklist item for ordering within the source (Phase 2E field path convention)
      // { path: "contents.order", label: "Ordering of pieces and versions" },
    ],
  },

  MM_SOURCE_ON_PIECE_VERSION: {
    entity: "MM_SOURCE_ON_PIECE_VERSION",
    graphProperty: "sourceOnPieceVersions",
    fields: [{ path: "rank", label: "Rank" }],
  },

  COLLECTION: {
    entity: "COLLECTION",
    graphProperty: "collections",
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
    graphProperty: "pieces",
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
    graphProperty: "pieceVersions",
    fields: [
      { path: "category", label: "Piece version category" },
      // pieceId is implied by context
    ],
  },

  MOVEMENT: {
    entity: "MOVEMENT",
    // graphProperty: "movements",
    fields: [
      { path: "rank", label: "Movement rank" },
      { path: "key", label: "Key" },
    ],
  },

  SECTION: {
    entity: "SECTION",
    // graphProperty: "sections",
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
    graphProperty: "tempoIndications",
    fields: [{ path: "text", label: "Tempo indication text" }],
  },

  METRONOME_MARK: {
    entity: "METRONOME_MARK",
    graphProperty: "metronomeMarks",
    fields: [
      { path: "beatUnit", label: "Beat unit (note value)" },
      { path: "bpm", label: "BPM" },
      { path: "comment", label: "Metronome mark comment" },
    ],
  },

  REFERENCE: {
    entity: "REFERENCE",
    // graphProperty: "references",
    fields: [
      { path: "type", label: "Reference type" },
      { path: "reference", label: "Reference value" },
    ],
  },

  CONTRIBUTION: {
    entity: "CONTRIBUTION",
    graphProperty: "contributions",
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
    graphProperty: "persons",
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
    graphProperty: "organizations",
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

// ===== helpers: field path convention and checklist expansion =====

export const ENTITY_PREFIX: Record<ChecklistEntityType, string> = {
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
  entityType: ChecklistEntityType,
  entityId: string | null | undefined,
  relativePath: string,
): string {
  const prefix = ENTITY_PREFIX[entityType];
  if (entityType === "MM_SOURCE") {
    return `${prefix}.${relativePath}`;
  }
  // Enforce stable IDs for non-singletons to avoid collisions when arrays reorder.
  if (!entityId || typeof entityId !== "string" || entityId.trim() === "") {
    // Fail fast in dev; in prod, this will still produce a bracketless path,
    // but we want to catch it early during development/tests.
    if (process.env.NODE_ENV !== "production") {
      throw new Error(
        `buildFieldPath: missing entityId for ${entityType} (non-singleton). relativePath=${relativePath}`,
      );
    }
  }
  const idPart = entityId ? `[${entityId}]` : "";
  return `${prefix}${idPart}.${relativePath}`;
}

export function buildSourceJoinRankPath(joinId: string): string {
  return `source.pieceVersions[${joinId}].rank`;
}

export type GloballyReviewed = {
  personIds?: Set<string>;
  organizationIds?: Set<string>;
  collectionIds?: Set<string>;
  pieceIds?: Set<string>;
};

export type ExpandOptions = {
  globallyReviewed?: GloballyReviewed;
};

export type RequiredChecklistItem = {
  entityType: ChecklistEntityType;
  entityId?: string | null;
  fieldPath: string;
  field: ChecklistField | SourceOnPieceVersion;
  label: string;
  value: any;
  lineage: {
    collectionId?: string;
    pieceId?: string;
    pieceVersionId?: string;
    movementId?: string;
    sectionId?: string;
  };
};
