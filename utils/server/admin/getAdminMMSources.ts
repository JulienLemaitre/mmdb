import { db } from "@/utils/server/db";
import { buildPieceVersionLabels } from "@/utils/server/admin/pieceTitleUtils";

export type AdminMMSourcesFilters = {
  cursor?: string | null;
  limit?: number;
  from?: string | Date | null;
  to?: string | Date | null;
  reviewState?: string | null;
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

export type AdminMMSourceResult = {
  items: AdminMMSourceItem[];
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

export async function getAdminMMSources(
  filters: AdminMMSourcesFilters = {},
): Promise<AdminMMSourceResult> {
  const limit = clampLimit(filters.limit);
  const cursor = filters.cursor ?? undefined;
  const from = parseDateInput(filters.from);
  const to = parseDateInput(filters.to);

  const where: any = {};
  if (filters.reviewState) where.reviewState = filters.reviewState;
  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {}),
    };
  }

  const sources = await db.mMSource.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      title: true,
      createdAt: true,
      reviewState: true,
      sectionCount: true,
      creator: { select: { id: true, name: true, email: true } },
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
  });

  const items: AdminMMSourceItem[] = sources.map((s) => ({
    id: s.id,
    title: s.title ?? null,
    createdAt: s.createdAt.toISOString(),
    reviewState: s.reviewState ? String(s.reviewState) : null,
    sectionCount: s.sectionCount,
    author: s.creator
      ? { id: s.creator.id, name: s.creator.name, email: s.creator.email }
      : null,
    pieceTitles: buildPieceVersionLabels(s.pieceVersions),
  }));

  const nextCursor =
    items.length === limit ? (items[items.length - 1]?.id ?? null) : null;

  return { items, nextCursor };
}
