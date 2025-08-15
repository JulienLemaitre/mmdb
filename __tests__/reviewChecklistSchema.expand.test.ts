import { REVIEW_CHECKLIST_SCHEMA, buildFieldPath, buildSourceJoinRankPath, expandRequiredChecklistItems } from "@/utils/ReviewChecklistSchema";
import { buildMockOverview } from "@/utils/reviewMock";

describe("ReviewChecklistSchema helpers", () => {
  it("buildFieldPath follows convention for source and others", () => {
    expect(buildFieldPath("MM_SOURCE", null, "title")).toBe("source.title");
    expect(buildFieldPath("PIECE", "p-1", "title")).toBe("piece[p-1].title");
    expect(buildFieldPath("SECTION", "s-1", "metreNumerator")).toBe("section[s-1].metreNumerator");
  });

  it("buildSourceJoinRankPath uses joinId in bracket", () => {
    expect(buildSourceJoinRankPath("join-123")).toBe("source.pieceVersions[join-123].rank");
  });

  it("expandRequiredChecklistItems includes MM_SOURCE fields and per-join rank items", () => {
    const { graph } = buildMockOverview("r-1");
    const items = expandRequiredChecklistItems(graph);
    const labels = items.map((i) => i.label);
    // Source title, type, link, permalink, year, comment, contents.order logical, and per-join Rank in source
    expect(labels).toEqual(expect.arrayContaining([
      "Source title",
      "Source type",
      "Link to online score",
      "Permalink",
      "Publication year",
      "Source comment",
      "Ordering of pieces and versions",
      "Rank in source",
    ]));
    // Expect as many per-join rank checks as there are sourceContents rows
    const perJoin = items.filter((i) => i.label === "Rank in source");
    expect(perJoin).toHaveLength(graph.sourceContents?.length ?? 0);
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
    expect(items.find((i) => i.fieldPath.startsWith("person["))).toBeUndefined();
  });
});
