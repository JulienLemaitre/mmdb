// Mock NextResponse.json to avoid depending on global Request in next/server
jest.mock("next/server", () => ({
  NextResponse: {
    json: (obj: any, init?: any) => ({
      ok: !init || !init.status || init.status < 400,
      status: init?.status ?? 200,
      json: async () => obj,
    }),
  },
}));

const { GET: getOverview } = require("../app/api/review/[reviewId]/overview/route");

describe("GET /api/review/[reviewId]/overview", () => {
  it("returns the mock graph and progress for a reviewId", async () => {
    // Request object is not used by the handler; pass a stub
    const res = await getOverview({} as any, { params: { reviewId: "r-1" } });
    expect(res.ok).toBe(true);
    const json = await res.json();
    expect(json.reviewId).toBe("r-1");
    expect(json.graph?.source?.title).toMatch(/Mock Review Source/);
    expect(Array.isArray(json.sourceContents)).toBe(true);
    expect(json.progress?.source?.required).toBeGreaterThan(0);
  });
});
