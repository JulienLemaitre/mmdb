import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import FeedSummary from "@/features/feed/multiStepMMSourceForm/stepForms/FeedSummary";
import { FormSessionProvider } from "@/context/formSessionContext";
import { FeedFormProvider } from "@/context/feedFormContext";
import { FeedFormState } from "@/types/feedFormTypes";
import { FormSession } from "@/types/zodTypes";
import { fetchAPI } from "@/utils/fetchAPI";
import { purgeReviewLocalDrafts } from "@/utils/localStorage";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("@/utils/fetchAPI", () => ({
  fetchAPI: jest.fn(),
}));

jest.mock("@/utils/localStorage", () => ({
  ...jest.requireActual("@/utils/localStorage"),
  purgeReviewLocalDrafts: jest.fn(),
  localStorageRemoveItems: jest.fn(),
}));

jest.mock("next-auth/react", () => ({
  useSession: () => ({
    data: {
      user: { name: "Bob Reviewer", id: "rev-user-1", accessToken: "valid-token" },
    },
  }),
}));

describe("FeedSummary - review mode", () => {
  const completeReviewState: FeedFormState = {
    mMSourceDescription: {
      id: "src-1",
      title: "Sonata No. 1",
      type: "EDITION",
      year: 1801,
      link: "https://imslp.org/wiki/Sonata",
      references: [{ type: "PLATE_NUMBER", reference: "PN-123" }],
    },
    mMSourceContributions: [
      {
        personId: "pers-1",
        role: "EDITOR",
      },
    ],
    mMSourceOnPieceVersions: [
      {
        pieceVersionId: "pv-1",
        rank: 1,
      },
    ],
    persons: [
      { id: "pers-1", firstName: "Ludwig van", lastName: "Beethoven" },
    ],
    organizations: [],
    collections: [],
    pieces: [
      { id: "p-1", composerId: "pers-1", title: "Sonata No. 1" },
    ],
    pieceVersions: [
      {
        id: "pv-1",
        pieceId: "p-1",
        category: "ORIGINAL",
        movements: [
          {
            id: "m-1",
            pieceVersionId: "pv-1",
            rank: 1,
            key: "C_MAJOR",
            sections: [
              {
                id: "s-1",
                movementId: "m-1",
                rank: 1,
                tempoIndicationId: "ti-1",
                fastestStructuralNotesPerBar: 16,
                metreNumerator: 4,
                metreDenominator: 4,
              },
            ],
          },
        ],
      },
    ],
    movements: [
      { id: "m-1", pieceVersionId: "pv-1", rank: 1, key: "C_MAJOR" },
    ],
    sections: [
      {
        id: "s-1",
        movementId: "m-1",
        rank: 1,
        tempoIndicationId: "ti-1",
        fastestStructuralNotesPerBar: 16,
        metreNumerator: 4,
        metreDenominator: 4,
      },
    ],
    tempoIndications: [
      { id: "ti-1", text: "Allegro" },
    ],
    metronomeMarks: [
      { id: "mm-1", sectionId: "s-1", beatUnit: "QUARTER", bpm: 120, noMM: false },
    ],
    formInfo: {
      currentStepRank: 5,
      introDone: true,
      allSourceOnPieceVersionsDone: true,
    },
  } as unknown as FeedFormState;

  const incompleteReviewState: FeedFormState = {
    ...completeReviewState,
    formInfo: {
      currentStepRank: 5,
      introDone: false, // Incomplete intro step
      allSourceOnPieceVersionsDone: true,
    },
  } as unknown as FeedFormState;

  const reviewSession: FormSession = {
    mode: "review",
    review: {
      reviewId: "rev-456",
      reviewerId: "rev-user-1",
      mMSourceId: "src-1",
      overallComment: "Great submission, verified against manuscript.",
    },
    globallyReviewed: {
      personIds: [],
      organizationIds: [],
      collectionIds: [],
      pieceIds: [],
      pieceVersionIds: [],
    },
  };

  beforeAll(() => {
    HTMLDialogElement.prototype.showModal = jest.fn(function (this: HTMLDialogElement) {
      this.setAttribute("open", "");
    });
    HTMLDialogElement.prototype.close = jest.fn(function (this: HTMLDialogElement) {
      this.removeAttribute("open");
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("disables the submit button if any step is incomplete", () => {
    render(
      <FormSessionProvider session={reviewSession}>
        <FeedFormProvider initialState={incompleteReviewState} storageKey="test-summary-rev-1">
          <FeedSummary />
        </FeedFormProvider>
      </FormSessionProvider>,
    );

    const submitBtn = screen.getByRole("button", {
      name: /approve and submit review/i,
    });
    expect(submitBtn).toBeInTheDocument();
    expect(submitBtn).toBeDisabled();
  });

  it("enables the submit button when all steps are complete", () => {
    render(
      <FormSessionProvider session={reviewSession}>
        <FeedFormProvider initialState={completeReviewState} storageKey="test-summary-rev-2">
          <FeedSummary />
        </FeedFormProvider>
      </FormSessionProvider>,
    );

    const submitBtn = screen.getByRole("button", {
      name: /approve and submit review/i,
    });
    expect(submitBtn).toBeInTheDocument();
    expect(submitBtn).not.toBeDisabled();
  });

  it("opens confirmation modal upon clicking submit button and cancels properly", () => {
    render(
      <FormSessionProvider session={reviewSession}>
        <FeedFormProvider initialState={completeReviewState} storageKey="test-summary-rev-3">
          <FeedSummary />
        </FeedFormProvider>
      </FormSessionProvider>,
    );

    const submitBtn = screen.getByRole("button", {
      name: /approve and submit review/i,
    });
    fireEvent.click(submitBtn);

    expect(screen.getByText("Confirm Review Approval")).toBeInTheDocument();
    expect(
      screen.getByText(/Are you sure you want to approve and submit this review\?/i),
    ).toBeInTheDocument();

    const cancelBtn = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(cancelBtn);

    expect(fetchAPI).not.toHaveBeenCalled();
    expect(purgeReviewLocalDrafts).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("submits to /api/review/[reviewId]/submit with correct payload, purges drafts, and redirects on success", async () => {
    (fetchAPI as jest.Mock).mockResolvedValue({
      ok: true,
      reviewId: "rev-456",
    });

    render(
      <FormSessionProvider session={reviewSession}>
        <FeedFormProvider initialState={completeReviewState} storageKey="test-summary-rev-4">
          <FeedSummary />
        </FeedFormProvider>
      </FormSessionProvider>,
    );

    const submitBtn = screen.getByRole("button", {
      name: /approve and submit review/i,
    });
    fireEvent.click(submitBtn);

    const confirmBtn = screen.getByRole("button", { name: /confirm and submit/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(fetchAPI).toHaveBeenCalledWith(
        "/api/review/rev-456/submit",
        {
          body: {
            feedFormState: expect.objectContaining({
              mMSourceDescription: expect.objectContaining({ id: "src-1" }),
            }),
            overallComment: "Great submission, verified against manuscript.",
          },
        },
        "valid-token",
      );
    });

    expect(purgeReviewLocalDrafts).toHaveBeenCalledWith("rev-456");

    await waitFor(() => {
      expect(
        screen.getByText(/The review has been approved and submitted successfully/i),
      ).toBeInTheDocument();
    });

    const modalTitle = screen.getByRole("heading", { level: 3, name: /success/i });
    expect(modalTitle).toBeInTheDocument();
    expect(modalTitle).toHaveClass("text-success");
    expect(screen.queryByRole("heading", { level: 3, name: /error/i })).not.toBeInTheDocument();

    const closeBtn = await screen.findByRole("button", { name: "Close" });
    fireEvent.click(closeBtn);

    expect(mockPush).toHaveBeenCalledWith("/review");
    // Verify modal retains success status and does not flash error styling or copy
    expect(screen.queryByRole("heading", { level: 3, name: /error/i })).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Oops! Something went wrong/i),
    ).not.toBeInTheDocument();
  });

  it("handles server error: shows error message, does NOT purge drafts, does NOT redirect", async () => {
    (fetchAPI as jest.Mock).mockResolvedValue({
      error: "Concurrent review modification detected",
      status: 409,
    });

    render(
      <FormSessionProvider session={reviewSession}>
        <FeedFormProvider initialState={completeReviewState} storageKey="test-summary-rev-5">
          <FeedSummary />
        </FeedFormProvider>
      </FormSessionProvider>,
    );

    const submitBtn = screen.getByRole("button", {
      name: /approve and submit review/i,
    });
    fireEvent.click(submitBtn);

    const confirmBtn = screen.getByRole("button", { name: /confirm and submit/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Concurrent review modification detected/i),
      ).toBeInTheDocument();
    });

    const modalTitle = screen.getByRole("heading", { level: 3, name: /error/i });
    expect(modalTitle).toBeInTheDocument();
    expect(modalTitle).toHaveClass("text-error");

    expect(purgeReviewLocalDrafts).not.toHaveBeenCalled();

    const closeBtn = await screen.findByRole("button", { name: "Close" });
    fireEvent.click(closeBtn);

    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.queryByRole("heading", { level: 3, name: /success/i })).not.toBeInTheDocument();
  });
});
