jest.mock("next/server", () => ({
  NextResponse: {
    json: (obj: any, init?: any) => ({
      ok: !init || !init.status || init.status < 400,
      status: init?.status ?? 200,
      json: async () => obj,
    }),
  },
}));

import { FeedFormState } from "@/types/feedFormTypes";
import { SOURCE_TYPE } from "@/prisma/client";

const mockIsReqAuthorized = jest.fn();
jest.mock("@/utils/server/isReqAuthorized", () => ({
  __esModule: true,
  default: (...args: any[]) => mockIsReqAuthorized(...args),
}));

const mockGetDecodedTokenFromReq = jest.fn();
jest.mock("@/utils/server/getDecodedTokenFromReq", () => ({
  __esModule: true,
  default: (...args: any[]) => mockGetDecodedTokenFromReq(...args),
}));

const mockGetAccessTokenFromReq = jest.fn();
jest.mock("@/utils/server/getAccessTokenFromReq", () => ({
  __esModule: true,
  default: (...args: any[]) => mockGetAccessTokenFromReq(...args),
}));

const mockFetchAPI = jest.fn();
jest.mock("@/utils/fetchAPI", () => ({
  fetchAPI: (...args: any[]) => mockFetchAPI(...args),
}));

const SOURCE_ID = "source-new";
const mockTx = {
  person: { createMany: jest.fn(async () => ({ count: 1 })) },
  organization: { createMany: jest.fn(async () => ({ count: 0 })) },
  collection: { createMany: jest.fn(async () => ({ count: 0 })) },
  mMSource: {
    create: jest.fn(async (_args: any) => ({ id: SOURCE_ID })),
  },
  metronomeMark: { createMany: jest.fn(async () => ({ count: 1 })) },
};

let mockPrismaInstance: any;
jest.mock("@/utils/server/db", () => ({
  get db() {
    return mockPrismaInstance;
  },
}));

import { POST } from "@/app/api/feedForm/route";

describe("POST /api/feedForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaInstance = {
      tempoIndication: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ id: "tempo-existing", text: "Élégante" }]),
      },
      mMSource: {
        findUnique: jest.fn().mockResolvedValue({
          id: SOURCE_ID,
          references: [],
          contributions: [],
          pieceVersions: [],
          metronomeMarks: [],
        }),
      },
      $transaction: jest.fn(async (callback: any) => callback(mockTx)),
    };
  });

  it("connects new sections to an existing tempo indication with equivalent text", async () => {
    mockIsReqAuthorized.mockReturnValue(true);
    mockGetDecodedTokenFromReq.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
    });
    mockGetAccessTokenFromReq.mockReturnValue("access-token");
    mockFetchAPI.mockResolvedValue({ id: "email-1" });

    const state: FeedFormState = {
      formInfo: { currentStepRank: 3 },
      mMSourceDescription: {
        id: SOURCE_ID,
        title: "Edition",
        type: SOURCE_TYPE.EDITION,
        link: "https://example.com/source",
        year: 1800,
        isYearEstimated: false,
        references: [],
      },
      mMSourceContributions: [
        { id: "contribution-1", role: "EDITOR" as any, personId: "person-1" },
      ],
      mMSourceOnPieceVersions: [{ pieceVersionId: "piece-version-1", rank: 1 }],
      organizations: [],
      collections: [],
      persons: [
        {
          id: "person-1",
          firstName: "Composer",
          lastName: "One",
          birthYear: 1750,
          deathYear: null,
          isNew: true,
        },
      ],
      pieces: [
        {
          id: "piece-1",
          title: "Piece",
          composerId: "person-1",
          isNew: true,
        },
      ],
      pieceVersions: [
        {
          id: "piece-version-1",
          pieceId: "piece-1",
          category: "VOCAL" as any,
          isNew: true,
          movements: [
            {
              id: "movement-1",
              rank: 1,
              key: "C_MAJOR" as any,
              sections: [
                {
                  id: "section-1",
                  rank: 1,
                  metreNumerator: 4,
                  metreDenominator: 4,
                  isCommonTime: false,
                  isCutTime: false,
                  fastestStructuralNotesPerBar: 16,
                  tempoIndicationId: "tempo-new",
                },
              ],
            },
          ],
        },
      ],
      tempoIndications: [{ id: "tempo-new", text: "ÉLÉGANTE", isNew: true }],
      metronomeMarks: [
        {
          id: "mark-1",
          pieceVersionId: "piece-version-1",
          sectionId: "section-1",
          beatUnit: "QUARTER" as any,
          bpm: 120,
          noMM: false,
        },
      ],
    };

    const response = await POST({ json: async () => state } as any);

    expect(response.status).toBe(200);
    const mMSourceInput = mockTx.mMSource.create.mock.calls[0][0].data;
    const sectionInput =
      mMSourceInput.pieceVersions.create[0].pieceVersion.create.movements
        .create[0].sections.create[0];
    expect(sectionInput.tempoIndication).toEqual({
      connect: { id: "tempo-existing" },
    });
    expect(sectionInput.tempoIndication.connectOrCreate).toBeUndefined();
  });
});
