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

export type SourceOnPieceVersion = {
  joinId: string;
  mMSourceId: string;
  pieceVersionId: string;
  rank: number;
  pieceId: string;
  collectionId?: string;
  collectionRank?: number;
};

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
  source: MMSourceDescriptionState & {
    id: string;
    enteredBy: { id: string; name: string | null; email: string | null } | null;
  };
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

// API payload shape from /api/review/[reviewId]/overview
export type ApiOverview = {
  reviewId: string;
  graph: ChecklistGraph; // ChecklistGraph-like
  globallyReviewed: {
    personIds: string[];
    organizationIds: string[];
    collectionIds: string[];
    pieceIds: string[];
  };
  sourceOnPieceVersions: Array<SourceOnPieceVersion>;
  progress: {
    source: { required: number; checked: number };
    perCollection: Record<string, { required: number; checked: number }>;
    perPiece: Record<string, { required: number; checked: number }>;
  };
};

// Audit
export type AuditOperation = "CREATE" | "UPDATE" | "DELETE";

export type AuditEntityType =
  | "PERSON"
  | "ORGANIZATION"
  | "COLLECTION"
  | "PIECE"
  | "PIECE_VERSION"
  | "MOVEMENT"
  | "SECTION"
  | "TEMPO_INDICATION"
  | "METRONOME_MARK"
  | "MM_SOURCE"
  | "REFERENCE"
  | "CONTRIBUTION";

export type AuditEntry = {
  reviewId: string;
  entityType: AuditEntityType;
  entityId: string;
  operation: AuditOperation;
  before: any | null;
  after: any | null;
};

export type SuccessSumary = {
  reviewId: string;
  overallComment: any;
  requiredCount: number;
  submittedCheckedCount: number;
  changedCount: number;
  entitiesTouched: Record<string, number>;
  changedFieldPathsSample: string[];
};
export type AuditPreview = {
  count: number;
  entries: AuditEntry[];
};
export type ReviewSubmitSuccess = {
  ok: true;
  summary: SuccessSumary;
  auditPreview: AuditPreview;
};
export type ReviewSubmitError = {
  error: string;
  missing?: RequiredChecklistItem[];
  missingCount?: number;
};
