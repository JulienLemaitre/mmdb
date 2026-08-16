import {
  purgeReviewLocalDrafts,
  localStorageSetItem,
  localStorageGetItem,
} from "@/utils/localStorage";
import { GET_REVIEW_STORAGE_KEYS } from "@/utils/constants";

describe("purgeReviewLocalDrafts", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should purge only the four keys of a specific review when reviewId is provided", () => {
    const reviewId1 = "rev-1";
    const reviewId2 = "rev-2";

    const keys1 = GET_REVIEW_STORAGE_KEYS(reviewId1);
    const keys2 = GET_REVIEW_STORAGE_KEYS(reviewId2);

    localStorageSetItem(keys1.session, { reviewId: "rev-1" });
    localStorageSetItem(keys1.feedForm, { formInfo: {} });
    localStorageSetItem(keys1.singlePieceVersionForm, { formInfo: {} });
    localStorageSetItem(keys1.collectionPieceVersionForm, { formInfo: {} });

    localStorageSetItem(keys2.session, { reviewId: "rev-2" });
    localStorageSetItem(keys2.feedForm, { formInfo: {} });

    localStorageSetItem("feedForm", { formInfo: {} });
    localStorageSetItem("singlePieceVersionForm", { formInfo: {} });
    localStorageSetItem("collectionPieceVersionForm", { formInfo: {} });
    localStorageSetItem("otherKey", "value");

    // Purge only review 1
    purgeReviewLocalDrafts(reviewId1);

    expect(localStorageGetItem(keys1.session)).toBeNull();
    expect(localStorageGetItem(keys1.feedForm)).toBeNull();
    expect(localStorageGetItem(keys1.singlePieceVersionForm)).toBeNull();
    expect(localStorageGetItem(keys1.collectionPieceVersionForm)).toBeNull();

    // Review 2 and other keys should still be intact
    expect(localStorageGetItem(keys2.session)).toEqual({ reviewId: "rev-2" });
    expect(localStorageGetItem(keys2.feedForm)).toEqual({ formInfo: {} });
    expect(localStorageGetItem("feedForm")).toEqual({ formInfo: {} });
    expect(localStorageGetItem("singlePieceVersionForm")).toEqual({
      formInfo: {},
    });
    expect(localStorageGetItem("collectionPieceVersionForm")).toEqual({
      formInfo: {},
    });
    expect(localStorageGetItem("otherKey")).toEqual("value");
  });

  it("should purge all review-prefixed keys when no reviewId is provided", () => {
    const reviewId1 = "rev-1";
    const reviewId2 = "rev-2";

    const keys1 = GET_REVIEW_STORAGE_KEYS(reviewId1);
    const keys2 = GET_REVIEW_STORAGE_KEYS(reviewId2);

    localStorageSetItem(keys1.session, { reviewId: "rev-1" });
    localStorageSetItem(keys1.feedForm, { formInfo: {} });
    localStorageSetItem(keys2.session, { reviewId: "rev-2" });
    localStorageSetItem(keys2.feedForm, { formInfo: {} });

    localStorageSetItem("feedForm", { formInfo: {} });
    localStorageSetItem("singlePieceVersionForm", { formInfo: {} });
    localStorageSetItem("collectionPieceVersionForm", { formInfo: {} });
    localStorageSetItem("otherKey", "value");

    // Purge all reviews
    purgeReviewLocalDrafts();

    expect(localStorageGetItem(keys1.session)).toBeNull();
    expect(localStorageGetItem(keys1.feedForm)).toBeNull();
    expect(localStorageGetItem(keys2.session)).toBeNull();
    expect(localStorageGetItem(keys2.feedForm)).toBeNull();

    // Non-review keys should still be present
    expect(localStorageGetItem("feedForm")).toEqual({ formInfo: {} });
    expect(localStorageGetItem("singlePieceVersionForm")).toEqual({
      formInfo: {},
    });
    expect(localStorageGetItem("collectionPieceVersionForm")).toEqual({
      formInfo: {},
    });
    expect(localStorageGetItem("otherKey")).toEqual("value");
  });
});
