import React from "react";
import { render, screen, fireEvent, renderHook, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  FormSessionProvider,
  useFormSession,
} from "@/context/formSessionContext";
import { FormSession, ReviewSessionMeta } from "@/types/zodTypes";
import { localStorageGetItem, localStorageSetItem } from "@/utils/localStorage";

describe("FormSessionContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns { mode: 'data-entering' } by default when outside of any provider", () => {
    const { result } = renderHook(() => useFormSession());
    expect(result.current).toEqual({ mode: "data-entering" });
  });

  it("returns { mode: 'data-entering' } when FormSessionProvider is mounted without props", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FormSessionProvider>{children}</FormSessionProvider>
    );
    const { result } = renderHook(() => useFormSession(), { wrapper });
    expect(result.current).toEqual({ mode: "data-entering" });
  });

  it("returns { mode: 'data-entering' } when FormSessionProvider is mounted with data-entering session", () => {
    const session: FormSession = { mode: "data-entering" };
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FormSessionProvider session={session}>{children}</FormSessionProvider>
    );
    const { result } = renderHook(() => useFormSession(), { wrapper });
    expect(result.current).toEqual({ mode: "data-entering" });
  });

  it("provides review session metadata and allows reading and writing overallComment in review mode", () => {
    const reviewMeta: ReviewSessionMeta = {
      reviewId: "rev-123",
      reviewerId: "user-456",
      mMSourceId: "source-789",
      overallComment: null,
    };
    const session: FormSession = {
      mode: "review",
      review: reviewMeta,
      globallyReviewed: {
        personIds: ["p1"],
        organizationIds: ["o1"],
        collectionIds: ["c1"],
        pieceIds: ["pc1"],
        pieceVersionIds: ["pv1"],
      },
    };

    const TestComponent = () => {
      const formSession = useFormSession();
      if (formSession.mode !== "review") {
        return <div>Not in review mode</div>;
      }
      return (
        <div>
          <span data-testid="mode">{formSession.mode}</span>
          <span data-testid="reviewId">{formSession.review.reviewId}</span>
          <span data-testid="overallComment">
            {formSession.review.overallComment ?? "empty"}
          </span>
          <button
            onClick={() =>
              formSession.setOverallComment("Updated overall comment for review")
            }
          >
            Update Comment
          </button>
          <button onClick={() => formSession.setOverallComment(null)}>
            Clear Comment
          </button>
        </div>
      );
    };

    render(
      <FormSessionProvider session={session}>
        <TestComponent />
      </FormSessionProvider>,
    );

    expect(screen.getByTestId("mode")).toHaveTextContent("review");
    expect(screen.getByTestId("reviewId")).toHaveTextContent("rev-123");
    expect(screen.getByTestId("overallComment")).toHaveTextContent("empty");

    // Local storage was initialized with initial session meta
    const initialSaved = localStorageGetItem<ReviewSessionMeta>(
      "review:rev-123:session",
    );
    expect(initialSaved).toEqual(reviewMeta);

    // Update overallComment
    fireEvent.click(screen.getByRole("button", { name: /Update Comment/i }));
    expect(screen.getByTestId("overallComment")).toHaveTextContent(
      "Updated overall comment for review",
    );

    // Local storage updated under correct key
    const updatedSaved = localStorageGetItem<ReviewSessionMeta>(
      "review:rev-123:session",
    );
    expect(updatedSaved?.overallComment).toBe(
      "Updated overall comment for review",
    );
    expect(updatedSaved?.reviewId).toBe("rev-123");
    expect(updatedSaved?.reviewerId).toBe("user-456");

    // Clear overallComment
    fireEvent.click(screen.getByRole("button", { name: /Clear Comment/i }));
    expect(screen.getByTestId("overallComment")).toHaveTextContent("empty");
    const clearedSaved = localStorageGetItem<ReviewSessionMeta>(
      "review:rev-123:session",
    );
    expect(clearedSaved?.overallComment).toBeNull();
  });

  it("hydrates overallComment from existing valid localStorage data", () => {
    const reviewId = "rev-hydration";
    const reviewerId = "reviewer-1";
    const storedMeta: ReviewSessionMeta = {
      reviewId,
      reviewerId,
      mMSourceId: "source-hydrated",
      overallComment: "Comment restored from local storage",
    };

    // Pre-populate local storage
    localStorageSetItem(`review:${reviewId}:session`, storedMeta);

    const session: FormSession = {
      mode: "review",
      review: {
        reviewId,
        reviewerId,
        mMSourceId: "source-hydrated",
        overallComment: null, // Server initially has null
      },
      globallyReviewed: {
        personIds: [],
        organizationIds: [],
        collectionIds: [],
        pieceIds: [],
        pieceVersionIds: [],
      },
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FormSessionProvider session={session}>{children}</FormSessionProvider>
    );

    const { result } = renderHook(() => useFormSession(), { wrapper });

    if (result.current.mode !== "review") {
      throw new Error("Expected mode to be review");
    }

    expect(result.current.review.overallComment).toBe(
      "Comment restored from local storage",
    );
  });

  it("falls back to server session meta if stored localStorage data is invalid or mismatched", () => {
    const reviewId = "rev-mismatch";
    const storageKey = `review:${reviewId}:session`;

    // Stored data has mismatched reviewId / corrupted format
    localStorageSetItem(storageKey, {
      reviewId: "different-id",
      reviewerId: "different-user",
      mMSourceId: "different-source",
      overallComment: "Invalid comment",
    });

    const session: FormSession = {
      mode: "review",
      review: {
        reviewId,
        reviewerId: "user-actual",
        mMSourceId: "source-actual",
        overallComment: null,
      },
      globallyReviewed: {
        personIds: [],
        organizationIds: [],
        collectionIds: [],
        pieceIds: [],
        pieceVersionIds: [],
      },
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FormSessionProvider session={session}>{children}</FormSessionProvider>
    );

    const { result } = renderHook(() => useFormSession(), { wrapper });

    if (result.current.mode !== "review") {
      throw new Error("Expected mode to be review");
    }

    expect(result.current.review.reviewId).toBe(reviewId);
    expect(result.current.review.reviewerId).toBe("user-actual");
    expect(result.current.review.overallComment).toBeNull();

    // Local storage is now synchronized with server session
    const fixedSaved = localStorageGetItem<ReviewSessionMeta>(storageKey);
    expect(fixedSaved?.reviewId).toBe(reviewId);
    expect(fixedSaved?.reviewerId).toBe("user-actual");
  });
});
