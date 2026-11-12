import { REVIEW_STATE } from "@/prisma/client";

const mockGetServerSession = jest.fn();
jest.mock("next-auth", () => ({
  getServerSession: (...args: any[]) => mockGetServerSession(...args),
}));

const mockMMSourceFindMany = jest.fn();
const mockDb = {
  mMSource: {
    findMany: mockMMSourceFindMany,
  },
};

jest.mock("@/utils/server/db", () => ({
  get db() {
    return mockDb;
  },
}));

import { getToReviewFromDb } from "@/utils/server/getToReviewFromDb";

describe("getToReviewFromDb", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("excludes sources in IN_SELF_EDIT from the review list", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "rev-1", role: "REVIEWER" },
    });

    mockMMSourceFindMany.mockImplementation(async ({ where }: any) => {
      // Simulating a DB with two sources: one PENDING, one IN_SELF_EDIT
      const dbSources = [
        {
          id: "src-pending",
          title: "Pending Source",
          link: null,
          permalink: null,
          createdAt: new Date(),
          creator: { id: "u-1", name: "User 1", email: "u1@test.com" },
          pieceVersions: [],
          reviewState: REVIEW_STATE.PENDING,
        },
        {
          id: "src-in-self-edit",
          title: "Self Edit Source",
          link: null,
          permalink: null,
          createdAt: new Date(),
          creator: { id: "u-2", name: "User 2", email: "u2@test.com" },
          pieceVersions: [],
          reviewState: REVIEW_STATE.IN_SELF_EDIT,
        },
      ];

      return dbSources.filter((s) => where.reviewState.in.includes(s.reviewState));
    });

    const result = await getToReviewFromDb();
    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe("src-pending");

    expect(mockMMSourceFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          reviewState: { in: [REVIEW_STATE.PENDING, REVIEW_STATE.ABORTED] },
        }),
      }),
    );
  });
});
