// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";

global.TextEncoder = TextEncoder;
// @ts-ignore
global.TextDecoder = TextDecoder;

if (typeof globalThis.structuredClone !== "function") {
  globalThis.structuredClone = <T>(value: T): T => {
    // Good enough for plain test objects.
    // If you need full fidelity for Date/Map/Set/circular refs, use a real polyfill instead.
    return JSON.parse(JSON.stringify(value));
  };
}
