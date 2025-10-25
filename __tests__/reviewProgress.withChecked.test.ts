import { computeOverviewProgress } from "@/features/review/reviewProgress";
import { expandRequiredChecklistItems } from "@/features/review/ReviewChecklistSchema";
import { buildMockOverview } from "@/features/review/reviewMock";
import { encodeChecklistKey } from "@/features/review/reviewKeys";

describe("reviewProgress with checked aggregation", () => {
  it("counts checked items at source level when a checked set is provided", () => {
    const { graph, globallyReviewed } = buildMockOverview("r-2");
    const options = {
      globallyReviewed: {
        personIds: new Set(globallyReviewed.personIds),
        organizationIds: new Set(globallyReviewed.organizationIds),
        collectionIds: new Set(globallyReviewed.collectionIds),
        pieceIds: new Set(globallyReviewed.pieceIds),
      },
    } as const;

    const items = expandRequiredChecklistItems(graph, options);
    // Mark first 5 as checked
    const firstFive = items.slice(0, 5);
    const checked = new Set(firstFive.map((it) => encodeChecklistKey(it)));

    const prog = computeOverviewProgress(graph, options, checked);
    expect(prog.source.required).toBe(items.length);
    expect(prog.source.checked).toBe(firstFive.length);
  });

  it("attributes checked SECTION fields to the correct piece and collection", () => {
    const { graph, globallyReviewed } = buildMockOverview("r-3");
    const options = {
      globallyReviewed: {
        personIds: new Set(globallyReviewed.personIds),
        organizationIds: new Set(globallyReviewed.organizationIds),
        collectionIds: new Set(globallyReviewed.collectionIds),
        pieceIds: new Set(globallyReviewed.pieceIds),
      },
    } as const;

    const items = expandRequiredChecklistItems(graph, options);

    // Pick the first section and find all its checklist items
    const sec = (graph.sections ?? [])[0];
    expect(sec).toBeTruthy();
    const sectionItems = items.filter(
      (it) => it.entityType === "SECTION" && it.entityId === sec.id,
    );
    expect(sectionItems.length).toBeGreaterThan(0);

    // Resolve the owning pieceId for that section via movement -> pieceVersion -> piece
    const mv = (graph.movements ?? []).find((m) => m.id === sec.movementId)!;
    const pv = (graph.pieceVersions ?? []).find(
      (v) => v.id === mv.pieceVersionId,
    )!;
    const piece = (graph.pieces ?? []).find((p) => p.id === pv.pieceId)!;
    const collectionId = piece.collectionId as string | undefined;

    const checked = new Set(sectionItems.map((it) => encodeChecklistKey(it)));
    const prog = computeOverviewProgress(graph, options, checked);

    // Source-level checked equals number of section fields we marked
    expect(prog.source.checked).toBe(sectionItems.length);
    // Piece-level checked equals same count
    expect(prog.perPiece[piece.id].checked).toBe(sectionItems.length);
    // Collection-level checked equals same count (if collection exists)
    if (collectionId) {
      expect(prog.perCollection[collectionId].checked).toBe(
        sectionItems.length,
      );
    }

    // Required counts should be >= checked counts
    expect(prog.perPiece[piece.id].required).toBeGreaterThanOrEqual(
      prog.perPiece[piece.id].checked,
    );
  });

  it("omits globally reviewed PERSON fields from expansion (display rule)", () => {
    const { graph, globallyReviewed } = buildMockOverview("r-4");
    const options = {
      globallyReviewed: {
        personIds: new Set(globallyReviewed.personIds),
        organizationIds: new Set(globallyReviewed.organizationIds),
        collectionIds: new Set(globallyReviewed.collectionIds),
        pieceIds: new Set(globallyReviewed.pieceIds),
      },
    } as const;

    const items = expandRequiredChecklistItems(graph, options);
    expect(items.some((it) => it.entityType === "PERSON")).toBe(false);

    const prog = computeOverviewProgress(graph, options);
    // When no checked set passed, all checked counters are zero
    expect(prog.source.checked).toBe(0);
  });
});
