const mockTempoIndicationFindMany = jest.fn();
const mockTempoIndicationFindUnique = jest.fn();
const mockTempoCategoryFindMany = jest.fn();
const mockTempoCategoryFindFirst = jest.fn();
const mockTempoCategoryFindUnique = jest.fn();
const mockTempoCategoryAggregate = jest.fn();
const mockTempoCategoryCreate = jest.fn();
const mockTempoCategoryDelete = jest.fn();
const mockLinkFindMany = jest.fn();
const mockLinkUpsert = jest.fn();
const mockLinkDeleteMany = jest.fn();
const mockTransaction = jest.fn();

jest.mock("@/utils/server/db", () => ({
  db: {
    tempoIndication: {
      findMany: (...args: unknown[]) => mockTempoIndicationFindMany(...args),
      findUnique: (...args: unknown[]) =>
        mockTempoIndicationFindUnique(...args),
    },
    tempoCategory: {
      findMany: (...args: unknown[]) => mockTempoCategoryFindMany(...args),
      findFirst: (...args: unknown[]) => mockTempoCategoryFindFirst(...args),
      findUnique: (...args: unknown[]) => mockTempoCategoryFindUnique(...args),
      aggregate: (...args: unknown[]) => mockTempoCategoryAggregate(...args),
      create: (...args: unknown[]) => mockTempoCategoryCreate(...args),
      delete: (...args: unknown[]) => mockTempoCategoryDelete(...args),
    },
    tempoCategoriesOnTempoIndications: {
      findMany: (...args: unknown[]) => mockLinkFindMany(...args),
      upsert: (...args: unknown[]) => mockLinkUpsert(...args),
      deleteMany: (...args: unknown[]) => mockLinkDeleteMany(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

import { getAdminTempoIndications } from "@/utils/server/admin/getAdminTempoIndications";
import {
  addCategoryToTempoIndication,
  AdminTempoActionError,
  createAdminTempoCategory,
  deleteAdminTempoCategory,
  removeCategoryFromTempoIndication,
} from "@/utils/server/admin/tempoCategoriesAdmin";

describe("getAdminTempoIndications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("queries with default desc order and all filter", async () => {
    const createdAt = new Date("2026-01-10T12:00:00.000Z");
    mockTempoIndicationFindMany.mockResolvedValueOnce([
      {
        id: "ti-1",
        text: "Allegro",
        createdAt,
        creator: { id: "u-1", name: "Alice", email: "alice@example.com" },
        tempoCategories: [
          { tempoCategory: { id: "cat-1", name: "Allegro", rank: 4 } },
        ],
      },
    ]);

    const result = await getAdminTempoIndications();

    expect(mockTempoIndicationFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 25,
      }),
    );
    expect(result).toEqual({
      items: [
        {
          id: "ti-1",
          text: "Allegro",
          createdAt: createdAt.toISOString(),
          author: { id: "u-1", name: "Alice", email: "alice@example.com" },
          categories: [{ id: "cat-1", name: "Allegro" }],
        },
      ],
      nextCursor: null,
    });
  });

  it("supports asc sort order and uncategorized filter", async () => {
    mockTempoIndicationFindMany.mockResolvedValueOnce([]);

    await getAdminTempoIndications({
      sortOrder: "asc",
      categoryFilter: "uncategorized",
      limit: 10,
      cursor: "ti-0",
    });

    expect(mockTempoIndicationFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tempoCategories: { none: {} } },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        take: 10,
        cursor: { id: "ti-0" },
        skip: 1,
      }),
    );
  });

  it("filters by a specific tempoCategoryId", async () => {
    mockTempoIndicationFindMany.mockResolvedValueOnce([]);

    await getAdminTempoIndications({ categoryFilter: "cat-42" });

    expect(mockTempoIndicationFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tempoCategories: { some: { tempoCategoryId: "cat-42" } } },
      }),
    );
  });
});

describe("tempoCategoriesAdmin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTransaction.mockImplementation(async (cb: (tx: unknown) => unknown) =>
      cb({
        tempoCategory: {
          findFirst: mockTempoCategoryFindFirst,
          findUnique: mockTempoCategoryFindUnique,
          aggregate: mockTempoCategoryAggregate,
          create: mockTempoCategoryCreate,
          delete: mockTempoCategoryDelete,
        },
      }),
    );
  });

  it("creates a category with rank = max + 1", async () => {
    mockTempoCategoryFindFirst.mockResolvedValueOnce(null);
    mockTempoCategoryAggregate.mockResolvedValueOnce({ _max: { rank: 7 } });
    mockTempoCategoryCreate.mockResolvedValueOnce({
      id: "cat-8",
      name: "Scherzo",
      rank: 8,
      _count: { tempoIndications: 0 },
    });

    const created = await createAdminTempoCategory("  Scherzo  ");

    expect(mockTempoCategoryCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { name: "Scherzo", rank: 8 },
      }),
    );
    expect(created).toEqual({
      id: "cat-8",
      name: "Scherzo",
      rank: 8,
      tempoIndicationCount: 0,
    });
  });

  it("rejects duplicate category creation with 409", async () => {
    mockTempoCategoryFindFirst.mockResolvedValueOnce({ id: "cat-1" });

    await expect(createAdminTempoCategory("Adagio")).rejects.toMatchObject({
      status: 409,
    });
  });

  it("blocks deleting a category with linked tempo indications (409)", async () => {
    mockTempoCategoryFindUnique.mockResolvedValueOnce({
      id: "cat-1",
      _count: { tempoIndications: 3 },
    });

    await expect(deleteAdminTempoCategory("cat-1")).rejects.toThrow(
      AdminTempoActionError,
    );
    expect(mockTempoCategoryDelete).not.toHaveBeenCalled();
  });

  it("deletes a category when linked tempoIndicationCount is 0", async () => {
    mockTempoCategoryFindUnique.mockResolvedValueOnce({
      id: "cat-9",
      _count: { tempoIndications: 0 },
    });
    mockTempoCategoryDelete.mockResolvedValueOnce({ id: "cat-9" });

    const res = await deleteAdminTempoCategory("cat-9");

    expect(mockTempoCategoryDelete).toHaveBeenCalledWith({
      where: { id: "cat-9" },
    });
    expect(res).toEqual({ deletedId: "cat-9" });
  });

  it("adds and removes category links on a tempo indication", async () => {
    mockTempoIndicationFindUnique.mockResolvedValue({ id: "ti-1" });
    mockTempoCategoryFindUnique.mockResolvedValue({ id: "cat-1" });
    mockLinkUpsert.mockResolvedValue({});
    mockLinkFindMany.mockResolvedValueOnce([
      { tempoCategory: { id: "cat-1", name: "Adagio" } },
    ]);

    const added = await addCategoryToTempoIndication("ti-1", "cat-1");
    expect(mockLinkUpsert).toHaveBeenCalled();
    expect(added).toEqual([{ id: "cat-1", name: "Adagio" }]);

    mockLinkDeleteMany.mockResolvedValue({ count: 1 });
    mockLinkFindMany.mockResolvedValueOnce([]);
    const removed = await removeCategoryFromTempoIndication("ti-1", "cat-1");
    expect(mockLinkDeleteMany).toHaveBeenCalledWith({
      where: { tempoIndicationId: "ti-1", tempoCategoryId: "cat-1" },
    });
    expect(removed).toEqual([]);
  });
});
