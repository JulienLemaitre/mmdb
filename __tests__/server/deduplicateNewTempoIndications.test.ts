const mockFindMany = jest.fn();

jest.mock("@/utils/server/db", () => ({
  get db() {
    return {
      tempoIndication: {
        findMany: (...args: any[]) => mockFindMany(...args),
      },
    };
  },
}));

import { FeedFormState } from "@/types/feedFormTypes";
import { deduplicateNewTempoIndications } from "@/utils/server/deduplicateNewTempoIndications";

describe("deduplicateNewTempoIndications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("reuses database IDs for new values that differ by case or accents", async () => {
    mockFindMany.mockResolvedValue([
      { id: "tempo-ete", text: "Ete" },
      { id: "tempo-allegro", text: "Allegro" },
    ]);

    const state: FeedFormState = {
      tempoIndications: [
        { id: "new-ete", text: "ÉTÉ", isNew: true },
        { id: "new-allegro", text: "ALLEGRO", isNew: true },
        { id: "new-vivace", text: "Vivace", isNew: true },
      ],
      pieceVersions: [
        {
          id: "piece-version-1",
          pieceId: "piece-1",
          category: "VOCAL" as any,
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
                  fastestStructuralNotesPerBar: 16,
                  tempoIndicationId: "new-ete",
                },
                {
                  id: "section-2",
                  rank: 2,
                  metreNumerator: 3,
                  metreDenominator: 4,
                  fastestStructuralNotesPerBar: 12,
                  tempoIndicationId: "new-allegro",
                },
                {
                  id: "section-3",
                  rank: 3,
                  metreNumerator: 2,
                  metreDenominator: 4,
                  fastestStructuralNotesPerBar: 8,
                  tempoIndicationId: "new-vivace",
                },
              ],
            },
          ],
        },
      ],
    };

    const result = await deduplicateNewTempoIndications(state);

    expect(result.tempoIndications).toEqual([
      { id: "tempo-ete", text: "Ete" },
      { id: "tempo-allegro", text: "Allegro" },
      { id: "new-vivace", text: "Vivace", isNew: true },
    ]);
    expect(
      result.pieceVersions?.[0].movements[0].sections.map(
        (section) => section.tempoIndicationId,
      ),
    ).toEqual(["tempo-ete", "tempo-allegro", "new-vivace"]);
    expect(mockFindMany).toHaveBeenCalledWith({
      select: { id: true, text: true },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
  });

  it("does not query the database when the state has no new tempo indications", async () => {
    const state: FeedFormState = {
      tempoIndications: [{ id: "tempo-1", text: "Allegro" }],
    };

    await expect(deduplicateNewTempoIndications(state)).resolves.toBe(state);
    expect(mockFindMany).not.toHaveBeenCalled();
  });
});
