import {
  GET_REVIEW_STORAGE_KEYS,
  REVIEW_LOCAL_STORAGE_PREFIX,
} from "@/utils/constants";

const USE_LOCAL_STORAGE = true;

export const LOCAL_STORAGE_SCHEMA_VERSION = 7;
export const STORAGE_INVALIDATED_EVENT = "mmdb:storage-invalidated";

export type LocalStorageEnvelope<T> = {
  version: number;
  payload: T;
};

export function isLocalStorageAvailable() {
  return globalThis.window !== undefined && USE_LOCAL_STORAGE;
}

export function isVersionedLocalStorageEnvelope(
  value: unknown,
): value is LocalStorageEnvelope<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "version" in value &&
    typeof (value as { version?: unknown }).version === "number" &&
    "payload" in value
  );
}

function dispatchStorageInvalidated(key: string, reason: string): void {
  if (
    typeof window !== "undefined" &&
    typeof window.dispatchEvent === "function"
  ) {
    try {
      window.dispatchEvent(
        new CustomEvent(STORAGE_INVALIDATED_EVENT, {
          detail: { key, reason },
        }),
      );
    } catch (e) {
      console.error(
        `[localStorage] Error while dispatching ${STORAGE_INVALIDATED_EVENT}:`,
        e,
      );
    }
  }
}

export function localStorageSetItem<T>(key: string, value: T): void {
  if (!isLocalStorageAvailable()) return;

  const envelope: LocalStorageEnvelope<T> = {
    version: LOCAL_STORAGE_SCHEMA_VERSION,
    payload: value,
  };

  try {
    localStorage.setItem(key, JSON.stringify(envelope));
  } catch (e) {
    console.error(
      `[localStorageSetItem] Error while setting localStorage ${key}:`,
      e,
    );
  }
}

export function localStorageGetItem<T>(key: string): T | null {
  if (!isLocalStorageAvailable()) return null;

  const raw = localStorage.getItem(key);
  if (raw === null) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.warn(
      `[localStorageGetItem] Corrupted JSON for key "${key}". Removing.`,
      e,
    );
    localStorage.removeItem(key);
    dispatchStorageInvalidated(key, "corrupted_json");
    return null;
  }

  if (!isVersionedLocalStorageEnvelope(parsed)) {
    console.warn(
      `[localStorageGetItem] Invalid envelope for key "${key}". Removing.`,
    );
    localStorage.removeItem(key);
    dispatchStorageInvalidated(key, "invalid_envelope");
    return null;
  }

  if (parsed.version !== LOCAL_STORAGE_SCHEMA_VERSION) {
    console.warn(
      `[localStorageGetItem] Removed incompatible localStorage data for key "${key}". Stored version: ${parsed.version}, current version: ${LOCAL_STORAGE_SCHEMA_VERSION}.`,
    );
    localStorage.removeItem(key);
    dispatchStorageInvalidated(key, "incompatible_version");
    return null;
  }

  return parsed.payload as T;
}

export function localStorageRemoveItem(key: string): void {
  if (!isLocalStorageAvailable()) return;
  console.info(`[localStorageRemoveItem] Removing localStorage item ${key}`);
  localStorage.removeItem(key);
}

export function localStorageRemoveItems(keys: string[]): void {
  if (!isLocalStorageAvailable()) return;
  console.info(`[localStorageRemoveItems] Removing localStorage items ${keys}`);
  keys.forEach((key) => localStorageRemoveItem(key));
}

export function purgeReviewLocalDrafts(reviewId?: string): void {
  if (!isLocalStorageAvailable()) return;

  if (reviewId) {
    const keys = Object.values(GET_REVIEW_STORAGE_KEYS(reviewId));
    localStorageRemoveItems(keys);
    return;
  }

  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (
      key &&
      (key.startsWith(`${REVIEW_LOCAL_STORAGE_PREFIX}:`) ||
        key === REVIEW_LOCAL_STORAGE_PREFIX)
    ) {
      keysToRemove.push(key);
    }
  }
  localStorageRemoveItems(keysToRemove);
}
