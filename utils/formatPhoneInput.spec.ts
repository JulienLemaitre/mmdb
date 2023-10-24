// Unit test for ./formatPhoneInput.ts
import "jest";
import formatPhoneInput from "./formatPhoneInput";

describe("formatPhoneInput", () => {
  it("Without number", () => {
    expect(formatPhoneInput("text")).toEqual("");
  });
  it("With number and spaces", () => {
    expect(formatPhoneInput("09  67 45 4310")).toEqual("0967454310");
  });
  it("With number and spaces and +33", () => {
    expect(formatPhoneInput("+33 9 67 45 4310")).toEqual("0967454310");
  });
  it("With number and spaces and 33", () => {
    expect(formatPhoneInput("33 9 67 45 4310")).toEqual("0967454310");
  });
  it("With number and spaces and 0033", () => {
    expect(formatPhoneInput("0033 9 67 45 4310")).toEqual("0967454310");
  });
  it("Without lengthLimit option", () => {
    expect(formatPhoneInput("0967454310545")).toEqual("0967454310");
  });
  it("With lengthLimit option", () => {
    expect(formatPhoneInput("0967454310545", { lengthLimit: 12 })).toEqual(
      "096745431054",
    );
  });
  it("With number and spaces and 0033 and lengthLimit", () => {
    expect(
      formatPhoneInput("0033 9 67 45 4310 545", { lengthLimit: 12 }),
    ).toEqual("096745431054");
  });
  it("With first number not 0", () => {
    expect(formatPhoneInput("12345")).toEqual("012345");
  });
  it("With first number not 0 and long input", () => {
    expect(formatPhoneInput("967454310545")).toEqual("0967454310");
  });
});
