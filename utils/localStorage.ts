const USE_LOCAL_STORAGE = false;

export function localStorageSetItem(key: string, value: any) {
  if (typeof window !== "undefined" && USE_LOCAL_STORAGE) {
    // Perform localStorage action
    return localStorage.setItem(key, JSON.stringify(value));
  }
}
export function localStorageGetItem(key: string) {
  if (typeof window !== "undefined" && USE_LOCAL_STORAGE) {
    // Perform localStorage action
    return localStorage.getItem(key);
  }
}
