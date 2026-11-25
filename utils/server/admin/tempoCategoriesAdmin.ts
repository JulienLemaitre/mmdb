import { db } from "@/utils/server/db";
import { AdminTempoCategoryItem } from "@/types/adminTypes";

export class AdminTempoActionError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AdminTempoActionError";
    this.status = status;
  }
}

export async function getAdminTempoCategories(): Promise<
  AdminTempoCategoryItem[]
> {
  const categories = await db.tempoCategory.findMany({
    orderBy: { rank: "asc" },
    select: {
      id: true,
      name: true,
      rank: true,
      _count: {
        select: { tempoIndications: true },
      },
    },
  });

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    rank: category.rank,
    tempoIndicationCount: category._count.tempoIndications,
  }));
}

export async function createAdminTempoCategory(
  rawName: string,
): Promise<AdminTempoCategoryItem> {
  const name = rawName.trim();
  if (!name) {
    throw new AdminTempoActionError("Category name is required", 400);
  }

  return db.$transaction(async (tx) => {
    const existing = await tx.tempoCategory.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
      select: { id: true },
    });

    if (existing) {
      throw new AdminTempoActionError(
        `Category "${name}" already exists`,
        409,
      );
    }

    const maxRankResult = await tx.tempoCategory.aggregate({
      _max: { rank: true },
    });
    const nextRank = (maxRankResult._max.rank ?? 0) + 1;

    const created = await tx.tempoCategory.create({
      data: {
        name,
        rank: nextRank,
      },
      select: {
        id: true,
        name: true,
        rank: true,
        _count: {
          select: { tempoIndications: true },
        },
      },
    });

    return {
      id: created.id,
      name: created.name,
      rank: created.rank,
      tempoIndicationCount: created._count.tempoIndications,
    };
  });
}

export async function deleteAdminTempoCategory(
  id: string,
): Promise<{ deletedId: string }> {
  return db.$transaction(async (tx) => {
    const category = await tx.tempoCategory.findUnique({
      where: { id },
      select: {
        id: true,
        _count: {
          select: { tempoIndications: true },
        },
      },
    });

    if (!category) {
      throw new AdminTempoActionError("Tempo category not found", 404);
    }

    if (category._count.tempoIndications > 0) {
      throw new AdminTempoActionError(
        "Cannot delete a category that has linked tempo indications",
        409,
      );
    }

    await tx.tempoCategory.delete({ where: { id } });
    return { deletedId: id };
  });
}

async function getTempoIndicationCategories(tempoIndicationId: string) {
  const links = await db.tempoCategoriesOnTempoIndications.findMany({
    where: { tempoIndicationId },
    orderBy: { tempoCategory: { rank: "asc" } },
    select: {
      tempoCategory: {
        select: { id: true, name: true },
      },
    },
  });

  return links.map((link) => link.tempoCategory);
}

export async function addCategoryToTempoIndication(
  tempoIndicationId: string,
  tempoCategoryId: string,
): Promise<Array<{ id: string; name: string }>> {
  const [indication, category] = await Promise.all([
    db.tempoIndication.findUnique({
      where: { id: tempoIndicationId },
      select: { id: true },
    }),
    db.tempoCategory.findUnique({
      where: { id: tempoCategoryId },
      select: { id: true },
    }),
  ]);

  if (!indication) {
    throw new AdminTempoActionError("Tempo indication not found", 404);
  }
  if (!category) {
    throw new AdminTempoActionError("Tempo category not found", 404);
  }

  await db.tempoCategoriesOnTempoIndications.upsert({
    where: {
      tempoIndicationId_tempoCategoryId: {
        tempoIndicationId,
        tempoCategoryId,
      },
    },
    update: {},
    create: {
      tempoIndicationId,
      tempoCategoryId,
    },
  });

  return getTempoIndicationCategories(tempoIndicationId);
}

export async function removeCategoryFromTempoIndication(
  tempoIndicationId: string,
  tempoCategoryId: string,
): Promise<Array<{ id: string; name: string }>> {
  const indication = await db.tempoIndication.findUnique({
    where: { id: tempoIndicationId },
    select: { id: true },
  });

  if (!indication) {
    throw new AdminTempoActionError("Tempo indication not found", 404);
  }

  await db.tempoCategoriesOnTempoIndications.deleteMany({
    where: {
      tempoIndicationId,
      tempoCategoryId,
    },
  });

  return getTempoIndicationCategories(tempoIndicationId);
}
