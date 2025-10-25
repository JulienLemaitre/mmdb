import { computeChangedChecklistFieldPaths } from "@/utils/reviewDiff";
import { buildMockOverview } from "@/utils/reviewMock";
import { buildSourceJoinRankPath } from "@/utils/ReviewChecklistSchema";

describe("reviewDiff rank change detection (per-join)", () => {
  it("emits changed field paths for join ranks that changed and nothing else", () => {
    const { graph } = buildMockOverview("r-1");

    // Baseline ranks
    const base = JSON.parse(JSON.stringify(graph));

    // Working copy with swapped ranks for two joins
    const working = JSON.parse(JSON.stringify(graph));
    const j1 = working.sourceOnPieceVersions.find(
      (j: any) => j.joinId === "join-1",
    );
    const j2 = working.sourceOnPieceVersions.find(
      (j: any) => j.joinId === "join-2",
    );
    expect(j1 && j2).toBeTruthy();
    const r1 = j1.rank;
    const r2 = j2.rank;
    j1.rank = r2;
    j2.rank = r1;

    const changes = computeChangedChecklistFieldPaths(
      base as any,
      working as any,
    );

    const paths = new Set(changes.map((c) => c.fieldPath));

    // Expect two changed paths corresponding to the two join ids
    const p1 = buildSourceJoinRankPath("join-1");
    const p2 = buildSourceJoinRankPath("join-2");
    expect(paths.has(p1)).toBe(true);
    expect(paths.has(p2)).toBe(true);

    // No unrelated MM_SOURCE scalar field should appear (we didn't change any)
    expect(Array.from(paths).some((p) => p.endsWith(".title"))).toBe(false);
    expect(Array.from(paths).some((p) => p.endsWith(".type"))).toBe(false);
  });
});
