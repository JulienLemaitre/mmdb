import getMMSourceDescriptionStateFromInput from "@/utils/getMMSourceDescriptionStateFromInput";
import getMMSourceDescriptionInputFromState from "@/utils/getMMSourceDescriptionInputFromState";
import { SOURCE_TYPE } from "@/prisma/client/enums";
import { MMSourceDescriptionState, SourceDescriptionInput } from "@/types/formTypes";

describe("MMSource year null handling", () => {
  const baseInput: SourceDescriptionInput = {
    title: "Test source",
    type: { value: SOURCE_TYPE.EDITION, label: "Edition" },
    link: "https://example.com/score",
    year: 1850,
    isYearEstimated: true,
    references: [],
  };

  it("normalizes no-date input to year null and isYearEstimated false", () => {
    const state = getMMSourceDescriptionStateFromInput({
      ...baseInput,
      year: null,
      isYearEstimated: true,
      noDate: true,
    });

    expect(state.year).toBeNull();
    expect(state.isYearEstimated).toBe(false);
  });

  it("keeps year and estimate flag when year is present", () => {
    const state = getMMSourceDescriptionStateFromInput(baseInput);

    expect(state.year).toBe(1850);
    expect(state.isYearEstimated).toBe(true);
  });

  it("maps null year state back to form input with noDate checked", () => {
    const state: MMSourceDescriptionState = {
      title: "Test source",
      type: SOURCE_TYPE.EDITION,
      link: "https://example.com/score",
      year: null,
      isYearEstimated: false,
      references: [],
    };

    const input = getMMSourceDescriptionInputFromState(state);

    expect(input).toMatchObject({
      year: null,
      isYearEstimated: false,
      noDate: true,
    });
  });

  it("maps numeric year state back to form input with noDate unchecked", () => {
    const state: MMSourceDescriptionState = {
      title: "Test source",
      type: SOURCE_TYPE.EDITION,
      link: "https://example.com/score",
      year: 1901,
      isYearEstimated: true,
      references: [],
    };

    const input = getMMSourceDescriptionInputFromState(state);

    expect(input).toMatchObject({
      year: 1901,
      isYearEstimated: true,
      noDate: false,
    });
  });
});
