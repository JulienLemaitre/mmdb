const USE_LOCAL_STORAGE = true;

export function localStorageSetItem(key: string, value: any) {
  if (typeof window !== "undefined" && USE_LOCAL_STORAGE) {
    // Perform localStorage action
    return localStorage.setItem(key, JSON.stringify(value));
  }
}
export function localStorageGetItem(key: string) {
  if (typeof window !== "undefined" && USE_LOCAL_STORAGE) {
    // Perform localStorage action
    const retrievedValue = localStorage.getItem(key);
    let finalValue: any = null;
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
