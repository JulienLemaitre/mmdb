export type AuditLogItem = {
  id: string;
  reviewId: string | null;
  entityType: string;
  entityId: string | null;
  operation: string;
  before: any | null;
  after: any | null;
  authorId: string | null;
  createdAt: string;
  comment: string | null;
};

export type AuditLogResult = {
  items: AuditLogItem[];
  nextCursor: string | null;
  review?: {
    sourceTitle: string | null;
    authorName: string | null;
    date: string | null;
  } | null;
};
