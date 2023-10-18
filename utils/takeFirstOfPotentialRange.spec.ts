// Generated by CodiumAI

import takeFirstOfPotentialRange from "./takeFirstOfPotentialRange";

describe("takeFirstOfPotentialRange", () => {
  // Tests that the function returns the input value if it's not a string
  it("should return the input value when it's not a string", () => {
    expect(takeFirstOfPotentialRange(123)).toBe(123);
    expect(takeFirstOfPotentialRange(true)).toBe(true);
    expect(takeFirstOfPotentialRange(null)).toBe(null);
    expect(takeFirstOfPotentialRange(undefined)).toBe(undefined);
  });

  // Tests that the function returns the input value if it doesn't contain a dash
  it("should return the input value when it doesn't contain a dash", () => {
    expect(takeFirstOfPotentialRange("abc")).toBe("abc");
    expect(takeFirstOfPotentialRange("123")).toBe("123");
    expect(takeFirstOfPotentialRange("true")).toBe("true");
    expect(takeFirstOfPotentialRange("null")).toBe("null");
    expect(takeFirstOfPotentialRange("undefined")).toBe("undefined");
  });

  // Tests that the function returns an empty string if the input is an empty string
  it("should return an empty string when the input is an empty string", () => {
    expect(takeFirstOfPotentialRange("")).toBe("");
  });

  // Tests that the function returns the first value of a dash-separated string
  it("should return the first value of a dash-separated string", () => {
    expect(takeFirstOfPotentialRange("abc-def")).toBe("abc");
    expect(takeFirstOfPotentialRange("123-456")).toBe("123");
    expect(takeFirstOfPotentialRange("true-false")).toBe("true");
    expect(takeFirstOfPotentialRange("null-undefined")).toBe("null");
    expect(takeFirstOfPotentialRange("undefined-null")).toBe("undefined");
  });

  // Tests that the function handles whitespace before and after the dash
  it("should handle whitespace before and after the dash", () => {
    expect(takeFirstOfPotentialRange("abc - def")).toBe("abc");
    expect(takeFirstOfPotentialRange("123 - 456")).toBe("123");
    expect(takeFirstOfPotentialRange("true - false")).toBe("true");
    expect(takeFirstOfPotentialRange("null - undefined")).toBe("null");
    expect(takeFirstOfPotentialRange("undefined - null")).toBe("undefined");
  });

  // Tests that the function handles whitespace before and after the first value
  it("should handle whitespace before and after the first value", () => {
    expect(takeFirstOfPotentialRange(" abc-def")).toBe("abc");
    expect(takeFirstOfPotentialRange(" 123-456")).toBe("123");
    expect(takeFirstOfPotentialRange(" true-false")).toBe("true");
    expect(takeFirstOfPotentialRange(" null-undefined")).toBe("null");
    expect(takeFirstOfPotentialRange(" undefined-null")).toBe("undefined");
  });
});
