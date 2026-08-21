import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import AbortReviewButton from "@/features/review/components/AbortReviewButton";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockPurgeReviewLocalDrafts = jest.fn();
jest.mock("@/utils/localStorage", () => ({
  ...jest.requireActual("@/utils/localStorage"),
  purgeReviewLocalDrafts: (...args: any[]) => mockPurgeReviewLocalDrafts(...args),
}));

describe("AbortReviewButton", () => {
  const reviewId = "rev-test-123";
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("renders the abort button and opens modal on click", () => {
    render(<AbortReviewButton reviewId={reviewId} />);

    const abortBtn = screen.getByRole("button", { name: /abort review/i });
    expect(abortBtn).toBeInTheDocument();

    // Modal is not opened yet
    expect(
      screen.queryByText(/Are you sure you want to abort this review\?/i),
    ).not.toBeInTheDocument();

    // Click button to open modal
    fireEvent.click(abortBtn);

    expect(
      screen.getByText(/Are you sure you want to abort this review\?/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /confirm abort/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("closes modal on cancel without calling abort API or purging drafts", () => {
    render(<AbortReviewButton reviewId={reviewId} />);

    fireEvent.click(screen.getByRole("button", { name: /abort review/i }));
    expect(
      screen.getByText(/Are you sure you want to abort this review\?/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(
      screen.queryByText(/Are you sure you want to abort this review\?/i),
    ).not.toBeInTheDocument();
    expect(mockPurgeReviewLocalDrafts).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("purges drafts and redirects to /review on successful abort", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, reviewId }),
    });

    render(<AbortReviewButton reviewId={reviewId} />);

    fireEvent.click(screen.getByRole("button", { name: /abort review/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirm abort/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/review/${reviewId}/abort`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    });

    expect(mockPurgeReviewLocalDrafts).toHaveBeenCalledWith(reviewId);
    expect(mockPush).toHaveBeenCalledWith("/review");
  });

  it("displays error message and does NOT purge drafts or redirect when API returns an error", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({
        error: "[review abort] Forbidden: only owner or admin",
      }),
    });

    render(<AbortReviewButton reviewId={reviewId} />);

    fireEvent.click(screen.getByRole("button", { name: /abort review/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirm abort/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Forbidden: only owner or admin/i),
      ).toBeInTheDocument();
    });

    expect(mockPurgeReviewLocalDrafts).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("displays network error and does NOT purge drafts or redirect when fetch throws", async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error("Network connection lost"));

    render(<AbortReviewButton reviewId={reviewId} />);

    fireEvent.click(screen.getByRole("button", { name: /abort review/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirm abort/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Network connection lost/i),
      ).toBeInTheDocument();
    });

    expect(mockPurgeReviewLocalDrafts).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
