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

const mockTx = {
  mMSource: { update: mockMMSourceUpdate },
};

const mockDb = {
  mMSource: { findUnique: mockMMSourceFindUnique, update: mockMMSourceUpdate },
  $transaction: jest.fn(async (cb: any) => cb(mockTx)),
};

jest.mock("@/utils/server/db", () => ({
  get db() {
    return mockDb;
  },
}));

import { POST } from "@/app/api/source/[sourceId]/edit/abort/route";

describe("POST /api/source/[sourceId]/edit/abort", () => {
  const AUTHOR_ID = "user-author-1";
  const OTHER_USER_ID = "user-other-2";
  const ADMIN_ID = "user-admin-9";
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
    expect(json.error).toMatch(/\[selfEdit abort\] Unauthorized/);
  });

  it("returns 400 when sourceId parameter is missing", async () => {
    session({ id: AUTHOR_ID, role: "USER" });
    const req: any = {};
    const res = await POST(req, {
      params: Promise.resolve({ sourceId: "" }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Missing sourceId/);
  });

  it("returns 404 when MM Source does not exist", async () => {
    session({ id: AUTHOR_ID, role: "USER" });
    mockMMSourceFindUnique.mockResolvedValue(null);

    const req: any = {};
    const res = await POST(req, {
      params: Promise.resolve({ sourceId: SOURCE_ID }),
    });

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toMatch(/\[selfEdit abort\] MM Source not found/);
  });

  it("returns 403 when user is neither creator nor ADMIN", async () => {
    session({ id: OTHER_USER_ID, role: "USER" });
    mockMMSourceFindUnique.mockResolvedValue({
      id: SOURCE_ID,
      creatorId: AUTHOR_ID,
      reviewState: REVIEW_STATE.IN_SELF_EDIT,
    });

    const req: any = {};
    const res = await POST(req, {
      params: Promise.resolve({ sourceId: SOURCE_ID }),
    });

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toMatch(/\[selfEdit abort\] Forbidden: only creator or admin/);
  });

  it("returns 400 when the source is not in IN_SELF_EDIT state", async () => {
    session({ id: AUTHOR_ID, role: "USER" });
    mockMMSourceFindUnique.mockResolvedValue({
      id: SOURCE_ID,
      creatorId: AUTHOR_ID,
      reviewState: REVIEW_STATE.PENDING,
    });

    const req: any = {};
    const res = await POST(req, {
      params: Promise.resolve({ sourceId: SOURCE_ID }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/\[selfEdit abort\] Source is not currently in self-edit/);
  });

  it("releases lock to PENDING and returns 200 when creator aborts", async () => {
    session({ id: AUTHOR_ID, role: "USER" });
    mockMMSourceFindUnique.mockResolvedValue({
      id: SOURCE_ID,
      creatorId: AUTHOR_ID,
      reviewState: REVIEW_STATE.IN_SELF_EDIT,
    });
    mockMMSourceUpdate.mockResolvedValue({
      id: SOURCE_ID,
      reviewState: REVIEW_STATE.PENDING,
    });

    const req: any = {};
    const res = await POST(req, {
      params: Promise.resolve({ sourceId: SOURCE_ID }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({
      ok: true,
      mMSourceId: SOURCE_ID,
    });

    expect(mockDb.$transaction).toHaveBeenCalledTimes(1);
    expect(mockMMSourceUpdate).toHaveBeenCalledWith({
      where: { id: SOURCE_ID },
      data: { reviewState: REVIEW_STATE.PENDING },
    });
  });

  it("releases lock to PENDING and returns 200 when an ADMIN aborts", async () => {
    session({ id: ADMIN_ID, role: "ADMIN" });
    mockMMSourceFindUnique.mockResolvedValue({
      id: SOURCE_ID,
      creatorId: AUTHOR_ID,
      reviewState: REVIEW_STATE.IN_SELF_EDIT,
    });
    mockMMSourceUpdate.mockResolvedValue({
      id: SOURCE_ID,
      reviewState: REVIEW_STATE.PENDING,
    });

    const req: any = {};
    const res = await POST(req, {
      params: Promise.resolve({ sourceId: SOURCE_ID }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({
      ok: true,
      mMSourceId: SOURCE_ID,
    });

    expect(mockDb.$transaction).toHaveBeenCalledTimes(1);
    expect(mockMMSourceUpdate).toHaveBeenCalledWith({
      where: { id: SOURCE_ID },
      data: { reviewState: REVIEW_STATE.PENDING },
    });
  });
});
