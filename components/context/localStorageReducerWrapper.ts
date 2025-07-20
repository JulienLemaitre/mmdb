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
    // On first call, merge with localStorage if available
    if (!isInitialized) {
      const savedState = localStorageGetItem(storageKey);

      let mergedState: T;
      if (savedState) {
        try {
          // Create a completely new merged state - no mutation of input parameters
          mergedState = merge({}, initialState, savedState) as T;
        } catch (error) {
          console.warn(
            `Failed to merge localStorage state for key "${storageKey}":`,
            error,
          );
          mergedState = { ...initialState } as T;
        }
      } else {
        // Create a copy of the initial state
        mergedState = { ...initialState } as T;
      }

      lastSavedState = mergedState;
      isInitialized = true;

      // Call the reducer with the merged state instead of the original state
      const newState = reducer(mergedState, action);

      // Save to localStorage if needed
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
    }

    // For subsequent calls, use the original state as normal
    const newState = reducer(state, action);

    // Save to localStorage if state changed
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
