import { db } from "@/utils/server/db";
import { REVIEW_STATE } from "@/prisma/client/enums";

export type AdminUserFilters = {
  cursor?: string | null;
  limit?: number;
  from?: string | Date | null;
  to?: string | Date | null;
  role?: string | null;
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

export type AdminUserResult = {
  items: AdminUserItem[];
  nextCursor: string | null;
};

function parseDateInput(value?: string | Date | null): Date | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
}

function clampLimit(raw?: number): number {
  if (!Number.isFinite(raw)) return 50;
  return Math.min(Math.max(raw as number, 1), 100);
}

export async function getAdminUsers(
  filters: AdminUserFilters = {},
): Promise<AdminUserResult> {
  const limit = clampLimit(filters.limit);
  const cursor = filters.cursor ?? undefined;
  const from = parseDateInput(filters.from);
  const to = parseDateInput(filters.to);

  const where: any = {};
  if (filters.role) where.role = filters.role;
  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {}),
    };
  }

  const users = await db.user.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      emailVerified: true,
      role: true,
      _count: { select: { mMSources: true } },
    },
  });

  const userIds = users.map((u) => u.id);
  const approvedCounts = userIds.length
    ? await db.mMSource.groupBy({
        by: ["creatorId"],
        where: {
          creatorId: { in: userIds },
          reviewState: REVIEW_STATE.APPROVED,
        },
        _count: { _all: true },
      })
    : [];

  const approvedByCreator = new Map<string, number>();
  for (const row of approvedCounts) {
    if (row.creatorId) approvedByCreator.set(row.creatorId, row._count._all);
  }

  const submittedReviewCounts = userIds.length
    ? await db.review.groupBy({
        by: ["creatorId"],
        where: {
          creatorId: { in: userIds },
          state: { in: [REVIEW_STATE.APPROVED] },
        },
        _count: { _all: true },
      })
    : [];

  const submittedReviewsByCreator = new Map<string, number>();
  for (const row of submittedReviewCounts) {
    if (row.creatorId)
      submittedReviewsByCreator.set(row.creatorId, row._count._all);
  }

  const items: AdminUserItem[] = users.map((u) => ({
    id: u.id,
    name: u.name ?? null,
    email: u.email ?? null,
    createdAt: u.createdAt.toISOString(),
    emailVerified: u.emailVerified ? u.emailVerified.toISOString() : null,
    role: u.role ?? null,
    mmSourceCount: u._count.mMSources,
    approvedMMSourceCount: approvedByCreator.get(u.id) ?? 0,
    submittedReviewCount: submittedReviewsByCreator.get(u.id) ?? 0,
  }));

  const nextCursor =
    items.length === limit ? (items[items.length - 1]?.id ?? null) : null;

  return { items, nextCursor };
}
