import { computeChangedChecklistFieldPaths } from "@/features/review/reviewDiff";
import { ChecklistGraph } from "@/types/reviewTypes";

describe("computeChangedChecklistFieldPaths - edge cases", () => {
  it("treats empty string and undefined as equivalent (normalization)", () => {
    const base: Partial<ChecklistGraph> = { source: { title: "" } as any };
    const work: Partial<ChecklistGraph> = {
      source: { title: undefined } as any,
    };

    const changes = computeChangedChecklistFieldPaths(base as any, work as any);
    expect(changes.length).toBe(0);
  });

  it("detects changes in top-level entities like PERSON", () => {
    const base: Partial<ChecklistGraph> = {
      persons: [{ id: "p1", firstName: "John" }] as any,
    };
    const work: Partial<ChecklistGraph> = {
      persons: [{ id: "p1", firstName: "Jane" }] as any,
    };

    const changes = computeChangedChecklistFieldPaths(base as any, work as any);
    expect(changes[0].fieldPath).toBe("person[p1].firstName");
  });

  it("detects creation of a top-level entity and emits all schema fields", () => {
    const base: Partial<ChecklistGraph> = { contributions: [] };
    const work: Partial<ChecklistGraph> = {
      contributions: [{ id: "c1", role: "COMPOSER" }] as any,
    };

    const changes = computeChangedChecklistFieldPaths(base as any, work as any);
    // Should contain multiple fields defined in REVIEW_CHECKLIST_SCHEMA for CONTRIBUTION
    expect(changes.length).toBeGreaterThan(1);
    expect(changes.some((c) => c.fieldPath === "contribution[c1].role")).toBe(
      true,
    );
  });
});
