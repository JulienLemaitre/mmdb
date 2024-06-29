// Unit test for ./formatLabelFromEnum.ts
import "jest";
import formatToPhraseCase from "./formatToPhraseCase";

describe("formatPhoneInput", () => {
  it("PLATE_NUMBER => Plate number", () => {
    expect(formatToPhraseCase("PLATE_NUMBER")).toEqual("Plate number");
  });
});
