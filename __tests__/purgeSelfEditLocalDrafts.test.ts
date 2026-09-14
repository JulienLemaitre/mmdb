import {
  purgeSelfEditLocalDrafts,
  localStorageSetItem,
  localStorageGetItem,
} from "@/utils/localStorage";
import { GET_SELF_EDIT_STORAGE_KEYS } from "@/utils/constants";

describe("purgeSelfEditLocalDrafts", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should purge only the four keys of a specific source edit when sourceId is provided", () => {
    const sourceId1 = "src-1";
    const sourceId2 = "src-2";

    const keys1 = GET_SELF_EDIT_STORAGE_KEYS(sourceId1);
    const keys2 = GET_SELF_EDIT_STORAGE_KEYS(sourceId2);

    localStorageSetItem(keys1.session, { mMSourceId: "src-1" });
    localStorageSetItem(keys1.feedForm, { formInfo: {} });
    localStorageSetItem(keys1.singlePieceVersionForm, { formInfo: {} });
    localStorageSetItem(keys1.collectionPieceVersionForm, { formInfo: {} });

    localStorageSetItem(keys2.session, { mMSourceId: "src-2" });
    localStorageSetItem(keys2.feedForm, { formInfo: {} });

    localStorageSetItem("feedForm", { formInfo: {} });
    localStorageSetItem("otherKey", "value");

    // Purge only source 1
    purgeSelfEditLocalDrafts(sourceId1);

    expect(localStorageGetItem(keys1.session)).toBeNull();
    expect(localStorageGetItem(keys1.feedForm)).toBeNull();
    expect(localStorageGetItem(keys1.singlePieceVersionForm)).toBeNull();
    expect(localStorageGetItem(keys1.collectionPieceVersionForm)).toBeNull();

    // Source 2 and other keys should still be intact
    expect(localStorageGetItem(keys2.session)).toEqual({ mMSourceId: "src-2" });
    expect(localStorageGetItem(keys2.feedForm)).toEqual({ formInfo: {} });
    expect(localStorageGetItem("feedForm")).toEqual({ formInfo: {} });
    expect(localStorageGetItem("otherKey")).toEqual("value");
  });

  it("should purge all self-edit-prefixed keys when no sourceId is provided", () => {
    const sourceId1 = "src-1";
    const sourceId2 = "src-2";

    const keys1 = GET_SELF_EDIT_STORAGE_KEYS(sourceId1);
    const keys2 = GET_SELF_EDIT_STORAGE_KEYS(sourceId2);

    localStorageSetItem(keys1.session, { mMSourceId: "src-1" });
    localStorageSetItem(keys1.feedForm, { formInfo: {} });
    localStorageSetItem(keys2.session, { mMSourceId: "src-2" });
    localStorageSetItem(keys2.feedForm, { formInfo: {} });

    localStorageSetItem("feedForm", { formInfo: {} });
    localStorageSetItem("otherKey", "value");

    // Purge all self edits
    purgeSelfEditLocalDrafts();

    expect(localStorageGetItem(keys1.session)).toBeNull();
    expect(localStorageGetItem(keys1.feedForm)).toBeNull();
    expect(localStorageGetItem(keys2.session)).toBeNull();
    expect(localStorageGetItem(keys2.feedForm)).toBeNull();

    // Non-selfEdit keys should still be present
    expect(localStorageGetItem("feedForm")).toEqual({ formInfo: {} });
    expect(localStorageGetItem("otherKey")).toEqual("value");
  });
});
