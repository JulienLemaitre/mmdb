import {
  localStorageSetItem,
  localStorageGetItem,
  localStorageRemoveItem,
  localStorageRemoveItems,
  LOCAL_STORAGE_SCHEMA_VERSION,
  STORAGE_INVALIDATED_EVENT,
  isVersionedLocalStorageEnvelope,
} from "@/utils/localStorage";

describe("utils/localStorage", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  it("should write and read items wrapped with current schema version", () => {
    const key = "test_key";
    const data = { foo: "bar", num: 42 };

    localStorageSetItem(key, data);

    const raw = localStorage.getItem(key);
    expect(raw).not.toBeNull();
    const parsedRaw = JSON.parse(raw!);
    expect(parsedRaw.version).toBe(LOCAL_STORAGE_SCHEMA_VERSION);
    expect(parsedRaw.payload).toEqual(data);

    const retrieved = localStorageGetItem<typeof data>(key);
    expect(retrieved).toEqual(data);
  });

  it("should remove item and dispatch storage-invalidated event on corrupted JSON", () => {
    const key = "corrupt_key";
    localStorage.setItem(key, "invalid-json-{");

    const eventListener = jest.fn();
    window.addEventListener(STORAGE_INVALIDATED_EVENT, eventListener);

    const result = localStorageGetItem(key);
    expect(result).toBeNull();
    expect(localStorage.getItem(key)).toBeNull();
    expect(eventListener).toHaveBeenCalledTimes(1);
    expect((eventListener.mock.calls[0][0] as CustomEvent).detail).toEqual({
      key,
      reason: "corrupted_json",
    });

    window.removeEventListener(STORAGE_INVALIDATED_EVENT, eventListener);
  });

  it("should remove item and dispatch storage-invalidated event on invalid envelope", () => {
    const key = "invalid_envelope_key";
    localStorage.setItem(
      key,
      JSON.stringify({ notAnEnvelope: true, count: 123 }),
    );

    const eventListener = jest.fn();
    window.addEventListener(STORAGE_INVALIDATED_EVENT, eventListener);

    const result = localStorageGetItem(key);
    expect(result).toBeNull();
    expect(localStorage.getItem(key)).toBeNull();
    expect(eventListener).toHaveBeenCalledTimes(1);
    expect((eventListener.mock.calls[0][0] as CustomEvent).detail).toEqual({
      key,
      reason: "invalid_envelope",
    });

    window.removeEventListener(STORAGE_INVALIDATED_EVENT, eventListener);
  });

  it("should remove item and dispatch storage-invalidated event on incompatible version", () => {
    const key = "old_version_key";
    localStorage.setItem(
      key,
      JSON.stringify({
        version: LOCAL_STORAGE_SCHEMA_VERSION - 1, // e.g. version 6
        payload: { old: "data" },
      }),
    );

    const eventListener = jest.fn();
    window.addEventListener(STORAGE_INVALIDATED_EVENT, eventListener);

    const result = localStorageGetItem(key);
    expect(result).toBeNull();
    expect(localStorage.getItem(key)).toBeNull();
    expect(eventListener).toHaveBeenCalledTimes(1);
    expect((eventListener.mock.calls[0][0] as CustomEvent).detail).toEqual({
      key,
      reason: "incompatible_version",
    });

    window.removeEventListener(STORAGE_INVALIDATED_EVENT, eventListener);
  });

  it("should remove items with localStorageRemoveItem and localStorageRemoveItems", () => {
    localStorageSetItem("key1", "val1");
    localStorageSetItem("key2", "val2");
    localStorageSetItem("key3", "val3");

    localStorageRemoveItem("key1");
    expect(localStorageGetItem("key1")).toBeNull();
    expect(localStorageGetItem("key2")).toBe("val2");

    localStorageRemoveItems(["key2", "key3"]);
    expect(localStorageGetItem("key2")).toBeNull();
    expect(localStorageGetItem("key3")).toBeNull();
  });

  it("isVersionedLocalStorageEnvelope should correctly identify valid and invalid envelopes", () => {
    expect(isVersionedLocalStorageEnvelope(null)).toBe(false);
    expect(isVersionedLocalStorageEnvelope("string")).toBe(false);
    expect(isVersionedLocalStorageEnvelope({})).toBe(false);
    expect(isVersionedLocalStorageEnvelope({ version: "1", payload: {} })).toBe(
      false,
    );
    expect(isVersionedLocalStorageEnvelope({ version: 7 })).toBe(false);
    expect(
      isVersionedLocalStorageEnvelope({ version: 7, payload: "data" }),
    ).toBe(true);
    expect(isVersionedLocalStorageEnvelope({ version: 7, payload: null })).toBe(
      true,
    );
  });
});
