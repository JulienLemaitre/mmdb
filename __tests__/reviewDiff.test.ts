import { computeChangedChecklistFieldPaths, toEncodedKeys } from "@/utils/reviewDiff";
import { buildMockOverview } from "@/utils/reviewMock";

function clone<T>(v: T): T { return JSON.parse(JSON.stringify(v)); }

describe("reviewDiff", () => {
  it("detects source scalar field change", () => {
    const { graph } = buildMockOverview("r-1");
    const working = clone(graph);
    (working.source as any).title = "Updated";
    const changes = computeChangedChecklistFieldPaths(graph as any, working as any);
    const keys = toEncodedKeys(changes);
    expect(keys).toEqual(expect.arrayContaining(["MM_SOURCE::source.title"]));
  });

  it("detects per-join rank changes for ordering", () => {
    const { graph } = buildMockOverview("r-1");
    const working = clone(graph);
    // Swap ranks of two joins
    if (working.sourceContents) {
      const a = working.sourceContents[0];
      const b = working.sourceContents[1];
      const tmp = a.rank; a.rank = b.rank; b.rank = tmp;
    }
    const changes = computeChangedChecklistFieldPaths(graph as any, working as any);
    const paths = changes.map((c) => c.fieldPath);
    expect(paths).toEqual(expect.arrayContaining([
      `source.pieceVersions[join-1].rank`,
      `source.pieceVersions[join-2].rank`,
    ]));
  });

  it("detects nested SECTION field change", () => {
    const { graph } = buildMockOverview("r-1");
    const working = clone(graph);
    const sec = (working.sections ?? [])[0];
    expect(sec).toBeTruthy();
    (sec as any).metreNumerator = ((sec as any).metreNumerator || 4) + 1;
    const changes = computeChangedChecklistFieldPaths(graph as any, working as any);
    const keys = toEncodedKeys(changes);
    expect(keys.some((k) => k.startsWith("SECTION:"))).toBeTruthy();
    expect(changes.map(c=>c.fieldPath)).toEqual(expect.arrayContaining([
      `section[${sec.id}].metreNumerator`
    ]));
  });
});
