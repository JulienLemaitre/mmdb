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

const { POST: postSubmit } = require("../app/api/review/[reviewId]/submit/route");
import { buildMockOverview } from "@/utils/reviewMock";
import { expandRequiredChecklistItems } from "@/utils/ReviewChecklistSchema";

describe("POST /api/review/[reviewId]/submit", () => {
  it("rejects when checklist is incomplete", async () => {
    const reviewId = "r-1";
    const { graph } = buildMockOverview(reviewId);
    const stubReq: any = { json: async () => ({ workingCopy: graph, checklistState: [], overallComment: null }) };
    const res = await postSubmit(stubReq, { params: { reviewId } });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Incomplete checklist/);
    expect(json.missingCount).toBeGreaterThan(0);
  });

  it("accepts when all required items are checked and returns summary + auditPreview", async () => {
    const reviewId = "r-2";
    const { graph, globallyReviewed } = buildMockOverview(reviewId);
    const required = expandRequiredChecklistItems(graph, {
      globallyReviewed: {
        personIds: new Set(globallyReviewed.personIds ?? []),
        organizationIds: new Set(globallyReviewed.organizationIds ?? []),
        collectionIds: new Set(globallyReviewed.collectionIds ?? []),
        pieceIds: new Set(globallyReviewed.pieceIds ?? []),
      },
    });
    const checklistState = required.map((it) => ({ entityType: it.entityType, entityId: it.entityId ?? null, fieldPath: it.fieldPath, checked: true }));
    const stubReq: any = { json: async () => ({ workingCopy: graph, checklistState, overallComment: "ok" }) };
    const res = await postSubmit(stubReq, { params: { reviewId } });
    expect(res.ok).toBe(true);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.summary.requiredCount).toBe(required.length);
    expect(json.summary.submittedCheckedCount).toBeGreaterThan(0);
    expect(json.auditPreview).toBeDefined();
    expect(typeof json.auditPreview.count).toBe("number");
  });
});
