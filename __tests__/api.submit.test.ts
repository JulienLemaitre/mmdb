// Mock NextResponse.json to avoid depending on global Request in next/server
import { expandRequiredChecklistItems } from "@/features/review/utils/expandRequiredChecklistItems";

jest.mock("next/server", () => ({
  NextResponse: {
    json: (obj: any, init?: any) => ({
      ok: !init || !init.status || init.status < 400,
      status: init?.status ?? 200,
      json: async () => obj,
    }),
  },
}));

// Mock the DB-backed overview call used by the submit handler to avoid next-auth/openid-client
jest.mock("../utils/server/getReviewOverview", () => ({
  getReviewOverview: async (reviewId: string) => {
    const { buildMockOverview } = require("../features/review/reviewMock");
    const { graph, globallyReviewed } = buildMockOverview(reviewId);
    return { graph, globallyReviewed };
  },
}));

const {
  POST: postSubmit,
} = require("../app/api/review/[reviewId]/submit/route");
import { buildMockOverview } from "@/features/review/reviewMock";

describe("POST /api/review/[reviewId]/submit", () => {
  it("rejects when checklist is incomplete", async () => {
    const reviewId = "r-1";
    const { graph } = buildMockOverview(reviewId);
    const stubReq: any = {
      json: async () => ({
        workingCopy: graph,
        checklistState: [],
        overallComment: null,
      }),
    };
    const res = await postSubmit(stubReq, { params: { reviewId } });
    const json = await res.json();
    // Debug aid if failing
    if (res.status !== 400) {
      // eslint-disable-next-line no-console
      console.log("submit incomplete debug:", res.status, json);
    }
    expect(res.status).toBe(400);
    expect(json.error).toMatch(/Incomplete checklist/);
    expect(json.missingCount).toBeGreaterThan(0);
  });

  it("accepts when all required items are checked and returns summary", async () => {
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
    const checklistState = required.map((it) => ({
      entityType: it.entityType,
      entityId: it.entityId ?? null,
      fieldPath: it.fieldPath,
      checked: true,
    }));
    const stubReq: any = {
      json: async () => ({
        workingCopy: graph,
        checklistState,
        overallComment: "ok",
      }),
    };
    const res = await postSubmit(stubReq, { params: { reviewId } });
    expect(res.ok).toBe(true);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.summary.requiredCount).toBe(required.length);
    expect(json.summary.submittedCheckedCount).toBeGreaterThan(0);
  });
});
