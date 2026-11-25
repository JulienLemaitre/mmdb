jest.mock("next/server", () => ({
  NextResponse: {
    json: (obj: unknown, init?: { status?: number }) => ({
      ok: !init || !init.status || init.status < 400,
      status: init?.status ?? 200,
      json: async () => obj,
    }),
  },
}));

const mockGetServerSession = jest.fn();
jest.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

jest.mock("@/auth/options", () => ({
  authOptions: {},
}));

const mockGetAdminTempoIndications = jest.fn();
jest.mock("@/utils/server/admin/getAdminTempoIndications", () => ({
  getAdminTempoIndications: (...args: unknown[]) =>
    mockGetAdminTempoIndications(...args),
}));

const mockGetAdminTempoCategories = jest.fn();
const mockCreateAdminTempoCategory = jest.fn();
const mockDeleteAdminTempoCategory = jest.fn();
const mockAddCategoryToTempoIndication = jest.fn();
const mockRemoveCategoryFromTempoIndication = jest.fn();

jest.mock("@/utils/server/admin/tempoCategoriesAdmin", () => {
  class MockAdminTempoActionError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  }
  return {
    AdminTempoActionError: MockAdminTempoActionError,
    getAdminTempoCategories: (...args: unknown[]) =>
      mockGetAdminTempoCategories(...args),
    createAdminTempoCategory: (...args: unknown[]) =>
      mockCreateAdminTempoCategory(...args),
    deleteAdminTempoCategory: (...args: unknown[]) =>
      mockDeleteAdminTempoCategory(...args),
    addCategoryToTempoIndication: (...args: unknown[]) =>
      mockAddCategoryToTempoIndication(...args),
    removeCategoryFromTempoIndication: (...args: unknown[]) =>
      mockRemoveCategoryFromTempoIndication(...args),
  };
});

const { AdminTempoActionError } = require("@/utils/server/admin/tempoCategoriesAdmin");
const {
  GET: getTempoIndications,
} = require("../app/api/admin/tempo-indications/route");
const {
  POST: postIndicationCategory,
  DELETE: deleteIndicationCategory,
} = require("../app/api/admin/tempo-indications/[id]/categories/route");
const {
  GET: getTempoCategories,
  POST: postTempoCategory,
} = require("../app/api/admin/tempo-categories/route");
const {
  DELETE: deleteTempoCategory,
} = require("../app/api/admin/tempo-categories/[id]/route");

describe("Admin tempo API routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when unauthenticated and 403 when non-admin", async () => {
    mockGetServerSession.mockResolvedValueOnce(null);
    const res401 = await getTempoIndications({
      url: "http://localhost/api/admin/tempo-indications",
    });
    expect(res401.status).toBe(401);

    mockGetServerSession.mockResolvedValueOnce({
      user: { id: "u-1", role: "USER" },
    });
    const res403 = await getTempoCategories();
    expect(res403.status).toBe(403);
  });

  it("GET /api/admin/tempo-indications forwards query filters", async () => {
    mockGetServerSession.mockResolvedValueOnce({
      user: { id: "admin-1", role: "ADMIN" },
    });
    mockGetAdminTempoIndications.mockResolvedValueOnce({
      items: [],
      nextCursor: null,
    });

    const res = await getTempoIndications({
      url: "http://localhost/api/admin/tempo-indications?sortOrder=asc&categoryFilter=uncategorized&limit=25&cursor=c1",
    });

    expect(res.status).toBe(200);
    expect(mockGetAdminTempoIndications).toHaveBeenCalledWith({
      cursor: "c1",
      limit: 25,
      sortOrder: "asc",
      categoryFilter: "uncategorized",
    });
  });

  it("POST and DELETE /api/admin/tempo-indications/[id]/categories manage links", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN" },
    });
    mockAddCategoryToTempoIndication.mockResolvedValueOnce([
      { id: "cat-1", name: "Adagio" },
    ]);

    const postRes = await postIndicationCategory(
      { json: async () => ({ tempoCategoryId: "cat-1" }) },
      { params: Promise.resolve({ id: "ti-1" }) },
    );
    expect(postRes.status).toBe(200);
    expect(await postRes.json()).toEqual({
      categories: [{ id: "cat-1", name: "Adagio" }],
    });

    mockRemoveCategoryFromTempoIndication.mockResolvedValueOnce([]);
    const delRes = await deleteIndicationCategory(
      {
        url: "http://localhost/api/admin/tempo-indications/ti-1/categories?tempoCategoryId=cat-1",
      },
      { params: Promise.resolve({ id: "ti-1" }) },
    );
    expect(delRes.status).toBe(200);
    expect(await delRes.json()).toEqual({ categories: [] });
  });

  it("POST /api/admin/tempo-categories creates category and DELETE returns 409 when linked", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN" },
    });
    mockCreateAdminTempoCategory.mockResolvedValueOnce({
      id: "cat-8",
      name: "Scherzo",
      rank: 8,
      tempoIndicationCount: 0,
    });

    const createRes = await postTempoCategory({
      json: async () => ({ name: "Scherzo" }),
    });
    expect(createRes.status).toBe(201);

    mockDeleteAdminTempoCategory.mockRejectedValueOnce(
      new AdminTempoActionError(
        "Cannot delete a category that has linked tempo indications",
        409,
      ),
    );
    const delRes = await deleteTempoCategory(
      {},
      { params: Promise.resolve({ id: "cat-1" }) },
    );
    expect(delRes.status).toBe(409);
  });
});
