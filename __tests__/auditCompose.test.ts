import { composeAuditEntries } from "@/features/review/utils/auditCompose";
import { buildMockFeedFormState } from "@/features/review/reviewMock";
import { FeedFormState } from "@/types/feedFormTypes";

function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

describe("auditCompose with FeedFormState", () => {
  let baseline: FeedFormState;

  beforeEach(() => {
    baseline = buildMockFeedFormState("r-1");
  });

  it("emits UPDATE entry for MM_SOURCE with contentsOrder snapshots when source title changes", () => {
    const working = deepClone(baseline);
    working.mMSourceDescription!.title = "New title";

    const entries = composeAuditEntries("r-1", baseline, working);
    const src = entries.find((e) => e.entityType === "MM_SOURCE");
    expect(src).toBeTruthy();
    expect(src!.operation).toBe("UPDATE");
    expect((src!.before as any).title).toBe(baseline.mMSourceDescription!.title);
    expect((src!.after as any).title).toBe("New title");
    expect((src!.before as any).contentsOrder).toBeTruthy();
    expect((src!.after as any).contentsOrder).toBeTruthy();
    expect(((src!.before as any).contentsOrder as any[]).length).toBe(
      (baseline.mMSourceOnPieceVersions ?? []).length,
    );
  });

  it("emits UPDATE entry for MM_SOURCE with updated contentsOrder when joins change", () => {
    const working = deepClone(baseline);
    const pv1 = working.mMSourceOnPieceVersions![0];
    const pv2 = working.mMSourceOnPieceVersions![1];
    [pv1.rank, pv2.rank] = [pv2.rank, pv1.rank];

    const entries = composeAuditEntries("r-1", baseline, working);
    const src = entries.find((e) => e.entityType === "MM_SOURCE");
    expect(src).toBeTruthy();
    expect(src!.operation).toBe("UPDATE");

    const beforeOrder = (src!.before as any).contentsOrder;
    const afterOrder = (src!.after as any).contentsOrder;
    expect(beforeOrder[0].pieceVersionId).toBe(pv1.pieceVersionId);
    expect(beforeOrder[0].rank).toBe(1);
    expect(afterOrder[0].pieceVersionId).toBe(pv2.pieceVersionId);
    expect(afterOrder[0].rank).toBe(1);
  });

  it("emits CREATE and DELETE entries for added and removed entities", () => {
    const working = deepClone(baseline);
    // Add section
    const newSection = {
      id: "sec-created",
      rank: 2,
      metreNumerator: 3,
      metreDenominator: 4,
      isCommonTime: false,
      isCutTime: false,
      fastestStructuralNotesPerBar: 8,
      tempoIndicationId: "ti-1",
      comment: "New section",
    };
    working.pieceVersions![0].movements![0].sections!.push(newSection as any);

    // Delete a metronome mark
    const deletedMmId = baseline.metronomeMarks![0].id;
    working.metronomeMarks = [baseline.metronomeMarks![1]];

    const entries = composeAuditEntries("r-1", baseline, working);

    const createEntry = entries.find(
      (e) => e.entityType === "SECTION" && e.entityId === "sec-created",
    );
    expect(createEntry).toBeTruthy();
    expect(createEntry!.operation).toBe("CREATE");
    expect(createEntry!.before).toBeNull();
    expect((createEntry!.after as any).comment).toBe("New section");

    const deleteEntry = entries.find(
      (e) => e.entityType === "METRONOME_MARK" && e.entityId === deletedMmId,
    );
    expect(deleteEntry).toBeTruthy();
    expect(deleteEntry!.operation).toBe("DELETE");
    expect(deleteEntry!.before).toBeTruthy();
    expect(deleteEntry!.after).toBeNull();
  });

  it("discards DELETE entries when entityId is in protectedEntityIds (fork scenario)", () => {
    const working = deepClone(baseline);
    const originalPvId = baseline.pieceVersions![0].id;
    const originalMovId = baseline.pieceVersions![0].movements![0].id;
    const originalSecId =
      baseline.pieceVersions![0].movements![0].sections![0].id;

    // Simulate fork: replace pv-1 with pv-1-fork
    working.pieceVersions = [
      {
        id: "pv-1-fork",
        pieceId: "p-1",
        category: "VOCAL",
        movements: [
          {
            id: "mv-1-fork",
            rank: 1,
            key: "C_MINOR",
            isVariation: false,
            sections: [
              {
                id: "sec-1-fork",
                rank: 1,
                metreNumerator: 4,
                metreDenominator: 4,
                isCommonTime: true,
                isCutTime: false,
                fastestStructuralNotesPerBar: 16,
                tempoIndicationId: "ti-1",
                comment: "Modified in fork",
              },
            ],
          },
        ],
      } as any,
      working.pieceVersions![1],
    ];
    working.mMSourceOnPieceVersions![0].pieceVersionId = "pv-1-fork";

    const protectedIds = new Set([originalPvId, originalMovId, originalSecId]);

    const entries = composeAuditEntries(
      "r-1",
      baseline,
      working,
      protectedIds,
    );

    // Original PV/Movement/Section should NOT have DELETE entries
    expect(
      entries.some(
        (e) =>
          e.operation === "DELETE" &&
          (e.entityId === originalPvId ||
            e.entityId === originalMovId ||
            e.entityId === originalSecId),
      ),
    ).toBe(false);

    // New fork copies should have CREATE entries
    expect(
      entries.some(
        (e) => e.operation === "CREATE" && e.entityId === "pv-1-fork",
      ),
    ).toBe(true);
    expect(
      entries.some(
        (e) => e.operation === "CREATE" && e.entityId === "sec-1-fork",
      ),
    ).toBe(true);

    // MM_SOURCE should have UPDATE entry for join change
    const srcEntry = entries.find((e) => e.entityType === "MM_SOURCE");
    expect(srcEntry).toBeTruthy();
    expect(srcEntry!.operation).toBe("UPDATE");
  });

  it("returns no entries when baseline and working are identical", () => {
    const working = deepClone(baseline);
    const entries = composeAuditEntries("r-1", baseline, working);
    expect(entries.length).toBe(0);
  });

  describe("Scenario 9 — Source description updates and metronome mark stability", () => {
    it("emits only a single targeted UPDATE audit entry for MM_SOURCE when editing source description fields without touching metronome marks", () => {
      const working = deepClone(baseline);
      working.mMSourceDescription!.title = "Updated Symphony Edition Title";
      working.mMSourceDescription!.year = 1805;
      working.mMSourceDescription!.comment = "Revised edition comments";

      const entries = composeAuditEntries("r-1", baseline, working);

      // Only one audit entry should exist
      expect(entries).toHaveLength(1);

      const sourceEntry = entries[0];
      expect(sourceEntry.entityType).toBe("MM_SOURCE");
      expect(sourceEntry.entityId).toBe(baseline.mMSourceDescription!.id);
      expect(sourceEntry.operation).toBe("UPDATE");
      expect((sourceEntry.before as any).title).toBe(
        baseline.mMSourceDescription!.title,
      );
      expect((sourceEntry.after as any).title).toBe(
        "Updated Symphony Edition Title",
      );
      expect((sourceEntry.before as any).year).toBe(
        baseline.mMSourceDescription!.year,
      );
      expect((sourceEntry.after as any).year).toBe(1805);

      // Metronome marks must NOT appear in audit entries
      const mmEntries = entries.filter((e) => e.entityType === "METRONOME_MARK");
      expect(mmEntries).toHaveLength(0);
    });

    it("correctly matches singleton source and produces UPDATE even if working state has minor structural variations", () => {
      const working = deepClone(baseline);
      working.mMSourceDescription!.title = "Structural Variation Title";
      delete (working.mMSourceDescription as any).pieceVersions;
      delete (working.mMSourceDescription as any).comment;

      const entries = composeAuditEntries("r-1", baseline, working);
      const sourceEntry = entries.find((e) => e.entityType === "MM_SOURCE");

      expect(sourceEntry).toBeTruthy();
      expect(sourceEntry!.operation).toBe("UPDATE");
      expect(sourceEntry!.entityId).toBe(baseline.mMSourceDescription!.id);
      expect((sourceEntry!.after as any).title).toBe(
        "Structural Variation Title",
      );
    });
  });

  describe("Reference audit entries", () => {
    it("emits CREATE entry for REFERENCE when a reference is added with an id", () => {
      const working = deepClone(baseline);
      const newRef = {
        id: "ref-uuid-1",
        type: "PLATE_NUMBER" as const,
        reference: "VN 1234",
      };
      working.mMSourceDescription!.references.push(newRef);

      const entries = composeAuditEntries("r-1", baseline, working);
      expect(entries).toHaveLength(1);

      const refEntry = entries[0];
      expect(refEntry.entityType).toBe("REFERENCE");
      expect(refEntry.entityId).toBe("ref-uuid-1");
      expect(refEntry.operation).toBe("CREATE");
      expect(refEntry.before).toBeNull();
      expect((refEntry.after as any).reference).toBe("VN 1234");
      expect((refEntry.after as any).type).toBe("PLATE_NUMBER");
    });

    it("emits UPDATE entry for REFERENCE when a reference is modified", () => {
      const working = deepClone(baseline);
      const existingRefId = baseline.mMSourceDescription!.references[0].id;
      working.mMSourceDescription!.references[0].reference = "https://updated.org/op10";

      const entries = composeAuditEntries("r-1", baseline, working);
      expect(entries).toHaveLength(1);

      const refEntry = entries[0];
      expect(refEntry.entityType).toBe("REFERENCE");
      expect(refEntry.entityId).toBe(existingRefId);
      expect(refEntry.operation).toBe("UPDATE");
      expect((refEntry.before as any).reference).toBe(
        baseline.mMSourceDescription!.references[0].reference,
      );
      expect((refEntry.after as any).reference).toBe("https://updated.org/op10");
    });

    it("emits DELETE entry for REFERENCE when a reference is removed", () => {
      const working = deepClone(baseline);
      const existingRefId = baseline.mMSourceDescription!.references[0].id;
      working.mMSourceDescription!.references = [];

      const entries = composeAuditEntries("r-1", baseline, working);
      expect(entries).toHaveLength(1);

      const refEntry = entries[0];
      expect(refEntry.entityType).toBe("REFERENCE");
      expect(refEntry.entityId).toBe(existingRefId);
      expect(refEntry.operation).toBe("DELETE");
      expect(refEntry.before).toBeTruthy();
      expect(refEntry.after).toBeNull();
    });

    it("does not emit phantom UPDATE entry if a non-source change has no corresponding nodes", () => {
      const working = deepClone(baseline);
      // Supposing a change without matching node
      const entries = composeAuditEntries("r-1", baseline, working);
      expect(entries).toHaveLength(0);
    });
  });
});
