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
  REVIEW_STATE,
  SOURCE_TYPE,
  CONTRIBUTION_ROLE,
  NOTE_VALUE,
  PIECE_CATEGORY,
  KEY,
} from "@/prisma/client";
import { FeedFormState } from "@/types/feedFormTypes";

const mockGetServerSession = jest.fn();
jest.mock("next-auth", () => ({
  getServerSession: (...args: any[]) => mockGetServerSession(...args),
}));

const mockGetSourceFeedFormBaseline = jest.fn();
const mockExtendBaselineByExistence = jest.fn();

jest.mock("@/utils/server/getSourceFeedFormBaseline", () => ({
  getSourceFeedFormBaseline: (...args: any[]) =>
    mockGetSourceFeedFormBaseline(...args),
}));

jest.mock("@/utils/server/extendBaselineByExistence", () => ({
  extendBaselineByExistence: (...args: any[]) =>
    mockExtendBaselineByExistence(...args),
}));

// In-memory Prisma mock store
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
    mMSource: [],
    review: [],
  };

  const createDelegate = (model: string) => ({
    findUnique: jest.fn(async ({ where }: any) => {
      return store[model]?.find((r) => r.id === where.id) ?? null;
    }),
    findFirst: jest.fn(async ({ where }: any) => {
      return (
        store[model]?.find((r) => {
          for (const key of Object.keys(where)) {
            if (r[key] !== where[key]) return false;
          }
          return true;
        }) ?? null
      );
    }),
    findMany: jest.fn(async ({ where }: any) => {
      let rows = store[model] ?? [];
      if (where) {
        if (where.mMSourceId) {
          rows = rows.filter((r) => r.mMSourceId === where.mMSourceId);
        }
        if (where.pieceVersionId) {
          if (where.pieceVersionId.notIn) {
            rows = rows.filter(
              (r) => !where.pieceVersionId.notIn.includes(r.pieceVersionId),
            );
          } else {
            rows = rows.filter(
              (r) => r.pieceVersionId === where.pieceVersionId,
            );
          }
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
    update: jest.fn(async ({ where, data }: any) => {
      const idx = store[model]?.findIndex((r) => r.id === where.id);
      if (idx >= 0) {
        store[model][idx] = { ...store[model][idx], ...data };
        return { ...store[model][idx] };
      }
      return null;
    }),
    deleteMany: jest.fn(async ({ where }: any) => {
      let before = store[model]?.length ?? 0;
      if (where) {
        if (where.id?.in) {
          store[model] = store[model].filter(
            (r) => !where.id.in.includes(r.id),
          );
        }
        if (where.mMSourceId && where.pieceVersionId?.notIn) {
          store[model] = store[model].filter(
            (r) =>
              !(
                r.mMSourceId === where.mMSourceId &&
                !where.pieceVersionId.notIn.includes(r.pieceVersionId)
              ),
          );
        }
      }
      return { count: before - (store[model]?.length ?? 0) };
    }),
  });

  const prismaMock: any = {
    _store: store,
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
    mMSource: createDelegate("mMSource"),
    review: createDelegate("review"),
    $transaction: jest.fn(async (callback: any) => {
      return callback(prismaMock);
    }),
  };

  return prismaMock;
}

let mockPrisma: any;
jest.mock("@/utils/server/db", () => ({
  get db() {
    return mockPrisma;
  },
}));

import { POST } from "@/app/api/source/[sourceId]/edit/route";

describe("POST /api/source/[sourceId]/edit", () => {
  const AUTHOR_ID = "user-author-1";
  const OTHER_USER_ID = "user-other-2";
  const SOURCE_ID = "source-test-1";

  const validBaseline: FeedFormState = {
    mMSourceDescription: {
      id: SOURCE_ID,
      title: "Original Title",
      type: SOURCE_TYPE.MANUSCRIPT,
      link: "https://imslp.org/wiki/Original",
      permalink: "https://imslp.org/wiki/Original",
      year: 1820,
      isYearEstimated: false,
      comment: "Original comment",
      references: [],
    },
    mMSourceContributions: [
      {
        id: "contrib-1",
        role: CONTRIBUTION_ROLE.MM_PROVIDER,
        personId: "person-1",
      },
    ],
    mMSourceOnPieceVersions: [
      {
        pieceVersionId: "pv-1",
        rank: 0,
      },
    ],
    organizations: [],
    collections: [],
    persons: [
      {
        id: "person-1",
        firstName: "Ludwig van",
        lastName: "Beethoven",
        birthYear: 1770,
        deathYear: 1827,
      },
    ],
    pieces: [
      {
        id: "piece-1",
        title: "Symphony No. 5",
        composerId: "person-1",
      },
    ],
    pieceVersions: [
      {
        id: "pv-1",
        pieceId: "piece-1",
        category: PIECE_CATEGORY.CHAMBER_INSTRUMENTAL,
        movements: [
          {
            id: "mov-1",
            key: KEY.D_MAJOR,
            rank: 0,
            sections: [
              {
                id: "sec-1",
                rank: 0,
                tempoIndicationId: "ti-1",
                metreNumerator: 2,
                metreDenominator: 2,
                fastestStructuralNotesPerBar: 2,
              },
            ],
          },
        ],
      },
    ],
    tempoIndications: [
      {
        id: "ti-1",
        text: "Allegro",
      },
    ],
    metronomeMarks: [
      {
        id: "mm-1",
        sectionId: "sec-1",
        pieceVersionId: "pv-1",
        beatUnit: NOTE_VALUE.HALF,
        bpm: 108,
        noMM: false,
      },
    ],
  };

  const validSubmittedState: FeedFormState = {
    ...validBaseline,
    formInfo: {
      currentStepRank: 4,
      introDone: true,
      allSourceOnPieceVersionsDone: true,
    },
    mMSourceDescription: {
      ...validBaseline.mMSourceDescription!,
      title: "Updated Title by Author",
    },
    metronomeMarks: [
      {
        id: "mm-1",
        sectionId: "sec-1",
        pieceVersionId: "pv-1",
        beatUnit: NOTE_VALUE.HALF,
        bpm: 112,
        noMM: false,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = createMockPrisma();

    // Populate mock store with the target source
    mockPrisma._store.mMSource.push({
      id: SOURCE_ID,
      creatorId: AUTHOR_ID,
      reviewState: REVIEW_STATE.PENDING,
      title: "Original Title",
      type: SOURCE_TYPE.MANUSCRIPT,
      link: "https://imslp.org/wiki/Original",
      permalink: "https://imslp.org/wiki/Original",
      year: 1820,
      isYearEstimated: false,
      comment: "Original comment",
      sectionCount: 1,
    });

    mockPrisma._store.mMSourcesOnPieceVersions.push({
      id: "join-1",
      mMSourceId: SOURCE_ID,
      pieceVersionId: "pv-1",
      rank: 0,
    });

    mockPrisma._store.person.push({
      id: "person-1",
      firstName: "Ludwig van",
      lastName: "Beethoven",
      birthYear: 1770,
      deathYear: 1827,
    });

    mockPrisma._store.piece.push({
      id: "piece-1",
      title: "Symphony No. 5",
      composerId: "person-1",
    });

    mockPrisma._store.pieceVersion.push({
      id: "pv-1",
      pieceId: "piece-1",
      category: PIECE_CATEGORY.KEYBOARD,
    });

    mockPrisma._store.movement.push({
      id: "mov-1",
      pieceVersionId: "pv-1",
      rank: 0,
    });

    mockPrisma._store.section.push({
      id: "sec-1",
      movementId: "mov-1",
      rank: 0,
      tempoIndicationId: "ti-1",
    });

    mockPrisma._store.metronomeMark.push({
      id: "mm-1",
      mMSourceId: SOURCE_ID,
      sectionId: "sec-1",
      beatUnit: NOTE_VALUE.HALF,
      bpm: 108,
    });

    mockGetSourceFeedFormBaseline.mockResolvedValue({
      baseline: validBaseline,
      mMSource: mockPrisma._store.mMSource[0],
    });

    mockExtendBaselineByExistence.mockImplementation(async (b: any) => b);
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req: any = {
      json: async () => ({ feedFormState: validSubmittedState }),
    };

    const res = await POST(req, {
      params: Promise.resolve({ sourceId: SOURCE_ID }),
    });
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toContain("Unauthorized");
  });

  it("returns 400 when body or mandatory fields are missing", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: AUTHOR_ID, role: "USER" },
    });

    const req: any = {
      json: async () => ({ feedFormState: {} }),
    };

    const res = await POST(req, {
      params: Promise.resolve({ sourceId: SOURCE_ID }),
    });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Missing mandatory fields");
  });

  it("returns 404 when MM Source does not exist", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: AUTHOR_ID, role: "USER" },
    });

    const req: any = {
      json: async () => ({ feedFormState: validSubmittedState }),
    };

    const res = await POST(req, {
      params: Promise.resolve({ sourceId: "non-existent" }),
    });
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toContain("MM Source not found");
  });

  it("returns 403 Forbidden when user is not the creator of the source", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: OTHER_USER_ID, role: "USER" },
    });

    const req: any = {
      json: async () => ({ feedFormState: validSubmittedState }),
    };

    const res = await POST(req, {
      params: Promise.resolve({ sourceId: SOURCE_ID }),
    });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain("Forbidden");
  });

  it("returns 409 Conflict when source is not PENDING (e.g. APPROVED)", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: AUTHOR_ID, role: "USER" },
    });
    mockPrisma._store.mMSource[0].reviewState = REVIEW_STATE.APPROVED;

    const req: any = {
      json: async () => ({ feedFormState: validSubmittedState }),
    };

    const res = await POST(req, {
      params: Promise.resolve({ sourceId: SOURCE_ID }),
    });
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toContain("A review has started on this MM Source");
  });

  it("returns 409 Conflict when an active review exists on the source", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: AUTHOR_ID, role: "USER" },
    });
    mockPrisma._store.review.push({
      id: "rev-active",
      mMSourceId: SOURCE_ID,
      state: REVIEW_STATE.IN_REVIEW,
    });

    const req: any = {
      json: async () => ({ feedFormState: validSubmittedState }),
    };

    const res = await POST(req, {
      params: Promise.resolve({ sourceId: SOURCE_ID }),
    });
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toContain("A review has started on this MM Source");
  });

  it("returns 409 Conflict if a review starts concurrently during the transaction", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: AUTHOR_ID, role: "USER" },
    });

    // Simulate review created concurrently after pre-check
    mockPrisma.$transaction = jest.fn(async (cb: any) => {
      mockPrisma._store.review.push({
        id: "rev-concurrent",
        mMSourceId: SOURCE_ID,
        state: REVIEW_STATE.IN_REVIEW,
      });
      return cb(mockPrisma);
    });

    const req: any = {
      json: async () => ({ feedFormState: validSubmittedState }),
    };

    const res = await POST(req, {
      params: Promise.resolve({ sourceId: SOURCE_ID }),
    });
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toContain("A review has started on this MM Source");
  });

  it("successfully updates source, keeping reviewState PENDING and returns 200", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: AUTHOR_ID, role: "USER" },
    });

    const req: any = {
      json: async () => ({ feedFormState: validSubmittedState }),
    };

    const res = await POST(req, {
      params: Promise.resolve({ sourceId: SOURCE_ID }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ success: true, mMSourceId: SOURCE_ID });

    // Verify source in db has updated title and retained PENDING reviewState
    const updatedSource = mockPrisma._store.mMSource.find(
      (s: any) => s.id === SOURCE_ID,
    );
    expect(updatedSource.title).toBe("Updated Title by Author");
    expect(updatedSource.reviewState).toBe(REVIEW_STATE.PENDING);

    // Verify updated metronome mark bpm
    const updatedMM = mockPrisma._store.metronomeMark.find(
      (m: any) => m.id === "mm-1",
    );
    expect(updatedMM.bpm).toBe(112);
  });
});
