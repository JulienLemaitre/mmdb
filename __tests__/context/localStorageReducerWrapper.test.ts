import { withLocalStorage } from "@/context/utils/localStorageReducerWrapper";
import { localStorageGetItem, localStorageSetItem } from "@/utils/localStorage";

describe("localStorageReducerWrapper withLocalStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  type TestState = {
    count: number;
    items?: string[];
    user?: { name: string; age?: number };
  };

  type TestAction =
    | { type: "increment" }
    | { type: "decrement" }
    | { type: "setItems"; payload: string[] }
    | { type: "setUser"; payload: { name: string; age?: number } };

  const testReducerCore = (state: TestState, action: TestAction): TestState => {
    switch (action.type) {
      case "increment":
        return { ...state, count: state.count + 1 };
      case "decrement":
        return { ...state, count: state.count - 1 };
      case "setItems":
        return { ...state, items: action.payload };
      case "setUser":
        return { ...state, user: action.payload };
      default:
        return state;
    }
  };

  it("should initialize with initialState and save updates to localStorage", () => {
    const storageKey = "test_reducer_key";
    const initialState: TestState = { count: 0, items: ["a"] };
    const wrappedReducer = withLocalStorage(
      testReducerCore,
      storageKey,
      initialState,
    );

    const state1 = wrappedReducer(initialState, { type: "increment" });
    expect(state1).toEqual({ count: 1, items: ["a"] });

    const saved = localStorageGetItem<TestState>(storageKey);
    expect(saved).toEqual({ count: 1, items: ["a"] });
  });

  it("should merge with localStorage using default 'merge' hydration strategy", () => {
    const storageKey = "test_merge_key";
    const initialState: TestState = {
      count: 0,
      items: ["item1", "item2"],
      user: { name: "Alice", age: 30 },
    };

    // Pre-populate localStorage with partial state
    localStorageSetItem(storageKey, {
      count: 5,
      user: { name: "Bob" },
    });

    const wrappedReducer = withLocalStorage(
      testReducerCore,
      storageKey,
      initialState,
    );

    // First execution triggers hydration
    const state = wrappedReducer(initialState, { type: "increment" });
    // Lodash merge merges initialState with savedState
    expect(state.count).toBe(6);
    expect(state.items).toEqual(["item1", "item2"]);
    expect(state.user).toEqual({ name: "Bob", age: 30 });
  });

  it("should replace state completely when 'replace' hydration strategy is used", () => {
    const storageKey = "test_replace_key";
    const initialState: TestState = {
      count: 0,
      items: ["item1", "item2"],
      user: { name: "Alice", age: 30 },
    };

    // Pre-populate localStorage with different state
    localStorageSetItem(storageKey, {
      count: 10,
      items: ["custom_item"],
      user: { name: "Bob" },
    });

    const wrappedReducer = withLocalStorage(
      testReducerCore,
      storageKey,
      initialState,
      { hydrationStrategy: "replace" },
    );

    const state = wrappedReducer(initialState, { type: "increment" });
    expect(state.count).toBe(11);
    expect(state.items).toEqual(["custom_item"]);
    expect(state.user).toEqual({ name: "Bob" }); // age is not present from initialState because it was replaced
  });

  it("should isolate state and closures between two factory instances with distinct keys", () => {
    const key1 = "reducer_instance_1";
    const key2 = "reducer_instance_2";

    const initialState1: TestState = { count: 0 };
    const initialState2: TestState = { count: 100 };

    const reducer1 = withLocalStorage(testReducerCore, key1, initialState1);
    const reducer2 = withLocalStorage(testReducerCore, key2, initialState2);

    const state1 = reducer1(initialState1, { type: "increment" });
    expect(state1.count).toBe(1);
    expect(localStorageGetItem<TestState>(key1)).toEqual({ count: 1 });
    expect(localStorageGetItem<TestState>(key2)).toBeNull();

    const state2 = reducer2(initialState2, { type: "increment" });
    expect(state2.count).toBe(101);
    expect(localStorageGetItem<TestState>(key1)).toEqual({ count: 1 });
    expect(localStorageGetItem<TestState>(key2)).toEqual({ count: 101 });
  });

  it("should not write to localStorage if state did not change", () => {
    const storageKey = "test_no_change_key";
    const initialState: TestState = { count: 0 };
    const wrappedReducer = withLocalStorage(
      testReducerCore,
      storageKey,
      initialState,
    );

    const setItemSpy = jest.spyOn(Storage.prototype, "setItem");

    // First action changes state -> saves to localStorage
    wrappedReducer(initialState, { type: "increment" });
    expect(setItemSpy).toHaveBeenCalledTimes(1);

    // Unknown/noop action -> state unchanged -> should not save again
    wrappedReducer({ count: 1 }, { type: "unknown" as any });
    expect(setItemSpy).toHaveBeenCalledTimes(1);

    setItemSpy.mockRestore();
  });
});
