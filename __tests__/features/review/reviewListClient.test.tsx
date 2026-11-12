import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ReviewListClient, { ToReviewItem } from "@/app/(signedIn)/review/reviewListClient";
import { GET_URL_REVIEW } from "@/utils/routes";

const mockPush = jest.fn();
const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

describe("ReviewListClient", () => {
  const sampleItem: ToReviewItem = {
    id: "src-review-1",
    title: "Beethoven Op. 1",
    composers: [
      { id: "comp-1", firstName: "Ludwig van", lastName: "Beethoven" },
    ],
    link: "https://imslp.org/wiki/test",
    permalink: "https://imslp.org/wiki/test",
    enteredBy: { id: "user-1", name: "User One", email: "user1@example.com" },
    sectionsCount: 3,
    creationDate: new Date("2024-01-01"),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it("opens confirmation modal on 'Start review' click", () => {
    render(<ReviewListClient items={[sampleItem]} />);

    const startBtn = screen.getByRole("button", { name: /start review/i });
    fireEvent.click(startBtn);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/You are about to start reviewing this MM Source/i)).toBeInTheDocument();
  });

  it("calls API and redirects to review page on successful confirmation", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reviewId: "rev-new-123" }),
    });

    render(<ReviewListClient items={[sampleItem]} />);

    fireEvent.click(screen.getByRole("button", { name: /start review/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirm/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/review/start",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mmSourceId: "src-review-1" }),
        }),
      );
    });

    expect(mockPush).toHaveBeenCalledWith(GET_URL_REVIEW("rev-new-123"));
  });

  it("displays error message inside the modal and keeps modal open when API returns 409 for self-edit", async () => {
    const errorMsg = "[review start] MM Source is currently being edited by its author";
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({ error: errorMsg }),
    });

    render(<ReviewListClient items={[sampleItem]} />);

    fireEvent.click(screen.getByRole("button", { name: /start review/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirm/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMsg)).toBeInTheDocument();
    });

    // Modal is still open
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("closes modal and clears error on Cancel click", async () => {
    const errorMsg = "[review start] MM Source is currently being edited by its author";
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({ error: errorMsg }),
    });

    render(<ReviewListClient items={[sampleItem]} />);

    fireEvent.click(screen.getByRole("button", { name: /start review/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirm/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMsg)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText(errorMsg)).not.toBeInTheDocument();
  });
});
