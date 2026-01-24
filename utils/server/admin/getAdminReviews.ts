import { db } from "@/utils/server/db";
import { buildPieceVersionLabels } from "@/utils/server/admin/pieceTitleUtils";

export type AdminReviewFilters = {
  cursor?: string | null;
  limit?: number;
  from?: string | Date | null;
  to?: string | Date | null;
  state?: string | null;
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

export type AdminReviewResult = {
  items: AdminReviewItem[];
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

export async function getAdminReviews(
  filters: AdminReviewFilters = {},
): Promise<AdminReviewResult> {
  const limit = clampLimit(filters.limit);
  const cursor = filters.cursor ?? undefined;
  const from = parseDateInput(filters.from);
  const to = parseDateInput(filters.to);

  const where: any = {};
  if (filters.state) where.state = filters.state;
  if (from || to) {
    where.startedAt = {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {}),
    };
  }

  const reviews = await db.review.findMany({
    where,
    orderBy: [{ startedAt: "desc" }, { id: "desc" }],
    take: limit,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      state: true,
      startedAt: true,
      endedAt: true,
      creator: { select: { id: true, name: true, email: true } },
      _count: { select: { auditLogs: true } },
      mMSource: {
        select: {
          id: true,
          title: true,
          sectionCount: true,
          pieceVersions: {
            select: {
              rank: true,
              pieceVersion: {
                select: {
                  category: true,
                  piece: { select: { title: true } },
                },
              },
            },
            orderBy: { rank: "asc" },
          },
        },
      },
    },
  });

  const items: AdminReviewItem[] = reviews.map((r) => ({
    id: r.id,
    state: r.state ? String(r.state) : null,
    startedAt: r.startedAt.toISOString(),
    endedAt: r.endedAt ? r.endedAt.toISOString() : null,
    auditLogCount: r._count.auditLogs,
    reviewer: r.creator
      ? { id: r.creator.id, name: r.creator.name, email: r.creator.email }
      : null,
    source: r.mMSource
      ? {
          id: r.mMSource.id,
          title: r.mMSource.title ?? null,
          sectionCount: r.mMSource.sectionCount,
          pieceTitles: buildPieceVersionLabels(r.mMSource.pieceVersions),
        }
      : null,
  }));

  const nextCursor =
    items.length === limit ? (items[items.length - 1]?.id ?? null) : null;

  return { items, nextCursor };
}
