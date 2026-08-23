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

export type ReviewEntityType =
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

export type ReviewDiffField = {
  path: string;
};

export type ReviewDiffEntitySchema = {
  entity: ReviewEntityType;
  doNotReviewTwice?: boolean;
  fields: ReviewDiffField[];
};

export type ReviewDiffFieldsSchema = Record<
  ReviewEntityType,
  ReviewDiffEntitySchema
>;

export type ChangedField = {
  entityType: ReviewEntityType;
  entityId: string | null;
  fieldPath: string;
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

export type ReviewSubmitSuccess = {
  ok: true;
  summary: SuccessSumary;
};

export type ReviewSubmitError = {
  error: string;
  missing?: any[];
  missingCount?: number;
};

// Backward-compatibility aliases until L12 cleanup
export type ChecklistEntityType = ReviewEntityType;
export type ChecklistField = ReviewDiffField & {
  label?: string;
  meta?: {
    required?: boolean | ((ctx: any) => boolean);
    notes?: string;
  };
};
export type ChecklistEntitySchema = {
  entity: ChecklistEntityType;
  doNotReviewTwice?: boolean;
  fields: ChecklistField[];
};
export type ReviewChecklistSchema = Record<
  ChecklistEntityType,
  ChecklistEntitySchema
>;
export type ChangedChecklistItem = ChangedField;

export type SourceOnPieceVersion = {
  joinId: string;
  mMSourceId: string;
  pieceVersionId: string;
  rank: number;
  pieceId: string;
  collectionId?: string;
  collectionRank?: number;
};

export type ChecklistGraph = {
  source: MMSourceDescriptionState & {
    id: string;
    enteredBy: { id: string; name: string | null; email: string | null } | null;
  };
  collections?: (CollectionState & { pieceCount: number })[];
  pieces: PieceState[];
  pieceVersions: PieceVersionState[];
  tempoIndications?: TempoIndicationState[];
  metronomeMarks: MetronomeMarkState[];
  contributions: ContributionState[];
  persons?: PersonState[];
  organizations?: OrganizationState[];
  sourceOnPieceVersions: SourceOnPieceVersion[];
};

export type RequiredPredicateCtx = {
  graph: ChecklistGraph;
  entityType: ChecklistEntityType;
  entityId?: string | null;
  fieldRelativePath: string;
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

export type GloballyReviewedEntityArrays = {
  personIds: string[];
  organizationIds: string[];
  collectionIds: string[];
  pieceIds: string[];
  pieceVersionIds: string[];
};

export type GloballyReviewedEntitySets = {
  personIds?: Set<string>;
  organizationIds?: Set<string>;
  collectionIds?: Set<string>;
  pieceIds?: Set<string>;
  pieceVersionIds?: Set<string>;
};

export type ExpandOptions = {
  globallyReviewed?: GloballyReviewedEntitySets;
};

export type NodeLike = {
  id: string;
  [key: string]: unknown;
};

export type ApiOverview = {
  reviewId: string;
  graph: ChecklistGraph;
  globallyReviewed: GloballyReviewedEntityArrays;
  sourceOnPieceVersions: Array<SourceOnPieceVersion>;
  progress: {
    source: { required: number; checked: number };
    perCollection: Record<string, { required: number; checked: number }>;
    perPiece: Record<string, { required: number; checked: number }>;
  };
};
