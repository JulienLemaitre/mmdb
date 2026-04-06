const USE_LOCAL_STORAGE = true;

export function localStorageSetItem(key: string, value: any) {
  if (typeof window !== "undefined" && USE_LOCAL_STORAGE) {
    // Perform localStorage SET action
    return localStorage.setItem(key, JSON.stringify(value));
  }
}
export function localStorageGetItem(key: string) {
  if (typeof window !== "undefined" && USE_LOCAL_STORAGE) {
    // Perform localStorage GET action
    const retrievedValue = localStorage.getItem(key);
    let finalValue: any;
    try {
      finalValue = retrievedValue && JSON.parse(retrievedValue);
    } catch (e: any) {
      console.warn(
        `[localStorageGetItem] Error while parsing localStorage ${key}: ${e?.message}`,
        retrievedValue,
      );
      finalValue = retrievedValue;
    }
    return finalValue;
  }
}
export function localStorageRemoveItem(key: string) {
  if (typeof window !== "undefined" && USE_LOCAL_STORAGE) {
    // Perform localStorage REMOVE action
    return localStorage.removeItem(key);
  }
}
