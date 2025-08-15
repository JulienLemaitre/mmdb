// ReviewChecklistSchema.ts
// Declarative checklist of required review fields for each entity involved in an MM Source review.
// Notes:
// - "description only" for Collection and Piece means all fields from their respective tables that are edited in the forms, not their dependent entities.
// - Person and Organization are included here but should be filtered out when they already appear in ReviewedEntity.
// - For arrays (e.g., multiple References or Contributions), the consumer should render one checklist instance per entity row.

import { SourceContent } from "@/types/reviewTypes";

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

export type ChecklistGraph = {
  // Singleton source node for this review context
  source: { id: string; [k: string]: any };
  // Arrays of nodes in scope
  collections?: Array<{ id: string; [k: string]: any }>;
  pieces?: Array<{ id: string; [k: string]: any }>;
  pieceVersions?: Array<{ id: string; [k: string]: any }>;
  movements?: Array<{ id: string; [k: string]: any }>;
  sections?: Array<{ id: string; [k: string]: any }>;
  tempoIndications?: Array<{ id: string; [k: string]: any }>;
  metronomeMarks?: Array<{ id: string; [k: string]: any }>;
  references?: Array<{ id: string; [k: string]: any }>;
  contributions?: Array<{ id: string; [k: string]: any }>;
  persons?: Array<{ id: string; [k: string]: any }>;
  organizations?: Array<{ id: string; [k: string]: any }>;
  // Ordering join rows for the source contents (MMSourcesOnPieceVersions)
  sourceContents?: Array<SourceContent>;
  // sourceContents?: Array<{ joinId: string; pieceVersionId: string; rank: number; [k: string]: any }>;
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
      // Logical checklist item for ordering within the source (Phase 2E field path convention)
      { path: "contents.order", label: "Ordering of pieces and versions" },
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

// ===== Phase 2E helpers: field path convention and checklist expansion =====

export const ENTITY_PREFIX: Record<ChecklistEntityType, string> = {
  MM_SOURCE: "source",
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
  includePerJoinOrderChecks?: boolean; // default true
};

export type RequiredChecklistItem = {
  entityType: ChecklistEntityType;
  entityId?: string | null;
  fieldPath: string;
  label: string;
};

function isRequiredField(
  field: ChecklistField,
  ctx: RequiredPredicateCtx,
): boolean {
  const req = field.meta?.required;
  if (req === undefined) return true;
  if (typeof req === "function") return !!req(ctx);
  return !!req;
}

function isGloballyReviewed(
  entityType: ChecklistEntityType,
  entityId: string | null | undefined,
  options?: ExpandOptions,
): boolean {
  if (!entityId) return false;
  const sets = options?.globallyReviewed;
  switch (entityType) {
    case "PERSON":
      return !!sets?.personIds?.has(entityId);
    case "ORGANIZATION":
      return !!sets?.organizationIds?.has(entityId);
    case "COLLECTION":
      return !!sets?.collectionIds?.has(entityId);
    case "PIECE":
      return !!sets?.pieceIds?.has(entityId);
    default:
      return false;
  }
}

export function expandRequiredChecklistItems(
  graph: ChecklistGraph,
  options?: ExpandOptions,
): RequiredChecklistItem[] {
  const items: RequiredChecklistItem[] = [];

  // MM_SOURCE fields (singleton). Always include the logical ordering item.
  for (const field of REVIEW_CHECKLIST_SCHEMA.MM_SOURCE.fields) {
    const ctx: RequiredPredicateCtx = {
      graph,
      entityType: "MM_SOURCE",
      entityId: null,
      fieldRelativePath: field.path,
    };
    if (!isRequiredField(field, ctx)) continue;
    items.push({
      entityType: "MM_SOURCE",
      entityId: null,
      fieldPath: buildFieldPath("MM_SOURCE", null, field.path),
      label: field.label,
    });
  }

  // Per-join rank checks for ordering within source
  const includeJoins = options?.includePerJoinOrderChecks ?? true;
  if (includeJoins && Array.isArray(graph.sourceContents)) {
    for (const row of graph.sourceContents) {
      if (!row?.joinId) continue;
      items.push({
        entityType: "MM_SOURCE",
        entityId: null,
        fieldPath: buildSourceJoinRankPath(String(row.joinId)),
        label: "Rank in source",
      });
    }
  }

  // Helper to add items per entity array based on schema
  const addEntityGroup = (
    entityType: ChecklistEntityType,
    nodes: Array<{ id: string }> | undefined,
  ) => {
    if (!nodes || nodes.length === 0) return;
    const schema = REVIEW_CHECKLIST_SCHEMA[entityType];
    for (const n of nodes) {
      if (
        schema.doNotReviewTwice &&
        isGloballyReviewed(entityType, n.id, options)
      ) {
        continue;
      }
      for (const field of schema.fields) {
        const ctx: RequiredPredicateCtx = {
          graph,
          entityType,
          entityId: n.id,
          fieldRelativePath: field.path,
        };
        if (!isRequiredField(field, ctx)) continue;
        items.push({
          entityType,
          entityId: n.id,
          fieldPath: buildFieldPath(entityType, n.id, field.path),
          label: field.label,
        });
      }
    }
  };

  addEntityGroup(
    "COLLECTION",
    graph.collections as Array<{ id: string } | undefined> as any,
  );
  addEntityGroup(
    "PIECE",
    graph.pieces as Array<{ id: string } | undefined> as any,
  );
  addEntityGroup(
    "PIECE_VERSION",
    graph.pieceVersions as Array<{ id: string } | undefined> as any,
  );
  addEntityGroup(
    "MOVEMENT",
    graph.movements as Array<{ id: string } | undefined> as any,
  );
  addEntityGroup(
    "SECTION",
    graph.sections as Array<{ id: string } | undefined> as any,
  );
  addEntityGroup(
    "TEMPO_INDICATION",
    graph.tempoIndications as Array<{ id: string } | undefined> as any,
  );
  addEntityGroup(
    "METRONOME_MARK",
    graph.metronomeMarks as Array<{ id: string } | undefined> as any,
  );
  addEntityGroup(
    "REFERENCE",
    graph.references as Array<{ id: string } | undefined> as any,
  );
  addEntityGroup(
    "CONTRIBUTION",
    graph.contributions as Array<{ id: string } | undefined> as any,
  );
  addEntityGroup(
    "PERSON",
    graph.persons as Array<{ id: string } | undefined> as any,
  );
  addEntityGroup(
    "ORGANIZATION",
    graph.organizations as Array<{ id: string } | undefined> as any,
  );

  return items;
}
