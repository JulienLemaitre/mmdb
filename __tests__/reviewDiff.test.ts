import { computeChangedFieldPaths } from "@/features/review/reviewDiff";
import { buildMockFeedFormState } from "@/features/review/reviewMock";
import { FeedFormState } from "@/types/feedFormTypes";

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

describe("computeChangedFieldPaths with FeedFormState", () => {
  let baseline: FeedFormState;

  beforeEach(() => {
    baseline = buildMockFeedFormState("r-1");
  });

  it("detects a source scalar field change", () => {
    const working = clone(baseline);
    working.mMSourceDescription!.title = "Updated Source Title";
    const changes = computeChangedFieldPaths(baseline, working);
    const paths = changes.map((c) => c.fieldPath);
    expect(paths).toContain("source.title");
    expect(paths.length).toBe(1);
  });

  it("detects a change in a nested reference on the source", () => {
    const working = clone(baseline);
    const refId = baseline.mMSourceDescription!.references[0].id;
    working.mMSourceDescription!.references[0].reference =
      "https://new.example.com";

    const changes = computeChangedFieldPaths(baseline, working);
    const paths = changes.map((c) => c.fieldPath);
    expect(paths).toContain(`reference[${refId}].reference`);
  });

  it("detects addition and deletion of references", () => {
    const workingAdd = clone(baseline);
    workingAdd.mMSourceDescription!.references.push({
      id: "ref-new",
      type: "ISBN",
      reference: "new ref",
    });
    const addChanges = computeChangedFieldPaths(baseline, workingAdd);
    const addPaths = addChanges.map((c) => c.fieldPath);
    expect(addPaths).toContain("reference[ref-new].type");
    expect(addPaths).toContain("reference[ref-new].reference");

    const workingDel = clone(baseline);
    const deletedRefId = baseline.mMSourceDescription!.references[0].id;
    workingDel.mMSourceDescription!.references = [];
    const delChanges = computeChangedFieldPaths(baseline, workingDel);
    const delPaths = delChanges.map((c) => c.fieldPath);
    expect(delPaths).toContain(`reference[${deletedRefId}].type`);
    expect(delPaths).toContain(`reference[${deletedRefId}].reference`);
  });

  it("detects contribution field change, addition and deletion", () => {
    const working = clone(baseline);
    const contribId = baseline.mMSourceContributions![0].id;
    working.mMSourceContributions![0].role = "EDITOR";
    const changes = computeChangedFieldPaths(baseline, working);
    expect(changes.map((c) => c.fieldPath)).toContain(
      `contribution[${contribId}].role`,
    );

    const workingAdd = clone(baseline);
    workingAdd.mMSourceContributions!.push({
      id: "cont-2",
      role: "TRANSCRIBER",
      personId: "person-1",
    });
    const addChanges = computeChangedFieldPaths(baseline, workingAdd);
    expect(addChanges.map((c) => c.fieldPath)).toContain(
      "contribution[cont-2].role",
    );

    const workingDel = clone(baseline);
    workingDel.mMSourceContributions = [];
    const delChanges = computeChangedFieldPaths(baseline, workingDel);
    expect(delChanges.map((c) => c.fieldPath)).toContain(
      `contribution[${contribId}].role`,
    );
  });

  it("detects top-level entity field changes (person, organization, collection, piece, tempoIndication, metronomeMark)", () => {
    const working = clone(baseline);
    const pId = baseline.persons![0].id;
    working.persons![0].firstName = "Wolfgang";
    working.organizations = [{ id: "org-1", name: "Breitkopf & Härtel" }];
    const colId = baseline.collections![0].id;
    working.collections![0].title = "Op. 10 Revised";
    const pieceId = baseline.pieces![0].id;
    working.pieces![0].nickname = "Presto";
    const pvId = baseline.pieceVersions![0].id;
    working.pieceVersions![0].category = "ORCHESTRAL";
    const tiId = baseline.tempoIndications![0].id;
    working.tempoIndications![0].text = "Vivace";
    const mmId = baseline.metronomeMarks![0].id;
    (working.metronomeMarks![0] as any).bpm = 144;

    const changes = computeChangedFieldPaths(baseline, working);
    const paths = changes.map((c) => c.fieldPath);

    expect(paths).toContain(`person[${pId}].firstName`);
    expect(paths).toContain("organization[org-1].name");
    expect(paths).toContain(`collection[${colId}].title`);
    expect(paths).toContain(`piece[${pieceId}].nickname`);
    expect(paths).toContain(`pieceVersion[${pvId}].category`);
    expect(paths).toContain(`tempoIndication[${tiId}].text`);
    expect(paths).toContain(`metronomeMark[${mmId}].bpm`);
  });

  it("detects addition and deletion of metronome mark", () => {
    const workingAdd = clone(baseline);
    workingAdd.metronomeMarks!.push({
      id: "mm-new",
      sectionId: "s-1",
      pieceVersionId: "pv-1",
      beatUnit: "HALF",
      bpm: 60,
      comment: "New MM",
      noMM: false,
    });
    const addChanges = computeChangedFieldPaths(baseline, workingAdd);
    expect(addChanges.map((c) => c.fieldPath)).toContain(
      "metronomeMark[mm-new].bpm",
    );

    const workingDel = clone(baseline);
    const deletedMmId = baseline.metronomeMarks![0].id;
    workingDel.metronomeMarks = [baseline.metronomeMarks![1]];
    const delChanges = computeChangedFieldPaths(baseline, workingDel);
    expect(delChanges.map((c) => c.fieldPath)).toContain(
      `metronomeMark[${deletedMmId}].bpm`,
    );
  });

  it("detects per-join rank changes for source contents", () => {
    const working = clone(baseline);
    const pv1 = working.mMSourceOnPieceVersions![0];
    const pv2 = working.mMSourceOnPieceVersions![1];
    [pv1.rank, pv2.rank] = [pv2.rank, pv1.rank]; // Swap ranks

    const changes = computeChangedFieldPaths(baseline, working);
    const paths = changes.map((c) => c.fieldPath);
    expect(paths).toContain(`source.pieceVersions[${pv1.pieceVersionId}].rank`);
    expect(paths).toContain(`source.pieceVersions[${pv2.pieceVersionId}].rank`);
  });

  it("detects a nested movement field change", () => {
    const working = clone(baseline);
    const movement = working.pieceVersions![0].movements![0];
    movement.key = "A_MINOR";

    const changes = computeChangedFieldPaths(baseline, working);
    const paths = changes.map((c) => c.fieldPath);
    expect(paths).toContain(`movement[${movement.id}].key`);
  });

  it("detects a deeply nested section field change", () => {
    const working = clone(baseline);
    const section = working.pieceVersions![0].movements![0].sections![0];
    section.metreNumerator = (section.metreNumerator ?? 4) + 1;

    const changes = computeChangedFieldPaths(baseline, working);
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
      isCommonTime: false,
      isCutTime: false,
      fastestStructuralNotesPerBar: 8,
      tempoIndicationId: "ti-1",
      comment: "",
    };
    working.pieceVersions![0].movements![0].sections!.push(newSection as any);

    const changes = computeChangedFieldPaths(baseline, working);
    const paths = changes.map((c) => c.fieldPath);

    expect(paths).toContain("section[new-sec-1].rank");
    expect(paths).toContain("section[new-sec-1].metreNumerator");
  });

  it("detects the deletion of a movement", () => {
    const working = clone(baseline);
    const deletedMovement = baseline.pieceVersions![1].movements![0];
    const childSectionId = deletedMovement.sections![0].id;
    working.pieceVersions![1].movements = []; // Delete the movement

    const changes = computeChangedFieldPaths(baseline, working);
    const paths = changes.map((c) => c.fieldPath);

    expect(paths).toContain(`movement[${deletedMovement.id}].rank`);
    expect(paths).toContain(`movement[${deletedMovement.id}].key`);
    expect(paths).toContain(`section[${childSectionId}].rank`);
  });

  it("returns no changes for identical FeedFormStates", () => {
    const working = clone(baseline);
    const changes = computeChangedFieldPaths(baseline, working);
    expect(changes.length).toBe(0);
  });

  describe("resilience against missing entity IDs (Scenario 5)", () => {
    it("handles contribution added without ID without throwing and retains all diff entries", () => {
      const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      const working = clone(baseline);
      working.mMSourceContributions!.push({
        // Missing id
        personId: "p-new",
        role: "TRANSCRIBER" as any,
      } as any);

      // Modify something else as well to ensure other diff items are not skipped
      working.mMSourceDescription!.title = "New Title";

      const changes = computeChangedFieldPaths(baseline, working);
      const paths = changes.map((c) => c.fieldPath);

      expect(paths).toContain("source.title");
      expect(paths).toContain("contribution.personId");
      expect(paths).toContain("contribution.role");
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringMatching(
          /^\[reviewDiffFieldsSchema] buildFieldPath: missing entityId for CONTRIBUTION/,
        ),
      );
      warnSpy.mockRestore();
    });

    it("handles multiple entities missing IDs in base and working arrays without crashing", () => {
      const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      const working = clone(baseline);
      working.persons = [
        ...(baseline.persons ?? []),
        {
          // Missing id
          firstName: "Anonymous",
          lastName: "Author",
        } as any,
      ];

      const changes = computeChangedFieldPaths(baseline, working);
      const paths = changes.map((c) => c.fieldPath);

      expect(paths).toContain("person.firstName");
      expect(paths).toContain("person.lastName");
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringMatching(
          /^\[reviewDiffFieldsSchema] buildFieldPath: missing entityId for PERSON/,
        ),
      );
      warnSpy.mockRestore();
    });
  });
});
