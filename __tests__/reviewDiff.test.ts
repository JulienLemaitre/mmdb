import { computeChangedChecklistFieldPaths } from "@/utils/reviewDiff";
import { buildMockOverview } from "@/utils/reviewMock";
import { ChecklistGraph } from "@/utils/ReviewChecklistSchema";

// Deep clone utility to ensure tests have isolated data
function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

describe("computeChangedChecklistFieldPaths with nested graph", () => {
  let baseline: ChecklistGraph;

  beforeEach(() => {
    baseline = buildMockOverview("r-1").graph;
  });

  it("detects a source scalar field change", () => {
    const working = clone(baseline);
    working.source.title = "Updated Source Title";
    const changes = computeChangedChecklistFieldPaths(baseline, working);
    const paths = changes.map((c) => c.fieldPath);
    expect(paths).toContain("source.title");
    expect(paths.length).toBe(1);
  });

  it("detects a change in a nested reference on the source", () => {
    const working = clone(baseline);
    const refId = baseline.source.references![0].id;
    working.source.references![0].reference = "https://new.example.com";

    const changes = computeChangedChecklistFieldPaths(baseline, working);
    const paths = changes.map((c) => c.fieldPath);
    expect(paths).toContain(`reference[${refId}].reference`);
  });

  it("detects per-join rank changes for source contents", () => {
    const working = clone(baseline);
    const a = working.sourceContents![0];
    const b = working.sourceContents![1];
    [a.rank, b.rank] = [b.rank, a.rank]; // Swap ranks

    const changes = computeChangedChecklistFieldPaths(baseline, working);
    const paths = changes.map((c) => c.fieldPath);
    expect(paths).toContain("source.pieceVersions[join-1].rank");
    expect(paths).toContain("source.pieceVersions[join-2].rank");
  });

  it("detects a nested movement field change", () => {
    const working = clone(baseline);
    const movement = working.pieceVersions![0].movements![0];
    movement.key = "A_MINOR"; // Change the key

    const changes = computeChangedChecklistFieldPaths(baseline, working);
    const paths = changes.map((c) => c.fieldPath);
    expect(paths).toContain(`movement[${movement.id}].key`);
  });

  it("detects a deeply nested section field change", () => {
    const working = clone(baseline);
    const section = working.pieceVersions![0].movements![0].sections![0];
    section.metreNumerator! += 1;

    const changes = computeChangedChecklistFieldPaths(baseline, working);
    const paths = changes.map((c) => c.fieldPath);
    expect(paths).toContain(`section[${section.id}].metreNumerator`);
  });

  it("detects the creation of a new section", () => {
    const working = clone(baseline);
    const newSection = {
      id: "new-sec-1",
      rank: 2,
      metreNumerator: 2,
      metreDenominator: 4,
      tempoIndication: { id: "ti-1", text: "Allegro" },
    };
    working.pieceVersions![0].movements![0].sections!.push(newSection as any);

    const changes = computeChangedChecklistFieldPaths(baseline, working);
    const paths = changes.map((c) => c.fieldPath);

    expect(paths).toContain(`section[new-sec-1].rank`);
    expect(paths).toContain(`section[new-sec-1].metreNumerator`);
  });

  it("detects the deletion of a movement", () => {
    const working = clone(baseline);
    const deletedMovement = baseline.pieceVersions![1].movements![0];
    const childSectionId = deletedMovement.sections![0].id;
    working.pieceVersions![1].movements = []; // Delete the movement

    const changes = computeChangedChecklistFieldPaths(baseline, working);
    const paths = changes.map((c) => c.fieldPath);

    expect(paths).toContain(`movement[${deletedMovement.id}].rank`);
    expect(paths).toContain(`movement[${deletedMovement.id}].key`);
    expect(paths).toContain(`section[${childSectionId}].rank`);
  });

  it("returns no changes for identical graphs", () => {
    const working = clone(baseline);
    const changes = computeChangedChecklistFieldPaths(baseline, working);
    expect(changes.length).toBe(0);
  });
});
