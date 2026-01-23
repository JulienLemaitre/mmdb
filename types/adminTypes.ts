export type AdminListResponse<T> = {
  items: T[];
  nextCursor: string | null;
};

export type AdminUserItem = {
  id: string;
  name: string | null;
  email: string | null;
  createdAt: string;
  emailVerified: string | null;
  role: string | null;
  mmSourceCount: number;
  approvedMMSourceCount: number;
  submittedReviewCount: number;
};

export type AdminMMSourceItem = {
  id: string;
  title: string | null;
  createdAt: string;
  reviewState: string | null;
  sectionCount: number;
  author: { id: string; name: string | null; email: string | null } | null;
  pieceTitles: string[];
};

export type AdminReviewItem = {
  id: string;
  state: string | null;
  startedAt: string;
  endedAt: string | null;
  auditLogCount: number;
  reviewer: { id: string; name: string | null; email: string | null } | null;
  source: {
    id: string;
    title: string | null;
    sectionCount: number;
    pieceTitles: string[];
  } | null;
};

export type AdminAuditItem = {
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

export type AdminAuditResult = {
  items: AdminAuditItem[];
  nextCursor: string | null;
  review?: {
    sourceTitle: string | null;
    authorName: string | null;
    date: string | null;
  } | null;
};
