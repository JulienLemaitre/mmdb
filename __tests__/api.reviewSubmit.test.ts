jest.mock("next/server", () => ({
  NextResponse: {
    json: (obj: any, init?: any) => ({
      ok: !init || !init.status || init.status < 400,
      status: init?.status ?? 200,
      json: async () => obj,
    }),
  },
}));

import {
  AUDIT_ENTITY_TYPE,
  OPERATION,
  REVIEW_STATE,
  SOURCE_TYPE,
} from "@/prisma/client";
import { FeedFormState } from "@/types/feedFormTypes";

const mockGetServerSession = jest.fn();
jest.mock("next-auth", () => ({
  getServerSession: (...args: any[]) => mockGetServerSession(...args),
}));

const mockSendEmail = jest.fn().mockResolvedValue({ id: "email-1" });
jest.mock("@/utils/server/sendEmail", () => ({
  __esModule: true,
  default: (...args: any[]) => mockSendEmail(...args),
}));

const mockGetReviewBaseline = jest.fn();
const mockExtendBaselineByExistence = jest.fn();

jest.mock("@/utils/server/getReviewBaseline", () => ({
  getReviewBaseline: (...args: any[]) => mockGetReviewBaseline(...args),
}));

jest.mock("@/utils/server/extendBaselineByExistence", () => ({
  extendBaselineByExistence: (...args: any[]) =>
    mockExtendBaselineByExistence(...args),
}));

// In-memory Prisma mock transaction
function createMockPrisma() {
  const store: Record<string, any[]> = {
    person: [],
    organization: [],
    collection: [],
    piece: [],
    pieceVersion: [],
    movement: [],
    section: [],
    tempoIndication: [],
    reference: [],
    contribution: [],
    metronomeMark: [],
    mMSourcesOnPieceVersions: [],
    auditLog: [],
    reviewedEntity: [],
    mMSource: [],
    review: [],
  };

  const createDelegate = (model: string) => ({
    findUnique: jest.fn(async ({ where }: any) => {
      return store[model]?.find((r) => r.id === where.id) ?? null;
    }),
    findMany: jest.fn(async ({ where }: any) => {
      let rows = store[model] ?? [];
      if (where) {
        if (where.mMSourceId) {
          rows = rows.filter((r) => r.mMSourceId === where.mMSourceId);
        }
        if (where.pieceVersionId) {
          rows = rows.filter((r) => r.pieceVersionId === where.pieceVersionId);
        }
        if (where.movementId) {
          rows = rows.filter((r) => r.movementId === where.movementId);
        }
        if (where.collectionId) {
          rows = rows.filter((r) => r.collectionId === where.collectionId);
        }
        if (where.id && where.id.in) {
          rows = rows.filter((r) => where.id.in.includes(r.id));
        }
      }
      return rows.map((r) => ({ ...r }));
    }),
    count: jest.fn(async ({ where }: any) => {
      let rows = store[model] ?? [];
      if (where) {
        if (where.pieceVersionId) {
          rows = rows.filter((r) => r.pieceVersionId === where.pieceVersionId);
        }
        if (where.mMSourceId && where.mMSourceId.not) {
          rows = rows.filter((r) => r.mMSourceId !== where.mMSourceId.not);
        }
      }
      return rows.length;
    }),
    create: jest.fn(async ({ data }: any) => {
      const row = { id: data.id || `gen-${Date.now()}`, ...data };
      store[model].push(row);
      return { ...row };
    }),
    createMany: jest.fn(async ({ data }: any) => {
      const arr = Array.isArray(data) ? data : [data];
      for (const item of arr) {
        store[model].push({ ...item });
      }
      return { count: arr.length };
    }),
    update: jest.fn(async ({ where, data }: any) => {
      const row = store[model].find((r) => r.id === where.id);
      if (row) {
        Object.assign(row, data);
        return { ...row };
      }
      return { id: where.id, ...data };
    }),
    upsert: jest.fn(async ({ where, update, create }: any) => {
      let row: any = null;
      if (where.id) {
        row = store[model].find((r) => r.id === where.id);
      } else if (where.entityType_entityId) {
        row = store[model].find(
          (r) =>
            r.entityType === where.entityType_entityId.entityType &&
            r.entityId === where.entityType_entityId.entityId,
        );
      }
      if (row) {
        Object.assign(row, update);
        return { ...row };
      } else {
        const newRow = { ...create };
        store[model].push(newRow);
        return { ...newRow };
      }
    }),
    deleteMany: jest.fn(async ({ where }: any) => {
      const initialCount = store[model].length;
      if (where?.id?.in) {
        store[model] = store[model].filter((r) => !where.id.in.includes(r.id));
      } else if (where?.mMSourceId && where?.pieceVersionId?.notIn) {
        store[model] = store[model].filter(
          (r) =>
            !(
              r.mMSourceId === where.mMSourceId &&
              !where.pieceVersionId.notIn.includes(r.pieceVersionId)
            ),
        );
      }
      return { count: initialCount - store[model].length };
    }),
  });

  const tx: any = {
    person: createDelegate("person"),
    organization: createDelegate("organization"),
    collection: createDelegate("collection"),
    piece: createDelegate("piece"),
    pieceVersion: createDelegate("pieceVersion"),
    movement: createDelegate("movement"),
    section: createDelegate("section"),
    tempoIndication: createDelegate("tempoIndication"),
    reference: createDelegate("reference"),
    contribution: createDelegate("contribution"),
    metronomeMark: createDelegate("metronomeMark"),
    mMSourcesOnPieceVersions: createDelegate("mMSourcesOnPieceVersions"),
    auditLog: createDelegate("auditLog"),
    reviewedEntity: createDelegate("reviewedEntity"),
    mMSource: createDelegate("mMSource"),
    review: createDelegate("review"),
  };

  return {
    tx,
    store,
    db: {
      ...tx,
      $transaction: async (cb: any) => cb(tx),
    },
  };
}

