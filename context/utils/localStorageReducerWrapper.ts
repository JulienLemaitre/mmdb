import { localStorageSetItem, localStorageGetItem } from "@/utils/localStorage";
import { isEqual, merge } from "lodash";

export type WithLocalStorageOptions = {
  hydrationStrategy?: "merge" | "replace";
};

export function withLocalStorage<T, U>(
  reducer: (state: T, action: U) => T,
  storageKey: string,
  initialState: T,
  options?: WithLocalStorageOptions,
) {
  let isInitialized = false;
  let lastSavedState: T;

  return (state: T, action: U): T => {
    let currentState = state;

    // On first call, hydrate from localStorage if available
    if (!isInitialized) {
      const savedState = localStorageGetItem<T>(storageKey);

      if (savedState) {
        try {
          if (options?.hydrationStrategy === "replace") {
            currentState = savedState;
          } else {
            // Create a new merged state without mutating the input
            currentState = merge({}, initialState, savedState) as T;
          }
        } catch (error) {
          console.warn(
            `Failed to hydrate localStorage state for key "${storageKey}":`,
            error,
          );
          // Fallback to the current state if hydration fails
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
