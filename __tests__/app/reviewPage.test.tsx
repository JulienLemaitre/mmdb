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

const mockDbReviewFindFirst = jest.fn();
jest.mock("@/utils/server/db", () => ({
  db: {
    review: {
      findFirst: (...args: any[]) => mockDbReviewFindFirst(...args),
    },
  },
}));

const mockGetToReviewFromDb = jest.fn();
jest.mock("@/utils/server/getToReviewFromDb", () => ({
  getToReviewFromDb: (...args: any[]) => mockGetToReviewFromDb(...args),
}));

jest.mock("@/app/(signedIn)/review/reviewListClient", () => {
  return function MockReviewListClient({ items }: { items: any[] }) {
    return (
      <div data-testid="review-list-client">
        Items count: {items.length}
      </div>
    );
  };
});

jest.mock("@/ui/NavBar", () => {
  return function MockNavBar({ title }: { title?: string }) {
    return <div data-testid="nav-bar">{title}</div>;
  };
});

jest.mock("@/features/review/components/ReviewHelpDrawer", () => {
  return function MockReviewHelpDrawer() {
    return <div data-testid="review-help-drawer" />;
  };
});

import ReviewListPage from "@/app/(signedIn)/review/page";

describe("ReviewListPage (app/(signedIn)/review/page.tsx)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redirects to login if user is not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);

    await expect(ReviewListPage({})).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("redirects to home if user role is not REVIEWER or ADMIN", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "user-1", role: "USER" },
    });

    await expect(ReviewListPage({})).rejects.toThrow("NEXT_REDIRECT:/");
    expect(mockRedirect).toHaveBeenCalledWith("/");
  });

  it("redirects to existing review if user already has an active review in progress", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "rev-user-1", role: "REVIEWER" },
    });
    mockDbReviewFindFirst.mockResolvedValue({ id: "active-rev-123" });

    await expect(ReviewListPage({})).rejects.toThrow(
      "NEXT_REDIRECT:/review/active-rev-123",
    );
    expect(mockRedirect).toHaveBeenCalledWith("/review/active-rev-123");
  });

  it("renders review list in production without development lock banner", async () => {
    const originalEnv = process.env.NODE_ENV;
    try {
      (process.env as any).NODE_ENV = "production";

      mockGetServerSession.mockResolvedValue({
        user: { id: "rev-user-1", role: "REVIEWER" },
      });
      mockDbReviewFindFirst.mockResolvedValue(null);
      mockGetToReviewFromDb.mockResolvedValue({
        items: [{ id: "src-1" }, { id: "src-2" }],
      });

      const page = await ReviewListPage({
        searchParams: Promise.resolve({ reason: "notOwner" }),
      });
      render(page);

      expect(
        screen.queryByText(/Review section is currently in development/i),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 1, name: "MM Sources to review" }),
      ).toBeInTheDocument();
      expect(screen.getByTestId("review-list-client")).toHaveTextContent(
        "Items count: 2",
      );
      expect(
        screen.getByText(
          "You cannot access that review. Only the assigned reviewer or an admin can open it.",
        ),
      ).toBeInTheDocument();
    } finally {
      (process.env as any).NODE_ENV = originalEnv;
    }
  });
});
