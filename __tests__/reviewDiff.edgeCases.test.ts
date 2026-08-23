import { computeChangedFieldPaths } from "@/features/review/reviewDiff";
import { FeedFormState } from "@/types/feedFormTypes";

describe("computeChangedFieldPaths - edge cases", () => {
  it("treats empty string, null, and undefined as equivalent (normalization)", () => {
    const base: FeedFormState = {
      mMSourceDescription: {
        title: "",
        comment: null,
        type: "EDITION",
        link: undefined,
        year: 1800,
        isYearEstimated: false,
        references: [],
      } as any,
    };
    const work: FeedFormState = {
      mMSourceDescription: {
        title: undefined,
        comment: "",
        type: "EDITION",
        link: null,
        year: 1800,
        isYearEstimated: false,
        references: [],
      } as any,
    };

    const changes = computeChangedFieldPaths(base, work);
    expect(changes.length).toBe(0);
  });

  it("detects transition from null/empty to a value and from a value to null", () => {
    const base: FeedFormState = {
      mMSourceDescription: {
        id: "src-1",
        title: "Title",
        comment: null,
        type: "EDITION",
        link: "https://example.com",
        year: 1800,
        isYearEstimated: false,
        references: [],
      } as any,
      pieces: [
        {
          id: "p1",
          title: "Piece 1",
          nickname: "Moonlight",
          composerId: "c1",
        } as any,
      ],
    };
    const work: FeedFormState = {
      mMSourceDescription: {
        id: "src-1",
        title: "Title",
        comment: "Now has comment",
        type: "EDITION",
        link: "https://example.com",
        year: 1800,
        isYearEstimated: false,
        references: [],
      } as any,
      pieces: [
        {
          id: "p1",
          title: "Piece 1",
          nickname: null,
          composerId: "c1",
        } as any,
      ],
    };

    const changes = computeChangedFieldPaths(base, work);
    const paths = changes.map((c) => c.fieldPath);
    expect(paths).toContain("source.comment");
    expect(paths).toContain("piece[p1].nickname");
  });

  it("detects changes in top-level entities like PERSON", () => {
    const base: FeedFormState = {
      persons: [{ id: "p1", firstName: "John", lastName: "Doe" }] as any,
    };
    const work: FeedFormState = {
      persons: [{ id: "p1", firstName: "Jane", lastName: "Doe" }] as any,
    };

    const changes = computeChangedFieldPaths(base, work);
    expect(changes[0].fieldPath).toBe("person[p1].firstName");
  });

  it("detects creation of a top-level entity and emits all schema fields", () => {
    const base: FeedFormState = { mMSourceContributions: [] };
    const work: FeedFormState = {
      mMSourceContributions: [
        { id: "c1", role: "COMPOSER", personId: "p1" },
      ] as any,
    };

    const changes = computeChangedFieldPaths(base, work);
    expect(changes.length).toBeGreaterThan(1);
    expect(changes.some((c) => c.fieldPath === "contribution[c1].role")).toBe(
      true,
    );
    expect(
      changes.some((c) => c.fieldPath === "contribution[c1].personId"),
    ).toBe(true);
  });
});
