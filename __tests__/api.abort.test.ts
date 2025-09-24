// Mock NextResponse.json for simpler testing
jest.mock("next/server", () => ({
  NextResponse: {
    json: (obj: any, init?: any) => ({
      ok: !init || !init.status || init.status < 400,
      status: init?.status ?? 200,
      json: async () => obj,
    }),
  },
}));

const getServerSessionMock = jest.fn();
jest.mock("next-auth", () => ({ getServerSession: (...args: any[]) => getServerSessionMock(...args) }));

import { REVIEW_STATE } from "@prisma/client";

const reviewFindUnique = jest.fn();
const reviewUpdate = jest.fn();
const mMSourceUpdate = jest.fn();
const tx = {
  review: { update: reviewUpdate },
  mMSource: { update: mMSourceUpdate },
};
const dbMock = {
  review: { findUnique: reviewFindUnique, update: reviewUpdate },
  mMSource: { update: mMSourceUpdate },
  $transaction: async (cb: any) => cb(tx),
};
jest.mock("../utils/db", () => ({ db: dbMock }));

const { POST: abortPost } = require("../app/api/review/[reviewId]/abort/route");

describe("POST /api/review/[reviewId]/abort", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const session = (user: any | null) => getServerSessionMock.mockResolvedValue(user ? { user } : null);

  it("401 when unauthenticated", async () => {
    session(null);
    const res = await abortPost({ json: async () => ({}) } as any, { params: { reviewId: "rev-1" } });
    expect(res.status).toBe(401);
  });

  it("403 when role not REVIEWER+", async () => {
    session({ id: "u-1", role: "USER" });
    const res = await abortPost({ json: async () => ({}) } as any, { params: { reviewId: "rev-1" } });
    expect(res.status).toBe(403);
  });

  it("404 when review not found", async () => {
    session({ id: "u-1", role: "REVIEWER" });
    reviewFindUnique.mockResolvedValue(null);
    const res = await abortPost({ json: async () => ({}) } as any, { params: { reviewId: "rev-x" } });
    expect(res.status).toBe(404);
  });

  it("403 when not owner and not admin", async () => {
    session({ id: "u-1", role: "REVIEWER" });
    reviewFindUnique.mockResolvedValue({ id: "rev-1", creatorId: "u-2", state: REVIEW_STATE.IN_REVIEW, mMSourceId: "src-1" });
    const res = await abortPost({ json: async () => ({}) } as any, { params: { reviewId: "rev-1" } });
    expect(res.status).toBe(403);
  });

  it("400 when review not IN_REVIEW", async () => {
    session({ id: "u-1", role: "REVIEWER" });
    reviewFindUnique.mockResolvedValue({ id: "rev-1", creatorId: "u-1", state: REVIEW_STATE.APPROVED, mMSourceId: "src-1" });
    const res = await abortPost({ json: async () => ({}) } as any, { params: { reviewId: "rev-1" } });
    expect(res.status).toBe(400);
  });

  it("aborts: flips Review and MMSource state", async () => {
    session({ id: "u-1", role: "REVIEWER" });
    reviewFindUnique.mockResolvedValue({ id: "rev-1", creatorId: "u-1", state: REVIEW_STATE.IN_REVIEW, mMSourceId: "src-1" });
    reviewUpdate.mockResolvedValue({});
    mMSourceUpdate.mockResolvedValue({});

    const res = await abortPost({ json: async () => ({ reason: "mistake" }) } as any, { params: { reviewId: "rev-1" } });
    expect(res.ok).toBe(true);
    const j = await res.json();
    expect(j.ok).toBe(true);
    expect(j.reviewId).toBe("rev-1");
    expect(reviewUpdate).toHaveBeenCalled();
    expect(mMSourceUpdate).toHaveBeenCalled();
  });
});
