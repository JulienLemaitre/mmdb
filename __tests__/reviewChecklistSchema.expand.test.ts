import {
  buildFieldPath,
  buildSourceJoinRankPath,
} from "@/features/review/reviewChecklistSchema";
import { buildMockOverview } from "@/features/review/reviewMock";
import { expandRequiredChecklistItems } from "@/features/review/utils/expandRequiredChecklistItems";

describe("ReviewChecklistSchema helpers", () => {
  it("buildFieldPath follows convention for source and others", () => {
    expect(buildFieldPath("MM_SOURCE", null, "title")).toBe("source.title");
    expect(buildFieldPath("PIECE", "p-1", "title")).toBe("piece[p-1].title");
    expect(buildFieldPath("SECTION", "s-1", "metreNumerator")).toBe(
      "section[s-1].metreNumerator",
    );
  });

  it("buildSourceJoinRankPath uses joinId in bracket", () => {
    expect(buildSourceJoinRankPath("join-123")).toBe(
      "source.pieceVersions[join-123].rank",
    );
  });

  it("expandRequiredChecklistItems includes MM_SOURCE fields and per-join rank items", () => {
    const { graph } = buildMockOverview("r-1");
    const items = expandRequiredChecklistItems(graph);
    const paths = items.map((i) => i.fieldPath);
    // Source title, type, link, permalink, year, comment, and per-join Rank in source
    expect(paths).toEqual(
      expect.arrayContaining([
        "source.title",
        "source.type",
        "source.link",
        "source.permalink",
        "source.year",
        "source.isYearEstimated",
        "source.comment",
      ]),
    );
    // Expect as many per-join rank checks as there are sourceOnPieceVersions rows
    const perJoin = items.filter((i) =>
      i.fieldPath.startsWith("sourceOnPieceVersion"),
    );
    expect(perJoin).toHaveLength(graph.sourceOnPieceVersions?.length ?? 0);
  });

  it("respects globallyReviewed filtering for PERSON and does not include their fields", () => {
    const { graph, globallyReviewed } = buildMockOverview("r-1");
    const items = expandRequiredChecklistItems(graph, {
      globallyReviewed: {
        personIds: new Set(globallyReviewed.personIds),
        organizationIds: new Set(),
        collectionIds: new Set(),
        pieceIds: new Set(),
      },
    });
    expect(
      items.find((i) => i.fieldPath.startsWith("person[")),
    ).toBeUndefined();
  });
});
