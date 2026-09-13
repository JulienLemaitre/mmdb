import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import FeedSummary from "@/features/feed/multiStepMMSourceForm/stepForms/FeedSummary";
import { FormSessionProvider } from "@/context/formSessionContext";
import { FeedFormProvider } from "@/context/feedFormContext";
import { FeedFormState } from "@/types/feedFormTypes";
import { FormSession } from "@/types/zodTypes";
import { fetchAPI } from "@/utils/fetchAPI";
import { purgeSelfEditLocalDrafts } from "@/utils/localStorage";

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
  purgeSelfEditLocalDrafts: jest.fn(),
  localStorageRemoveItems: jest.fn(),
}));

jest.mock("next-auth/react", () => ({
  useSession: () => ({
    data: {
      user: {
        name: "Alice Author",
        id: "author-user-1",
        accessToken: "valid-token",
      },
    },
  }),
}));

describe("FeedSummary - self-source-edit mode", () => {
  const completeSelfEditState: FeedFormState = {
    mMSourceDescription: {
      id: "src-1",
      title: "Sonata No. 1",
      type: "EDITION",
      year: 1801,
      isYearEstimated: false,
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
      {
        id: "pers-1",
        firstName: "Ludwig van",
        lastName: "Beethoven",
        birthYear: 1876,
        deathYear: null,
      },
    ],
    organizations: [],
    collections: [],
    pieces: [{ id: "p-1", composerId: "pers-1", title: "Sonata No. 1" }],
    pieceVersions: [
      {
        id: "pv-1",
        pieceId: "p-1",
        category: "KEYBOARD",
        movements: [
          {
            id: "m-1",
            rank: 1,
            key: "C_MAJOR",
            sections: [
              {
                id: "s-1",
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
    tempoIndications: [{ id: "ti-1", text: "Allegro" }],
    metronomeMarks: [
      {
        id: "mm-1",
        sectionId: "s-1",
        beatUnit: "QUARTER",
        bpm: 120,
        noMM: false,
        pieceVersionId: "pv-1",
      },
    ],
    formInfo: {
      currentStepRank: 4,
      allSourceOnPieceVersionsDone: true,
      introDone: true,
    },
  };

  const selfEditSession: FormSession = {
    mode: "self-source-edit",
    selfEdit: {
      mMSourceId: "src-1",
      authorId: "author-user-1",
    },
  };

  beforeAll(() => {
    HTMLDialogElement.prototype.showModal = jest.fn(function (
      this: HTMLDialogElement,
    ) {
      this.setAttribute("open", "");
    });
    HTMLDialogElement.prototype.close = jest.fn(function (
      this: HTMLDialogElement,
    ) {
      this.removeAttribute("open");
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function renderFeedSummary(initialState = completeSelfEditState) {
    return render(
      <FormSessionProvider session={selfEditSession}>
        <FeedFormProvider
          storageKey="selfEdit:src-1:feedForm"
          initialState={initialState}
        >
          <FeedSummary />
        </FeedFormProvider>
      </FormSessionProvider>,
    );
  }

  it("renders Save Modifications button label", () => {
    renderFeedSummary();
    expect(
      screen.getByRole("button", { name: "Save Modifications" }),
    ).toBeInTheDocument();
  });

  it("opens confirmation modal when clicking Save Modifications", async () => {
    renderFeedSummary();
    const saveBtn = screen.getByRole("button", { name: "Save Modifications" });
    fireEvent.click(saveBtn);

    expect(
      await screen.findByText("Confirm Modifications"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Are you sure you want to save these modifications to your MM Source/,
      ),
    ).toBeInTheDocument();
  });

  it("calls edit API, purges drafts and redirects on confirmation", async () => {
    (fetchAPI as jest.Mock).mockResolvedValueOnce({
      success: true,
      mMSourceId: "src-1",
    });

    renderFeedSummary();
    const saveBtn = screen.getByRole("button", { name: "Save Modifications" });
    fireEvent.click(saveBtn);

    const confirmBtn = await screen.findByRole("button", {
      name: "Confirm and Save",
    });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(fetchAPI).toHaveBeenCalledWith(
        "/api/source/src-1/edit",
        expect.objectContaining({
          body: expect.objectContaining({
            feedFormState: expect.any(Object),
          }),
        }),
        "valid-token",
      );
    });

    await waitFor(() => {
      expect(purgeSelfEditLocalDrafts).toHaveBeenCalledWith("src-1");
    });
  });

  it("handles 409 conflict error when review has started concurrently", async () => {
    (fetchAPI as jest.Mock).mockResolvedValueOnce({
      error:
        "A review has started on this MM Source. Modifications are blocked.",
    });

    renderFeedSummary();
    const saveBtn = screen.getByRole("button", { name: "Save Modifications" });
    fireEvent.click(saveBtn);

    const confirmBtn = await screen.findByRole("button", {
      name: "Confirm and Save",
    });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(purgeSelfEditLocalDrafts).not.toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(
        screen.getByText(
          /A review has started on this MM Source\. Modifications are blocked\./,
        ),
      ).toBeInTheDocument();
    });
  });
});
