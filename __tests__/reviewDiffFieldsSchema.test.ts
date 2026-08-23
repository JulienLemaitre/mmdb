import { describe, it, expect } from "@jest/globals";
import {
  getDiffFields,
  isDoNotReviewTwice,
  buildFieldPath,
  buildSourceJoinRankPath,
  REVIEW_DIFF_FIELDS_SCHEMA,
} from "@/features/review/reviewDiffFieldsSchema";

describe("reviewDiffFieldsSchema basics", () => {
  it("exposes fields for SECTION including rank and metre fields without labels", () => {
    const fields = getDiffFields("SECTION");
    const paths = fields.map((f) => f.path);
    expect(paths).toContain("rank");
    expect(paths).toContain("metreNumerator");
    expect(paths).toContain("metreDenominator");
    expect((fields[0] as any).label).toBeUndefined();
  });

  it("marks PERSON/ORGANIZATION/COLLECTION/PIECE/PIECE_VERSION as do-not-review-twice and MM_SOURCE as not", () => {
    expect(isDoNotReviewTwice("PERSON")).toBe(true);
    expect(isDoNotReviewTwice("ORGANIZATION")).toBe(true);
    expect(isDoNotReviewTwice("COLLECTION")).toBe(true);
    expect(isDoNotReviewTwice("PIECE")).toBe(true);
    expect(isDoNotReviewTwice("PIECE_VERSION")).toBe(true);
    expect(isDoNotReviewTwice("MM_SOURCE")).toBe(false);
    expect(isDoNotReviewTwice("SECTION")).toBe(false);
  });

  it("has fields defined for MM_SOURCE and REFERENCE", () => {
    const mm = REVIEW_DIFF_FIELDS_SCHEMA.MM_SOURCE.fields;
    const ref = REVIEW_DIFF_FIELDS_SCHEMA.REFERENCE.fields;
    expect(mm.length).toBeGreaterThan(0);
    expect(ref.length).toBeGreaterThan(0);
  });

  it("buildFieldPath follows convention for MM_SOURCE and other entities", () => {
    expect(buildFieldPath("MM_SOURCE", null, "title")).toBe("source.title");
    expect(buildFieldPath("PIECE", "p-1", "title")).toBe("piece[p-1].title");
    expect(buildFieldPath("SECTION", "s-1", "metreNumerator")).toBe(
      "section[s-1].metreNumerator",
    );
  });

  it("buildSourceJoinRankPath formats with pieceVersionId", () => {
    expect(buildSourceJoinRankPath("pv-123")).toBe(
      "source.pieceVersions[pv-123].rank",
    );
  });
});
