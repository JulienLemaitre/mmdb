// Unit test for ./deleteNullPropertiesFromObject.ts
import "jest";
import deleteNullPropertiesFromObject from "./deleteNullPropertiesFromObject";

describe("deleteNullPropertiesFromObject", () => {
  it("With null properties", () => {
    const input = { a: null, b: 2, c: { d: null, e: 3 } };
    const output = { b: 2, c: { e: 3 } };
    expect(deleteNullPropertiesFromObject(input)).toEqual(output);
  });

  it("Without null properties", () => {
    const input = { a: 1, b: 2, c: { d: 4, e: 3 } };
    const output = { a: 1, b: 2, c: { d: 4, e: 3 } };
    expect(deleteNullPropertiesFromObject(input)).toEqual(output);
  });

  it("With all properties null", () => {
    const input = { a: null, b: null, c: { d: null, e: null } };
    const output = { c: {} };
    expect(deleteNullPropertiesFromObject(input)).toEqual(output);
  });

  it("With empty object", () => {
    const input = {};
    const output = {};
    expect(deleteNullPropertiesFromObject(input)).toEqual(output);
  });

  it("With nested empty objects", () => {
    const input = { a: {}, b: { c: {} } };
    const output = { a: {}, b: { c: {} } };
    expect(deleteNullPropertiesFromObject(input)).toEqual(output);
  });

  it("With object properties that are arrays of objects", () => {
    const input = {
      a: [
        { x: null, y: 2 },
        { x: 3, y: null },
      ],
      b: 2,
      c: { d: null, e: 3 },
    };
    const output = {
      a: [{ y: 2 }, { x: 3 }],
      b: 2,
      c: { e: 3 },
    };
    expect(deleteNullPropertiesFromObject(input)).toEqual(output);
  });
});
