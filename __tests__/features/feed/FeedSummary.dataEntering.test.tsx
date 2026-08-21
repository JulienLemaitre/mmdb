import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import FeedSummary from "@/features/feed/multiStepMMSourceForm/stepForms/FeedSummary";
import { FormSessionProvider } from "@/context/formSessionContext";
import { FeedFormProvider } from "@/context/feedFormContext";
import { FeedFormState } from "@/types/feedFormTypes";
import { fetchAPI } from "@/utils/fetchAPI";
import { localStorageRemoveItems } from "@/utils/localStorage";

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
  localStorageRemoveItems: jest.fn(),
  purgeReviewLocalDrafts: jest.fn(),
}));

jest.mock("next-auth/react", () => ({
  useSession: () => ({
    data: {
      user: { name: "Alice", id: "user-1", accessToken: "valid-token" },
    },
  }),
}));

describe("FeedSummary - data-entering mode", () => {
  const mockState: FeedFormState = {
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

  it("renders source details and the 'Save the complete Metronome Mark Source' button", () => {
    render(
      <FormSessionProvider session={{ mode: "data-entering" }}>
        <FeedFormProvider initialState={mockState} storageKey="test-summary-de">
          <FeedSummary />
        </FeedFormProvider>
      </FormSessionProvider>,
    );

    expect(screen.getByText("Metronome Mark Source Summary")).toBeInTheDocument();
    expect(screen.getByText("Sonata No. 1")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /save the complete metronome mark source/i }),
    ).toBeInTheDocument();
  });

  it("submits to /api/feedForm, sends success email, and resets local storage on modal close", async () => {
    (fetchAPI as jest.Mock).mockResolvedValue({
      mMSourceFromDb: { id: "src-1", title: "Sonata No. 1" },
    });

    render(
      <FormSessionProvider session={{ mode: "data-entering" }}>
        <FeedFormProvider initialState={mockState} storageKey="test-summary-de">
          <FeedSummary />
        </FeedFormProvider>
      </FormSessionProvider>,
    );

    const submitBtn = screen.getByRole("button", {
      name: /save the complete metronome mark source/i,
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(fetchAPI).toHaveBeenCalledWith(
        "/api/feedForm",
        {
          body: expect.objectContaining({
            mMSourceDescription: expect.objectContaining({ id: "src-1" }),
          }),
        },
        "valid-token",
      );
    });

    // Check success email call
    await waitFor(() => {
      expect(fetchAPI).toHaveBeenCalledWith(
        "/api/sendEmail",
        {
          body: {
            type: "FeedForm SUCCESS",
            mMSourceFromDb: { id: "src-1", title: "Sonata No. 1" },
          },
        },
        "valid-token",
      );
    });

    // Check modal
    expect(
      screen.getByText(/Your Metronome Mark Source and all the related data has been saved successfully/i),
    ).toBeInTheDocument();

    const closeBtn = screen.getByRole("button", { name: /close/i });
    fireEvent.click(closeBtn);

    expect(localStorageRemoveItems).toHaveBeenCalled();
  });

  it("handles error response: sends error email, shows error modal, does NOT reset local storage", async () => {
    (fetchAPI as jest.Mock).mockResolvedValue({
      error: "Validation failed",
      status: 400,
    });

    render(
      <FormSessionProvider session={{ mode: "data-entering" }}>
        <FeedFormProvider initialState={mockState} storageKey="test-summary-de">
          <FeedSummary />
        </FeedFormProvider>
      </FormSessionProvider>,
    );

    const submitBtn = screen.getByRole("button", {
      name: /save the complete metronome mark source/i,
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(fetchAPI).toHaveBeenCalledWith(
        "/api/sendEmail",
        expect.objectContaining({
          body: expect.objectContaining({
            type: "FeedForm ERROR",
            error: "Validation failed",
          }),
        }),
        "valid-token",
      );
    });

    expect(
      screen.getByText(/Oops! Something went wrong/i),
    ).toBeInTheDocument();

    expect(localStorageRemoveItems).not.toHaveBeenCalled();
  });
});
