import { localStorageSetItem, localStorageGetItem } from "@/utils/localStorage";

export function withLocalStorage<T>(
  reducer: (state: T, action: any) => T,
  storageKey: string,
  initialState: T,
) {
  let isInitialized = false;

  return (state: T, action: any): T => {
    // On first call, merge with localStorage if available
    if (!isInitialized) {
      const savedState = localStorageGetItem(storageKey);
      if (savedState) {
        // Merge saved state with initial state to handle schema changes
        state = { ...initialState, ...savedState };
      }
      isInitialized = true;
    }

    // Call the original reducer
    const newState = reducer(state, action);

    // Only save to localStorage if state actually changed
    if (newState !== state) {
      localStorageSetItem(storageKey, newState);
    }

    return newState;
  };
}
