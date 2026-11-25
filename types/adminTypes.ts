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

export type AdminTempoCategoryItem = {
  id: string;
  name: string;
  rank: number;
  tempoIndicationCount: number;
};

export type AdminTempoIndicationItem = {
  id: string;
  text: string;
  createdAt: string;
  author: { id: string; name: string | null; email: string | null } | null;
  categories: Array<{ id: string; name: string }>;
};

export type AdminTempoIndicationSortOrder = "asc" | "desc";