let mockPrismaInstance = createMockPrisma();

jest.mock("@/utils/server/db", () => ({
  get db() {
    return mockPrismaInstance.db;
  },
}));

import { POST as submitPost } from "@/app/api/review/[reviewId]/submit/route";

describe("POST /api/review/[reviewId]/submit", () => {
  const REVIEW_ID = "rev-100";
  const USER_ID = "reviewer-1";
  const MM_SOURCE_ID = "src-100";

  function buildValidState(): FeedFormState {
    return {
      formInfo: {
        currentStepRank: 5,
        introDone: true,
      },
      mMSourceDescription: {
        id: MM_SOURCE_ID,
        title: "Symphony No. 5 Edition",
        type: SOURCE_TYPE.EDITION,
        link: "https://imslp.org/wiki/Special:ImagefromIndex/12345",
        year: 1808,
        isYearEstimated: false,
        references: [
          {
            id: "ref-1",
            type: "OTHER" as any,
            reference: "Ref text 1",
          },
        ],
      },
      mMSourceContributions: [
        {
          id: "contrib-1",
          role: "EDITOR" as any,
          personId: "person-1",
        },
      ],
      persons: [
        {
          id: "person-1",
          firstName: "Ludwig van",
          lastName: "Beethoven",
          birthYear: 1770,
          deathYear: 1827,
        },
      ],
      organizations: [],
      collections: [],
      pieces: [
        {
          id: "piece-1",
          title: "Symphony No. 5 in C minor",
          composerId: "person-1",
        },
      ],
      pieceVersions: [
        {
          id: "pv-1",
          category: "FULL_SCORE" as any,
          pieceId: "piece-1",
          movements: [
            {
              id: "mov-1",
              rank: 1,
              key: "C_MINOR" as any,
              isVariation: false,
              sections: [
                {
                  id: "sec-1",
                  rank: 1,
                  metreNumerator: 2,
                  metreDenominator: 4,
                  tempoIndicationId: "tempo-1",
                  isCommonTime: false,
                  isCutTime: false,
                  comment: null,
                  commentForReview: null,
                  fastestStructuralNotesPerBar: 16,
                  fastestBelCantoNotesPerBar: null,
                  fastestStaccatoNotesPerBar: null,
                  fastestRepeatedNotesPerBar: null,
                  fastestOrnamentalNotesPerBar: null,
                },
              ],
            },
          ],
        },
      ],
      tempoIndications: [
        {
          id: "tempo-1",
          text: "Allegro con brio",
        },
      ],
      mMSourceOnPieceVersions: [
        {
          pieceVersionId: "pv-1",
          rank: 1,
        },
      ],
      metronomeMarks: [
        {
          id: "mm-1",
          pieceVersionId: "pv-1",
          sectionId: "sec-1",
          beatUnit: "HALF" as any,
          bpm: 108,
          noMM: false,
        },
      ],
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaInstance = createMockPrisma();

    // Populate initial DB state
    mockPrismaInstance.store.review.push({
      id: REVIEW_ID,
      creatorId: USER_ID,
      state: REVIEW_STATE.IN_REVIEW,
      mMSourceId: MM_SOURCE_ID,
    });
    mockPrismaInstance.store.mMSource.push({
      id: MM_SOURCE_ID,
      title: "Symphony No. 5 Edition",
      type: SOURCE_TYPE.EDITION,
      link: "https://imslp.org/wiki/Special:ImagefromIndex/12345",
      permalink: "https://imslp.org/wiki/Special:ImagefromIndex/12345",
      year: 1808,
      isYearEstimated: false,
      sectionCount: 1,
      reviewState: REVIEW_STATE.IN_REVIEW,
    });
    mockPrismaInstance.store.person.push({
      id: "person-1",
      firstName: "Ludwig van",
      lastName: "Beethoven",
      birthYear: 1770,
      deathYear: 1827,
    });
    mockPrismaInstance.store.piece.push({
      id: "piece-1",
      title: "Symphony No. 5 in C minor",
      composerId: "person-1",
    });
    mockPrismaInstance.store.pieceVersion.push({
      id: "pv-1",
      category: "FULL_SCORE",
      pieceId: "piece-1",
    });
    mockPrismaInstance.store.movement.push({
      id: "mov-1",
      pieceVersionId: "pv-1",
      rank: 1,
      key: "C_MINOR",
      isVariation: false,
    });
    mockPrismaInstance.store.section.push({
      id: "sec-1",
      movementId: "mov-1",
      rank: 1,
      metreNumerator: 2,
      metreDenominator: 4,
      tempoIndicationId: "tempo-1",
    });
    mockPrismaInstance.store.tempoIndication.push({
      id: "tempo-1",
      text: "Allegro con brio",
    });
    mockPrismaInstance.store.reference.push({
      id: "ref-1",
      mMSourceId: MM_SOURCE_ID,
      type: "OTHER",
      reference: "Ref text 1",
    });
    mockPrismaInstance.store.contribution.push({
      id: "contrib-1",
      mMSourceId: MM_SOURCE_ID,
      role: "EDITOR",
      personId: "person-1",
    });
    mockPrismaInstance.store.metronomeMark.push({
      id: "mm-1",
      mMSourceId: MM_SOURCE_ID,
      sectionId: "sec-1",
      beatUnit: "HALF",
      bpm: 108,
    });
    mockPrismaInstance.store.mMSourcesOnPieceVersions.push({
      id: "join-1",
      mMSourceId: MM_SOURCE_ID,
      pieceVersionId: "pv-1",
      rank: 1,
    });

    mockGetServerSession.mockResolvedValue({
      user: { id: USER_ID, role: "REVIEWER" },
    });

    const baselineState = buildValidState();
    mockGetReviewBaseline.mockResolvedValue({
      review: {
        id: REVIEW_ID,
        creatorId: USER_ID,
        state: REVIEW_STATE.IN_REVIEW,
        mMSourceId: MM_SOURCE_ID,
      },
      mMSource: {
        id: MM_SOURCE_ID,
        title: "Symphony No. 5 Edition",
      },
      baseline: baselineState,
      globallyReviewed: {
        personIds: [],
        organizationIds: [],
        collectionIds: [],
        pieceIds: [],
        pieceVersionIds: [],
      },
    });

    mockExtendBaselineByExistence.mockImplementation(
      async (baseline: any) => baseline,
    );
  });

  describe("Access control & validation guards", () => {
    it("rejects 401 when session is missing", async () => {
      mockGetServerSession.mockResolvedValue(null);
      const req: any = {
        json: async () => ({ feedFormState: buildValidState() }),
      };
      const res = await submitPost(req, {
        params: Promise.resolve({ reviewId: REVIEW_ID }),
      });
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toMatch(/Unauthorized/);
    });

    it("rejects 403 when user role is not REVIEWER or ADMIN", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: USER_ID, role: "USER" },
      });
      const req: any = {
        json: async () => ({ feedFormState: buildValidState() }),
      };
      const res = await submitPost(req, {
        params: Promise.resolve({ reviewId: REVIEW_ID }),
      });
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toMatch(/Forbidden/);
    });

    it("rejects 404 when review is not found in DB", async () => {
      mockPrismaInstance.store.review = [];
      const req: any = {
        json: async () => ({ feedFormState: buildValidState() }),
      };
      const res = await submitPost(req, {
        params: Promise.resolve({ reviewId: REVIEW_ID }),
      });
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toMatch(/Review not found/);
    });

    it("rejects 403 when user is not the review owner", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "other-user", role: "REVIEWER" },
      });
      const req: any = {
        json: async () => ({ feedFormState: buildValidState() }),
      };
      const res = await submitPost(req, {
        params: Promise.resolve({ reviewId: REVIEW_ID }),
      });
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toMatch(/not the owner/);
    });

    it("rejects 400 when review is not IN_REVIEW", async () => {
      mockPrismaInstance.store.review[0].state = REVIEW_STATE.APPROVED;
      const req: any = {
        json: async () => ({ feedFormState: buildValidState() }),
      };
      const res = await submitPost(req, {
        params: Promise.resolve({ reviewId: REVIEW_ID }),
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/not IN_REVIEW/);
    });

    it("rejects 400 when mandatory fields are missing", async () => {
      const state = buildValidState();
      delete (state as any).metronomeMarks;
      const req: any = { json: async () => ({ feedFormState: state }) };
      const res = await submitPost(req, {
        params: Promise.resolve({ reviewId: REVIEW_ID }),
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/Missing mandatory fields/);
    });
  });

  describe("Persistence & Mutations", () => {
    it("performs no mutation and emits no AuditLog when state is unchanged", async () => {
      const state = buildValidState();
      const req: any = {
        json: async () => ({
          feedFormState: state,
          overallComment: "Everything is perfect",
        }),
      };

      const res = await submitPost(req, {
        params: Promise.resolve({ reviewId: REVIEW_ID }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.summary.changedCount).toBe(0);
      expect(data.summary.auditEntriesCount).toBe(0);

      // Verify no create was performed on person/piece/etc.
      expect(mockPrismaInstance.tx.person.create).not.toHaveBeenCalled();
      expect(mockPrismaInstance.tx.person.update).not.toHaveBeenCalled();
      expect(mockPrismaInstance.tx.piece.create).not.toHaveBeenCalled();

      // Review and MMSource should be approved
      expect(mockPrismaInstance.store.review[0].state).toBe(
        REVIEW_STATE.APPROVED,
      );
      expect(mockPrismaInstance.store.review[0].overallComment).toBe(
        "Everything is perfect",
      );
      expect(mockPrismaInstance.store.mMSource[0].reviewState).toBe(
        REVIEW_STATE.APPROVED,
      );

      // Verify emails sent
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({ type: "Review SUBMIT data" }),
      );
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({ type: "Review submit transaction debug" }),
      );
    });

    it("updates existing entity (UPDATE) and creates new entity (CREATE)", async () => {
      const state = buildValidState();

      // Modify existing person
      state.persons![0].birthYear = 1771;

      // Add a new organization
      state.organizations = [
        {
          id: "org-new-1",
          name: "Breitkopf & Härtel",
        },
      ];

      // Add a contribution for this organization
      state.mMSourceContributions!.push({
        id: "contrib-2",
        role: "PUBLISHER" as any,
        organizationId: "org-new-1",
      });

      const req: any = { json: async () => ({ feedFormState: state }) };
      const res = await submitPost(req, {
        params: Promise.resolve({ reviewId: REVIEW_ID }),
      });
      expect(res.status).toBe(200);

      // Person was updated
      expect(mockPrismaInstance.tx.person.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "person-1" },
          data: expect.objectContaining({ birthYear: 1771 }),
        }),
      );
      expect(mockPrismaInstance.tx.person.create).not.toHaveBeenCalled();

      // Organization was created
      expect(mockPrismaInstance.tx.organization.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            id: "org-new-1",
            name: "Breitkopf & Härtel",
          }),
        }),
      );

      // Audit logs created for PERSON update and ORGANIZATION create
      const auditLogs = mockPrismaInstance.store.auditLog;
      expect(auditLogs.length).toBeGreaterThan(0);
      expect(
        auditLogs.some(
          (a) =>
            a.entityId === "person-1" &&
            a.entityType === AUDIT_ENTITY_TYPE.PERSON &&
            a.operation === OPERATION.UPDATE,
        ),
      ).toBe(true);
      expect(
        auditLogs.some(
          (a) =>
            a.entityId === "org-new-1" &&
            a.entityType === AUDIT_ENTITY_TYPE.ORGANIZATION &&
            a.operation === OPERATION.CREATE,
        ),
      ).toBe(true);
    });

    it("deletes metronome mark when toggled to noMM", async () => {
      const state = buildValidState();
      // Switch mm-1 to noMM
      (state.metronomeMarks![0] as any).noMM = true;

      const req: any = { json: async () => ({ feedFormState: state }) };
      const res = await submitPost(req, {
        params: Promise.resolve({ reviewId: REVIEW_ID }),
      });
      expect(res.status).toBe(200);

      // MetronomeMark deleteMany called for mm-1
      expect(
        mockPrismaInstance.tx.metronomeMark.deleteMany,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: { in: ["mm-1"] } },
        }),
      );

      // Audit log contains DELETE for mm-1
      const auditLogs = mockPrismaInstance.store.auditLog;
      expect(
        auditLogs.some(
          (a) =>
            a.entityId === "mm-1" &&
            a.entityType === AUDIT_ENTITY_TYPE.METRONOME_MARK &&
            a.operation === OPERATION.DELETE,
        ),
      ).toBe(true);
    });

    it("handles rank swaps between movements without collisions", async () => {
      const state = buildValidState();

      // Add a 2nd movement to baseline & state
      const mov2 = {
        id: "mov-2",
        rank: 2,
        key: "C_MAJOR" as any,
        isVariation: false,
        sections: [
          {
            id: "sec-2",
            rank: 1,
            metreNumerator: 3,
            metreDenominator: 8,
            tempoIndicationId: "tempo-1",
            isCommonTime: false,
            isCutTime: false,
            comment: null,
            commentForReview: null,
            fastestStructuralNotesPerBar: 16,
            fastestBelCantoNotesPerBar: null,
            fastestStaccatoNotesPerBar: null,
            fastestRepeatedNotesPerBar: null,
            fastestOrnamentalNotesPerBar: null,
          },
        ],
      };
      mockPrismaInstance.store.movement.push({
        id: "mov-2",
        pieceVersionId: "pv-1",
        rank: 2,
        key: "C_MAJOR",
        isVariation: false,
      });
      mockPrismaInstance.store.section.push({
        id: "sec-2",
        movementId: "mov-2",
        rank: 1,
        metreNumerator: 3,
        metreDenominator: 8,
        tempoIndicationId: "tempo-1",
      });

      // In baseline: mov-1 has rank 1, mov-2 has rank 2
      const baseline = buildValidState();
      baseline.pieceVersions![0].movements!.push(mov2);
      mockGetReviewBaseline.mockResolvedValue({
        review: {
          id: REVIEW_ID,
          creatorId: USER_ID,
          state: REVIEW_STATE.IN_REVIEW,
          mMSourceId: MM_SOURCE_ID,
        },
        mMSource: { id: MM_SOURCE_ID, title: "Symphony No. 5 Edition" },
        baseline,
        globallyReviewed: {
          personIds: [],
          organizationIds: [],
          collectionIds: [],
          pieceIds: [],
          pieceVersionIds: [],
        },
      });

      // In state: swap ranks 1 <-> 2
      state.pieceVersions![0].movements![0].rank = 2;
      state.pieceVersions![0].movements!.push({
        ...mov2,
        rank: 1,
      });

      const req: any = { json: async () => ({ feedFormState: state }) };
      const res = await submitPost(req, {
        params: Promise.resolve({ reviewId: REVIEW_ID }),
      });
      expect(res.status).toBe(200);

      // Verify movement updates happened (2-phase updates)
      expect(mockPrismaInstance.tx.movement.update).toHaveBeenCalled();
    });

    it("performs fork when a pieceVersion is modified and shared with another source", async () => {
      // Simulate that pv-1 is also shared with another source "src-other"
      mockPrismaInstance.store.mMSourcesOnPieceVersions.push({
        id: "join-other",
        mMSourceId: "src-other",
        pieceVersionId: "pv-1",
        rank: 1,
      });

      const state = buildValidState();
      // Modify a section in pv-1 (e.g. metreNumerator 2 -> 3)
      state.pieceVersions![0].movements![0].sections![0].metreNumerator = 3;

      const req: any = { json: async () => ({ feedFormState: state }) };
      const res = await submitPost(req, {
        params: Promise.resolve({ reviewId: REVIEW_ID }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.summary.forkedCount).toBe(1);

      // Verify a new PieceVersion was created
      expect(mockPrismaInstance.tx.pieceVersion.create).toHaveBeenCalled();
      const createdPvCall =
        mockPrismaInstance.tx.pieceVersion.create.mock.calls[0][0];
      const newPvId = createdPvCall.data.id;
      expect(newPvId).not.toBe("pv-1");

      // Verify original pieceVersion and its subtree were NOT deleted
      expect(
        mockPrismaInstance.tx.movement.deleteMany,
      ).not.toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: { in: expect.arrayContaining(["mov-1"]) } },
        }),
      );
      expect(mockPrismaInstance.tx.section.deleteMany).not.toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: { in: expect.arrayContaining(["sec-1"]) } },
        }),
      );

      // Audit logs: contain CREATE for copy, UPDATE for MM_SOURCE, NO delete for original pv-1
      const auditLogs = mockPrismaInstance.store.auditLog;
      expect(
        auditLogs.some(
          (a) => a.entityId === "pv-1" && a.operation === OPERATION.DELETE,
        ),
      ).toBe(false);
      expect(
        auditLogs.some(
          (a) =>
            a.entityId === newPvId &&
            a.entityType === AUDIT_ENTITY_TYPE.PIECE_VERSION &&
            a.operation === OPERATION.CREATE,
        ),
      ).toBe(true);
    });

    it("recalculates sectionCount and permalink on MMSource", async () => {
      const state = buildValidState();
      state.mMSourceDescription!.link =
        "https://imslp.org/wiki/Special:ImagefromIndex/99999";

      const req: any = { json: async () => ({ feedFormState: state }) };
      const res = await submitPost(req, {
        params: Promise.resolve({ reviewId: REVIEW_ID }),
      });
      expect(res.status).toBe(200);

      // Verify mMSource.update called with derived sectionCount & permalink
      expect(mockPrismaInstance.tx.mMSource.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: MM_SOURCE_ID },
          data: expect.objectContaining({
            sectionCount: 1,
            permalink: "https://imslp.org/wiki/Special:ImagefromIndex/99999",
          }),
        }),
      );
    });

    it("handles error during transaction by sending ERROR email and returning 500 without corrupting state", async () => {
      const state = buildValidState();
      // Cause an error during transaction
      mockPrismaInstance.tx.mMSource.update.mockRejectedValue(
        new Error("Database connection lost"),
      );

      const req: any = { json: async () => ({ feedFormState: state }) };
      const res = await submitPost(req, {
        params: Promise.resolve({ reviewId: REVIEW_ID }),
      });
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).toMatch(/Database connection lost/);

      // Verify ERROR email was sent
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "Review SUBMIT transaction ERROR",
          content: expect.objectContaining({
            reviewId: REVIEW_ID,
            error: expect.objectContaining({
              message: "Database connection lost",
            }),
          }),
        }),
      );
    });

    it("returns 409 when unique constraint violation occurs", async () => {
      const state = buildValidState();
      mockPrismaInstance.tx.mMSource.update.mockRejectedValue(
        new Error(
          "Unique constraint failed on the fields: (`collectionId`, `collectionRank`)",
        ),
      );

      const req: any = { json: async () => ({ feedFormState: state }) };
      const res = await submitPost(req, {
        params: Promise.resolve({ reviewId: REVIEW_ID }),
      });
      expect(res.status).toBe(409);
      const data = await res.json();
      expect(data.error).toMatch(/Conflict: A unique constraint violation/);
    });
  });
});
