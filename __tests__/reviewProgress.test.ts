import { computeOverviewProgress } from "@/features/review/reviewProgress";
import { expandRequiredChecklistItems } from "@/features/review/ReviewChecklistSchema";
import { buildMockOverview } from "@/features/review/reviewMock";

describe("reviewProgress", () => {
  it("computes source required equal to expanded checklist length", () => {
    const { graph } = buildMockOverview("r-1");
    const prog = computeOverviewProgress(graph);
    const requiredItems = expandRequiredChecklistItems(graph);
    expect(prog.source.required).toBe(requiredItems.length);
    expect(prog.source.checked).toBe(0);
  });

  it("attributes some requirements to each piece and collection when present", () => {
    const { graph } = buildMockOverview("r-1");
    const prog = computeOverviewProgress(graph);
    const pieceIds = (graph.pieces ?? []).map((p) => p.id);
    for (const pid of pieceIds) {
      expect(prog.perPiece[pid]).toBeDefined();
      expect(prog.perPiece[pid].required).toBeGreaterThan(0);
    }
    const collectionIds = (graph.collections ?? []).map((c) => c.id);
    for (const cid of collectionIds) {
      expect(prog.perCollection[cid]).toBeDefined();
      expect(prog.perCollection[cid].required).toBeGreaterThan(0);
    }
  });
});
