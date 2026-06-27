const USE_LOCAL_STORAGE = true;

export const LOCAL_STORAGE_SCHEMA_VERSION = 5;

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
    return null;
  }

  if (!isVersionedLocalStorageEnvelope(parsed)) {
    console.warn(
      `[localStorageGetItem] Invalid envelope for key "${key}". Removing.`,
    );
    localStorage.removeItem(key);
    return null;
  }

  if (parsed.version !== LOCAL_STORAGE_SCHEMA_VERSION) {
    console.warn(
      `[localStorageGetItem] Removed incompatible localStorage data for key "${key}". Stored version: ${parsed.version}, current version: ${LOCAL_STORAGE_SCHEMA_VERSION}.`,
    );
    localStorage.removeItem(key);
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
