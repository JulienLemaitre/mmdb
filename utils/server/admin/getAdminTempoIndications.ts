import { db } from "@/utils/server/db";
import {
  AdminListResponse,
  AdminTempoIndicationItem,
  AdminTempoIndicationSortOrder,
} from "@/types/adminTypes";
import { Prisma } from "@/prisma/client";

export type AdminTempoIndicationsFilters = {
  cursor?: string | null;
  limit?: number;
  sortOrder?: AdminTempoIndicationSortOrder;
  categoryFilter?: string | null;
};

function clampLimit(raw?: number): number {
  if (!Number.isFinite(raw)) return 25;
  return Math.min(Math.max(raw as number, 1), 100);
}

export async function getAdminTempoIndications(
  filters: AdminTempoIndicationsFilters = {},
): Promise<AdminListResponse<AdminTempoIndicationItem>> {
  const limit = clampLimit(filters.limit);
  const cursor = filters.cursor ?? undefined;
  const sortOrder: AdminTempoIndicationSortOrder =
    filters.sortOrder === "asc" ? "asc" : "desc";
  const categoryFilter = filters.categoryFilter?.trim() || "all";

  const where: Prisma.TempoIndicationWhereInput = {};
  if (categoryFilter === "uncategorized") {
    where.tempoCategories = { none: {} };
  } else if (categoryFilter !== "all") {
    where.tempoCategories = {
      some: { tempoCategoryId: categoryFilter },
    };
  }

  const indications = await db.tempoIndication.findMany({
    where,
    orderBy: [{ createdAt: sortOrder }, { id: sortOrder }],
    take: limit,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      text: true,
      createdAt: true,
      creator: {
        select: { id: true, name: true, email: true },
      },
      tempoCategories: {
        select: {
          tempoCategory: {
            select: { id: true, name: true, rank: true },
          },
        },
        orderBy: { tempoCategory: { rank: "asc" } },
      },
    },
  });

  const items: AdminTempoIndicationItem[] = indications.map((ti) => ({
    id: ti.id,
    text: ti.text,
    createdAt: ti.createdAt.toISOString(),
    author: ti.creator
      ? { id: ti.creator.id, name: ti.creator.name, email: ti.creator.email }
      : null,
    categories: ti.tempoCategories.map((link) => ({
      id: link.tempoCategory.id,
      name: link.tempoCategory.name,
    })),
  }));

  const nextCursor =
    items.length === limit ? (items[items.length - 1]?.id ?? null) : null;

  return { items, nextCursor };
}
