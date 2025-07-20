import { localStorageSetItem, localStorageGetItem } from "@/utils/localStorage";
import { isEqual, merge } from "lodash";

export function withLocalStorage<T>(
  reducer: (state: T, action: any) => T,
  storageKey: string,
  initialState: T,
) {
  let isInitialized = false;
  let lastSavedState: T;

  return (state: T, action: any): T => {
    let currentState = state;

    // On first call, merge with localStorage if available
    if (!isInitialized) {
      const savedState = localStorageGetItem(storageKey);

      if (savedState) {
        try {
          // Create a new merged state without mutating the input
          currentState = merge({}, initialState, savedState) as T;
        } catch (error) {
          console.warn(
            `Failed to merge localStorage state for key "${storageKey}":`,
            error,
          );
          // Fallback to the current state if merge fails
          currentState = state;
        }
      }

      lastSavedState = currentState;
      isInitialized = true;
    }

    // Call the original reducer
    const newState = reducer(currentState, action);

    // Only save to localStorage if state actually changed (deep comparison)
    if (!isEqual(newState, lastSavedState)) {
      try {
        localStorageSetItem(storageKey, newState);
        lastSavedState = newState;
      } catch (error) {
        console.error(
          `Failed to save state to localStorage for key "${storageKey}":`,
          error,
        );
      }
    }

    return newState;
  };
}
