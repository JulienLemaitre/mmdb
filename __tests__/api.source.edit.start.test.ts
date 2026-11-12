jest.mock("next/server", () => ({
  NextResponse: {
    json: (obj: any, init?: any) => ({
      ok: !init || !init.status || init.status < 400,
      status: init?.status ?? 200,
      json: async () => obj,
    }),
  },
}));

import { REVIEW_STATE } from "@/prisma/client";

const mockGetServerSession = jest.fn();
jest.mock("next-auth", () => ({
  getServerSession: (...args: any[]) => mockGetServerSession(...args),
}));

const mockMMSourceFindUnique = jest.fn();
const mockMMSourceUpdate = jest.fn();
const mockReviewFindFirst = jest.fn();

const mockTx = {
  mMSource: { update: mockMMSourceUpdate },
};

const mockDb = {
  mMSource: { findUnique: mockMMSourceFindUnique, update: mockMMSourceUpdate },
  review: { findFirst: mockReviewFindFirst },
  $transaction: jest.fn(async (cb: any) => cb(mockTx)),
};

jest.mock("@/utils/server/db", () => ({
  get db() {
    return mockDb;
  },
}));

// Import the route handler to test
import { POST } from "@/app/api/source/[sourceId]/edit/start/route";

describe("POST /api/source/[sourceId]/edit/start", () => {
  const AUTHOR_ID = "user-author-1";
  const OTHER_USER_ID = "user-other-2";
  const SOURCE_ID = "source-test-1";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function session(user: any | null) {
    mockGetServerSession.mockResolvedValue(user ? { user } : null);
  }

  it("returns 401 when unauthenticated", async () => {
    session(null);
    const req: any = {};
    const res = await POST(req, {
      params: Promise.resolve({ sourceId: SOURCE_ID }),
    });

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toMatch(/\[selfEdit start\] Unauthorized/);
  });

  it("returns 400 when sourceId parameter is missing", async () => {
    session({ id: AUTHOR_ID });
    const req: any = {};
    const res = await POST(req, {
      params: Promise.resolve({ sourceId: "" }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Missing sourceId/);
  });

  it("returns 404 when MM Source does not exist", async () => {
    session({ id: AUTHOR_ID });
    mockMMSourceFindUnique.mockResolvedValue(null);

    const req: any = {};
    const res = await POST(req, {
      params: Promise.resolve({ sourceId: SOURCE_ID }),
    });

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toMatch(/\[selfEdit start\] MM Source not found/);
  });

  it("returns 403 when user is not the creator of the MM Source", async () => {
    session({ id: OTHER_USER_ID });
    mockMMSourceFindUnique.mockResolvedValue({
      id: SOURCE_ID,
      creatorId: AUTHOR_ID,
      reviewState: REVIEW_STATE.PENDING,
    });

    const req: any = {};
    const res = await POST(req, {
      params: Promise.resolve({ sourceId: SOURCE_ID }),
    });

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toMatch(/\[selfEdit start\] Forbidden: only creator can edit/);
  });

  it("returns 409 when the MM Source is already in review", async () => {
    session({ id: AUTHOR_ID });
    mockMMSourceFindUnique.mockResolvedValue({
      id: SOURCE_ID,
      creatorId: AUTHOR_ID,
      reviewState: REVIEW_STATE.IN_REVIEW,
    });

    const req: any = {};
    const res = await POST(req, {
      params: Promise.resolve({ sourceId: SOURCE_ID }),
    });

    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toMatch(/A review is currently in progress/);
  });

  it("returns 409 when an active review record exists in DB for this source", async () => {
    session({ id: AUTHOR_ID });
    mockMMSourceFindUnique.mockResolvedValue({
      id: SOURCE_ID,
      creatorId: AUTHOR_ID,
      reviewState: REVIEW_STATE.PENDING,
    });
    mockReviewFindFirst.mockResolvedValue({ id: "rev-active-1" });

    const req: any = {};
    const res = await POST(req, {
      params: Promise.resolve({ sourceId: SOURCE_ID }),
    });

    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toMatch(/A review is currently in progress/);
  });

  it("acquires lock and returns 200 with status 'locked' when source is PENDING", async () => {
    session({ id: AUTHOR_ID });
    mockMMSourceFindUnique.mockResolvedValue({
      id: SOURCE_ID,
      creatorId: AUTHOR_ID,
      reviewState: REVIEW_STATE.PENDING,
    });
    mockReviewFindFirst.mockResolvedValue(null);
    mockMMSourceUpdate.mockResolvedValue({
      id: SOURCE_ID,
      reviewState: REVIEW_STATE.IN_SELF_EDIT,
    });

    const req: any = {};
    const res = await POST(req, {
      params: Promise.resolve({ sourceId: SOURCE_ID }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({
      success: true,
      mMSourceId: SOURCE_ID,
      status: "locked",
    });

    expect(mockDb.$transaction).toHaveBeenCalledTimes(1);
    expect(mockMMSourceUpdate).toHaveBeenCalledWith({
      where: { id: SOURCE_ID },
      data: { reviewState: REVIEW_STATE.IN_SELF_EDIT },
    });
  });

  it("acquires lock and returns 200 with status 'locked' when source is ABORTED", async () => {
    session({ id: AUTHOR_ID });
    mockMMSourceFindUnique.mockResolvedValue({
      id: SOURCE_ID,
      creatorId: AUTHOR_ID,
      reviewState: REVIEW_STATE.ABORTED,
    });
    mockReviewFindFirst.mockResolvedValue(null);
    mockMMSourceUpdate.mockResolvedValue({
      id: SOURCE_ID,
      reviewState: REVIEW_STATE.IN_SELF_EDIT,
    });

    const req: any = {};
    const res = await POST(req, {
      params: Promise.resolve({ sourceId: SOURCE_ID }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({
      success: true,
      mMSourceId: SOURCE_ID,
      status: "locked",
    });

    expect(mockDb.$transaction).toHaveBeenCalledTimes(1);
    expect(mockMMSourceUpdate).toHaveBeenCalledWith({
      where: { id: SOURCE_ID },
      data: { reviewState: REVIEW_STATE.IN_SELF_EDIT },
    });
  });

  it("returns 200 with status 'resumed' when source is already in IN_SELF_EDIT by the same author", async () => {
    session({ id: AUTHOR_ID });
    mockMMSourceFindUnique.mockResolvedValue({
      id: SOURCE_ID,
      creatorId: AUTHOR_ID,
      reviewState: REVIEW_STATE.IN_SELF_EDIT,
    });
    mockReviewFindFirst.mockResolvedValue(null);

    const req: any = {};
    const res = await POST(req, {
      params: Promise.resolve({ sourceId: SOURCE_ID }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({
      success: true,
      mMSourceId: SOURCE_ID,
      status: "resumed",
    });

    // Does not need to update or if it did, it's a no-op
    expect(mockMMSourceUpdate).not.toHaveBeenCalled();
  });
});
