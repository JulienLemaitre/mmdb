import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

const mockRedirect = jest.fn();
jest.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mockRedirect(url);
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));

const mockGetServerSession = jest.fn();
jest.mock("next-auth", () => ({
  getServerSession: (...args: any[]) => mockGetServerSession(...args),
}));

const mockGetReviewBaseline = jest.fn();
const mockBuildReviewInitialFeedFormState = jest.fn();
jest.mock("@/utils/server/getReviewBaseline", () => ({
  getReviewBaseline: (...args: any[]) => mockGetReviewBaseline(...args),
  buildReviewInitialFeedFormState: (...args: any[]) =>
    mockBuildReviewInitialFeedFormState(...args),
}));

// Mock FeedFormShell to keep layout test focused and light
jest.mock("@/features/feed/FeedFormShell", () => {
  return function MockFeedFormShell({
    children,
    title,
  }: {
    children: React.ReactNode;
    title?: string;
  }) {
    return (
      <div data-testid="feed-form-shell" data-title={title}>
        {children}
      </div>
    );
  };
});

import ReviewLayout from "@/app/(signedIn)/review/[reviewId]/layout";
import { REVIEW_STATE } from "@/prisma/client/enums";

describe("ReviewLayout (app/(signedIn)/review/[reviewId]/layout.tsx)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redirects to login if user is not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);

    await expect(
      ReviewLayout({
        children: <div>Child</div>,
        params: Promise.resolve({ reviewId: "rev-1" }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/login?reason=unauthorized");

    expect(mockRedirect).toHaveBeenCalledWith("/login?reason=unauthorized");
  });

  it("redirects to home if user role is not REVIEWER or ADMIN", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "user-1", role: "USER" },
    });

    await expect(
      ReviewLayout({
        children: <div>Child</div>,
        params: Promise.resolve({ reviewId: "rev-1" }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/");

    expect(mockRedirect).toHaveBeenCalledWith("/");
  });

  it("redirects with reason=notFound if reviewId is missing", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "user-1", role: "REVIEWER" },
    });

    await expect(
      ReviewLayout({
        children: <div>Child</div>,
        params: Promise.resolve({ reviewId: "" }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/review?reason=notFound");

    expect(mockRedirect).toHaveBeenCalledWith("/review?reason=notFound");
  });

  it("redirects with reason=notOwner if reviewer is not the review owner", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "reviewer-2", role: "REVIEWER" },
    });
    mockGetReviewBaseline.mockRejectedValue(
      new Error(
        "[getReviewBaseline] Forbidden: only review owner can access this review baseline",
      ),
    );

    await expect(
      ReviewLayout({
        children: <div>Child</div>,
        params: Promise.resolve({ reviewId: "rev-1" }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/review?reason=notOwner");

    expect(mockRedirect).toHaveBeenCalledWith("/review?reason=notOwner");
  });

  it("redirects with reason=notActive if review is not IN_REVIEW (e.g. APPROVED)", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "reviewer-1", role: "REVIEWER" },
    });
    mockGetReviewBaseline.mockRejectedValue(
      new Error("[getReviewBaseline] Review must be IN_REVIEW"),
    );

    await expect(
      ReviewLayout({
        children: <div>Child</div>,
        params: Promise.resolve({ reviewId: "rev-1" }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/review?reason=notActive");

    expect(mockRedirect).toHaveBeenCalledWith("/review?reason=notActive");
  });

  it("redirects with reason=notFound if review does not exist", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "reviewer-1", role: "REVIEWER" },
    });
    mockGetReviewBaseline.mockRejectedValue(
      new Error("[getReviewBaseline] Review not found"),
    );

    await expect(
      ReviewLayout({
        children: <div>Child</div>,
        params: Promise.resolve({ reviewId: "rev-nonexistent" }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/review?reason=notFound");

    expect(mockRedirect).toHaveBeenCalledWith("/review?reason=notFound");
  });

  it("mounts FormSessionProvider and FeedFormProvider with review baseline and renders children", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "reviewer-1", role: "REVIEWER" },
    });

    const mockBaseline = {
      mMSourceDescription: { id: "src-1", title: "Beethoven Op. 1" },
    };
    const mockGloballyReviewed = {
      personIds: ["p1"],
      organizationIds: [],
      collectionIds: [],
      pieceIds: [],
      pieceVersionIds: [],
    };

    mockGetReviewBaseline.mockResolvedValue({
      review: {
        id: "rev-1",
        creatorId: "reviewer-1",
        state: REVIEW_STATE.IN_REVIEW,
        mMSourceId: "src-1",
      },
      mMSource: { id: "src-1", title: "Beethoven Op. 1" },
      baseline: mockBaseline,
      globallyReviewed: mockGloballyReviewed,
    });

    mockBuildReviewInitialFeedFormState.mockReturnValue({
      mMSourceDescription: { id: "src-1", title: "Beethoven Op. 1" },
      formInfo: { currentStepRank: 0 },
    });

    const jsx = await ReviewLayout({
      children: <div data-testid="review-page-content">Review Form Content</div>,
      params: Promise.resolve({ reviewId: "rev-1" }),
    });

    render(jsx);

    expect(screen.getByTestId("feed-form-shell")).toBeInTheDocument();
    expect(screen.getByTestId("feed-form-shell")).toHaveAttribute(
      "data-title",
      "Review: Beethoven Op. 1",
    );
    expect(screen.getByTestId("review-page-content")).toHaveTextContent(
      "Review Form Content",
    );
    expect(mockBuildReviewInitialFeedFormState).toHaveBeenCalledWith({
      baseline: mockBaseline,
      globallyReviewed: mockGloballyReviewed,
    });
  });
});
