/** @jest-environment jsdom */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import ChecklistPage from "@/app/(signedIn)/review/[reviewId]/checklist/page";
import { buildMockOverview } from "@/features/review/reviewMock";
import { computeOverviewProgress } from "@/features/review/reviewProgress";

// Mock next/navigation hooks
jest.mock("next/navigation", () => ({
  useParams: () => ({ reviewId: "r-1" }),
  useRouter: () => ({ push: jest.fn() }),
}));

// Mock review working copy context to avoid provider requirement in the page component
const mockWorkingCopy = { graph: null as any };

// Mock review working copy context to avoid provider requirement in the page component
jest.mock("@/context/reviewWorkingCopyContext", () => ({
  ReviewWorkingCopyProvider: ({ children }: any) => children,
  useReviewWorkingCopy: () => ({
    getWorkingCopy: () => mockWorkingCopy,
    saveWorkingCopy: (g: any) => {
      mockWorkingCopy.graph = g;
    },
    clearWorkingCopy: () => {
      mockWorkingCopy.graph = null;
    },
  }),
}));

describe("ChecklistPage UI", () => {
  beforeEach(() => {
    // Clear localStorage keys used by the page
    mockWorkingCopy.graph = null;
    localStorage.clear();
  });

  it("disables submit button until required checks are completed", async () => {
    const { graph, globallyReviewed } = buildMockOverview("r-1");
    const progress = computeOverviewProgress(graph);
    // Mock fetch for overview
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        reviewId: "r-1",
        graph,
        globallyReviewed,
        sourceOnPieceVersions: graph.sourceOnPieceVersions,
        progress,
      }),
    } as any);

    render(<ChecklistPage />);

    // Wait for the page to render the submit button
    const submitBtn = await screen.findByRole("button", {
      name: /submit review/i,
    });

    // On initial render, nothing is checked, so submit must be disabled
    await waitFor(() => expect(submitBtn).toBeDisabled());
  });
});
