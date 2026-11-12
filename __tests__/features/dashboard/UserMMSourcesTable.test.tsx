import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import UserMMSourcesTable, { UserMMSourceItem } from "@/features/dashboard/UserMMSourcesTable";
import { purgeSelfEditLocalDrafts } from "@/utils/localStorage";
import { GET_URL_SOURCE_EDIT } from "@/utils/routes";

const mockPush = jest.fn();
const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

jest.mock("@/utils/localStorage", () => ({
  purgeSelfEditLocalDrafts: jest.fn(),
}));

describe("UserMMSourcesTable", () => {
  const pendingItem: UserMMSourceItem = {
    source: {
      id: "src-pending",
      title: "Beethoven Op. 1",
      year: 1795,
      reviewState: "PENDING",
      createdAt: new Date("2024-01-01"),
      pieceVersions: [],
      metronomeMarks: [],
    } as any,
    hasActiveReview: false,
  };

  const selfEditItem: UserMMSourceItem = {
    source: {
      id: "src-self-edit",
      title: "Mozart K. 331",
      year: 1783,
      reviewState: "IN_SELF_EDIT",
      createdAt: new Date("2024-02-01"),
      pieceVersions: [],
      metronomeMarks: [],
    } as any,
    hasActiveReview: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it("renders 'In Self-Edit' badge when reviewState is IN_SELF_EDIT", () => {
    render(<UserMMSourcesTable items={[selfEditItem]} tempoIndications={[]} />);

    expect(screen.getByText("In Self-Edit")).toBeInTheDocument();
  });

  it("renders 'Resume Edit' and 'Abandon Edit' buttons when in self-edit", () => {
    render(<UserMMSourcesTable items={[selfEditItem]} tempoIndications={[]} />);

    expect(
      screen.getByRole("button", { name: /resume edit/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /abandon edit/i }),
    ).toBeInTheDocument();
  });

  it("navigates directly to edit page on 'Resume Edit' click without re-locking", () => {
    render(<UserMMSourcesTable items={[selfEditItem]} tempoIndications={[]} />);

    const resumeBtn = screen.getByRole("button", { name: /resume edit/i });
    fireEvent.click(resumeBtn);

    expect(mockPush).toHaveBeenCalledWith(GET_URL_SOURCE_EDIT("src-self-edit"));
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("opens confirmation modal on 'Abandon Edit' and calls abort API and purge on confirm", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, mMSourceId: "src-self-edit" }),
    });

    render(<UserMMSourcesTable items={[selfEditItem]} tempoIndications={[]} />);

    const abandonBtn = screen.getByRole("button", { name: /abandon edit/i });
    fireEvent.click(abandonBtn);

    expect(screen.getByText(/Abandon Self-Edit\?/i)).toBeInTheDocument();

    const confirmAbandonBtn = screen.getByRole("button", {
      name: /^confirm abandon$/i,
    });
    fireEvent.click(confirmAbandonBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/source/src-self-edit/edit/abort",
        expect.objectContaining({ method: "POST" }),
      );
    });

    expect(purgeSelfEditLocalDrafts).toHaveBeenCalledWith("src-self-edit");
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("calls start edit API when clicking 'Continue to Edit' in the edit confirmation modal", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        mMSourceId: "src-pending",
        status: "locked",
      }),
    });

    render(<UserMMSourcesTable items={[pendingItem]} tempoIndications={[]} />);

    const editBtn = screen.getByRole("button", { name: /edit source/i });
    fireEvent.click(editBtn);

    const continueBtn = screen.getByRole("button", {
      name: /continue to edit/i,
    });
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/source/src-pending/edit/start",
        expect.objectContaining({ method: "POST" }),
      );
    });

    expect(mockPush).toHaveBeenCalledWith(GET_URL_SOURCE_EDIT("src-pending"));
  });

  it("displays error message and does not redirect when start edit API fails (409)", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({
        error:
          "A review is currently in progress on this MM Source",
      }),
    });

    render(<UserMMSourcesTable items={[pendingItem]} tempoIndications={[]} />);

    const editBtn = screen.getByRole("button", { name: /edit source/i });
    fireEvent.click(editBtn);

    const continueBtn = screen.getByRole("button", {
      name: /continue to edit/i,
    });
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/A review is currently in progress on this MM Source/i),
      ).toBeInTheDocument();
    });

    expect(mockPush).not.toHaveBeenCalled();
  });
});
