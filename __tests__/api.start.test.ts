// Mock NextResponse.json for easier assertions
jest.mock("next/server", () => ({
  NextResponse: {
    json: (obj: any, init?: any) => ({
      ok: !init || !init.status || init.status < 400,
      status: init?.status ?? 200,
      json: async () => obj,
    }),
  },
}));

// Mocks for next-auth and Prisma db
const getServerSessionMock = jest.fn();
jest.mock("next-auth", () => ({
  getServerSession: (...args: any[]) => getServerSessionMock(...args),
}));

// Build a controllable db mock
const mMSourceFindUnique = jest.fn();
const mMSourceUpdate = jest.fn();
const reviewFindFirst = jest.fn();
const reviewCreate = jest.fn();

const tx = {
  review: { create: reviewCreate },
  mMSource: { update: mMSourceUpdate },
};

const dbMock = {
  mMSource: { findUnique: mMSourceFindUnique, update: mMSourceUpdate },
  review: { findFirst: reviewFindFirst, create: reviewCreate },
  $transaction: async (cb: any) => cb(tx),
};

jest.mock("../utils/server/db", () => ({ db: dbMock }));

const { POST: startPost } = require("../app/api/review/start/route");

describe("POST /api/review/start", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function session(user: any | null) {
    getServerSessionMock.mockResolvedValue(user ? { user } : null);
  }

  it("returns 401 when unauthenticated", async () => {
    session(null);
    const req: any = { json: async () => ({ mmSourceId: "src-1" }) };
    const res = await startPost(req);
    expect(res.status).toBe(401);
    const j = await res.json();
    expect(j.error).toMatch(/Unauthorized/);
  });

  it("returns 403 when role is not REVIEWER+", async () => {
    session({ id: "u-1", role: "USER" });
    const req: any = { json: async () => ({ mmSourceId: "src-1" }) };
    const res = await startPost(req);
    expect(res.status).toBe(403);
    const j = await res.json();
    expect(j.error).toMatch(/Forbidden/);
  });

  it("returns 404 when source not found", async () => {
    session({ id: "u-1", role: "REVIEWER" });
    mMSourceFindUnique.mockResolvedValue(null);
    const req: any = { json: async () => ({ mmSourceId: "src-x" }) };
    const res = await startPost(req);
    expect(res.status).toBe(404);
  });

  it("returns 400 when reviewer tries to review own source", async () => {
    session({ id: "u-1", role: "REVIEWER" });
    mMSourceFindUnique.mockResolvedValue({
      id: "src-1",
      creatorId: "u-1",
      reviewState: "PENDING",
    });
    const req: any = { json: async () => ({ mmSourceId: "src-1" }) };
    const res = await startPost(req);
    expect(res.status).toBe(400);
    const j = await res.json();
    expect(j.error).toMatch(/own MM Source/);
  });

  it("returns 409 when an active review exists", async () => {
    session({ id: "u-1", role: "REVIEWER" });
    mMSourceFindUnique.mockResolvedValue({
      id: "src-1",
      creatorId: "other",
      reviewState: "PENDING",
    });
    reviewFindFirst.mockResolvedValue({ id: "rev-active" });
    const req: any = { json: async () => ({ mmSourceId: "src-1" }) };
    const res = await startPost(req);
    expect(res.status).toBe(409);
    const j = await res.json();
    expect(j.error).toMatch(/already in progress/);
  });

  it("creates a review and flips source state when ok", async () => {
    session({ id: "u-1", role: "REVIEWER" });
    mMSourceFindUnique.mockResolvedValue({
      id: "src-1",
      creatorId: "other",
      reviewState: "PENDING",
    });
    reviewFindFirst.mockResolvedValue(null);
    reviewCreate.mockResolvedValue({ id: "rev-1" });
    mMSourceUpdate.mockResolvedValue({});

    const req: any = { json: async () => ({ mmSourceId: "src-1" }) };
    const res = await startPost(req);
    expect(res.ok).toBe(true);
    const j = await res.json();
    expect(j.reviewId).toBe("rev-1");
    // Ensure transactional updates attempted
    expect(reviewCreate).toHaveBeenCalled();
    expect(mMSourceUpdate).toHaveBeenCalled();
  });
});
