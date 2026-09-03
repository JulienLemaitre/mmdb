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
