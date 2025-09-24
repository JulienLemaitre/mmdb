// Mock NextResponse.json similar to other API tests
jest.mock("next/server", () => ({
  NextResponse: {
    json: (obj: any, init?: any) => ({
      ok: !init || !init.status || init.status < 400,
      status: init?.status ?? 200,
      json: async () => obj,
    }),
  },
}));

// Mock server util so we don't depend on next-auth/db
const mockGetAuditLogs = jest.fn();
jest.mock("../utils/server/getAuditLogs", () => ({
  getAuditLogs: (...args: any[]) => mockGetAuditLogs(...args),
}));

const { GET: getAudit } = require("../app/api/audit/route");

describe("GET /api/audit", () => {
  beforeEach(() => {
    mockGetAuditLogs.mockReset();
  });

  it("returns 400 when missing filters", async () => {
    const res = await getAudit({ url: "http://localhost/api/audit" } as any);
    expect(res.status).toBe(400);
    const j = await res.json();
    expect(j.error).toMatch(/either reviewId OR entityType\+entityId/);
  });

  it("returns 403 when util throws Forbidden", async () => {
    mockGetAuditLogs.mockRejectedValueOnce(new Error("Forbidden: reviewer role required"));
    const res = await getAudit({ url: "http://localhost/api/audit?reviewId=r-1" } as any);
    expect(res.status).toBe(403);
    const j = await res.json();
    expect(j.error).toMatch(/Forbidden/);
  });

  it("returns 200 with items for reviewId filter", async () => {
    mockGetAuditLogs.mockResolvedValueOnce({
      items: [
        {
          id: "a1",
          reviewId: "r-1",
          entityType: "PIECE",
          entityId: "p-1",
          operation: "UPDATE",
          before: { title: "Old" },
          after: { title: "New" },
          authorId: "u-1",
          createdAt: new Date().toISOString(),
          comment: null,
        },
      ],
      nextCursor: null,
    });
    const res = await getAudit({ url: "http://localhost/api/audit?reviewId=r-1&limit=10" } as any);
    expect(res.ok).toBe(true);
    const j = await res.json();
    expect(Array.isArray(j.items)).toBe(true);
    expect(j.items[0].operation).toBe("UPDATE");
  });

  it("accepts entityType+entityId mode", async () => {
    mockGetAuditLogs.mockResolvedValueOnce({ items: [], nextCursor: null });
    const res = await getAudit({ url: "http://localhost/api/audit?entityType=PIECE&entityId=p-1" } as any);
    expect(res.ok).toBe(true);
    const j = await res.json();
    expect(j.items).toEqual([]);
  });
});
