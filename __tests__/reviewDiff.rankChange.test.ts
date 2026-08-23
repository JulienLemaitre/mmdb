import { computeChangedFieldPaths } from "@/features/review/reviewDiff";
import { buildMockFeedFormState } from "@/features/review/reviewMock";
import { buildSourceJoinRankPath } from "@/features/review/reviewDiffFieldsSchema";

describe("reviewDiff join change detection (per-join by pieceVersionId)", () => {
  it("emits changed field paths for join ranks that changed and nothing else", () => {
    const base = buildMockFeedFormState("r-1");
    const working = JSON.parse(JSON.stringify(base));

    const j1 = working.mMSourceOnPieceVersions[0];
    const j2 = working.mMSourceOnPieceVersions[1];
    expect(j1 && j2).toBeTruthy();
    const r1 = j1.rank;
    const r2 = j2.rank;
    j1.rank = r2;
    j2.rank = r1;

    const changes = computeChangedFieldPaths(base, working);
    const paths = new Set(changes.map((c) => c.fieldPath));

    const p1 = buildSourceJoinRankPath(j1.pieceVersionId);
    const p2 = buildSourceJoinRankPath(j2.pieceVersionId);
    expect(paths.has(p1)).toBe(true);
    expect(paths.has(p2)).toBe(true);

    // No unrelated MM_SOURCE scalar field should appear
    expect(Array.from(paths).some((p) => p.endsWith(".title"))).toBe(false);
    expect(Array.from(paths).some((p) => p.endsWith(".type"))).toBe(false);
  });

  it("detects join addition and join removal", () => {
    const base = buildMockFeedFormState("r-1");

    // Addition
    const workingAdd = JSON.parse(JSON.stringify(base));
    workingAdd.mMSourceOnPieceVersions.push({
      pieceVersionId: "pv-3",
      rank: 3,
    });
    const addChanges = computeChangedFieldPaths(base, workingAdd);
    const addPaths = addChanges.map((c) => c.fieldPath);
    expect(addPaths).toContain(buildSourceJoinRankPath("pv-3"));

    // Removal
    const workingDel = JSON.parse(JSON.stringify(base));
    const removedPvId = workingDel.mMSourceOnPieceVersions[0].pieceVersionId;
    workingDel.mMSourceOnPieceVersions = [
      workingDel.mMSourceOnPieceVersions[1],
    ];
    const delChanges = computeChangedFieldPaths(base, workingDel);
    const delPaths = delChanges.map((c) => c.fieldPath);
    expect(delPaths).toContain(buildSourceJoinRankPath(removedPvId));
  });

  it("detects pieceVersionId substitution (fork scenario)", () => {
    const base = buildMockFeedFormState("r-1");
    const working = JSON.parse(JSON.stringify(base));

    const originalPvId = working.mMSourceOnPieceVersions[0].pieceVersionId;
    const forkedPvId = "pv-1-fork";
    working.mMSourceOnPieceVersions[0].pieceVersionId = forkedPvId;

    const changes = computeChangedFieldPaths(base, working);
    const paths = changes.map((c) => c.fieldPath);

    expect(paths).toContain(buildSourceJoinRankPath(originalPvId));
    expect(paths).toContain(buildSourceJoinRankPath(forkedPvId));
  });
});
