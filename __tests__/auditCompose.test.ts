import { composeAuditEntries } from "@/utils/auditCompose";
import { buildMockOverview } from "@/utils/reviewMock";

function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

describe("auditCompose", () => {
  it("emits UPDATE entry for MM_SOURCE with contentsOrder snapshots when source title changes", () => {
    const { graph } = buildMockOverview("r-1");
    const working = deepClone(graph);
    working.source.title = "New title";

    const entries = composeAuditEntries("r-1", graph as any, working as any);
    const src = entries.find((e) => e.entityType === "MM_SOURCE");
    expect(src).toBeTruthy();
    expect(src!.operation).toBe("UPDATE");
    expect((src!.before as any).title).toBe(graph.source.title);
    expect((src!.after as any).title).toBe("New title");
    expect((src!.before as any).contentsOrder).toBeTruthy();
    expect((src!.after as any).contentsOrder).toBeTruthy();
    expect(((src!.before as any).contentsOrder as any[]).length).toBe(
      (graph.sourceOnPieceVersions ?? []).length,
    );
  });
});
