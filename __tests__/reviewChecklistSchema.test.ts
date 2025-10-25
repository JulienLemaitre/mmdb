import { describe, it, expect } from "@jest/globals";
import {
  getChecklistFields,
  isDoNotReviewTwice,
  REVIEW_CHECKLIST_SCHEMA,
} from "@/features/review/ReviewChecklistSchema";

describe("ReviewChecklistSchema basics", () => {
  it("exposes fields for SECTION including rank and metre fields", () => {
    const fields = getChecklistFields("SECTION");
    const labels = fields.map((f) => f.label);
    const paths = fields.map((f) => f.path);
    expect(labels).toContain("Section rank");
    expect(paths).toContain("metreNumerator");
    expect(paths).toContain("metreDenominator");
  });

  it("marks PERSON/ORGANIZATION/COLLECTION/PIECE as do-not-review-twice and MM_SOURCE as not", () => {
    expect(isDoNotReviewTwice("PERSON")).toBe(true);
    expect(isDoNotReviewTwice("ORGANIZATION")).toBe(true);
    expect(isDoNotReviewTwice("COLLECTION")).toBe(true);
    expect(isDoNotReviewTwice("PIECE")).toBe(true);
    expect(isDoNotReviewTwice("MM_SOURCE")).toBe(false);
  });

  it("has at least one field required for MM_SOURCE and REFERENCE", () => {
    const mm = REVIEW_CHECKLIST_SCHEMA.MM_SOURCE.fields;
    const ref = REVIEW_CHECKLIST_SCHEMA.REFERENCE.fields;
    expect(mm.length).toBeGreaterThan(0);
    expect(ref.length).toBeGreaterThan(0);
  });
});
