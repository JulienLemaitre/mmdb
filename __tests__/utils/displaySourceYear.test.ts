import { displaySourceYear } from "@/utils/displaySourceYear";

describe("displaySourceYear", () => {
  it("returns No date when year is null", () => {
    expect(
      displaySourceYear({ year: null, isYearEstimated: false }),
    ).toBe("No date");
  });

  it("returns the year when present and not estimated", () => {
    expect(
      displaySourceYear({ year: 1820, isYearEstimated: false }),
    ).toBe(1820);
  });

  it("returns the year in parentheses when estimated", () => {
    expect(
      displaySourceYear({ year: 1820, isYearEstimated: true }),
    ).toBe("(1820)");
  });

  it("returns No date even if isYearEstimated is true with null year", () => {
    expect(
      displaySourceYear({ year: null, isYearEstimated: true }),
    ).toBe("No date");
  });
});
