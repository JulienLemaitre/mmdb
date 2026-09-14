import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ResetSourceChanges from "@/features/feed/ResetSourceChanges";
import { FormSessionProvider } from "@/context/formSessionContext";
import { FeedFormProvider, useFeedForm } from "@/context/feedFormContext";
import { FeedFormState } from "@/types/feedFormTypes";
import { FormSession } from "@/types/zodTypes";
import {
  COLLECTION_PIECE_VERSION_FORM_LOCAL_STORAGE_KEY,
  GET_SELF_EDIT_STORAGE_KEYS,
  SINGLE_PIECE_VERSION_FORM_LOCAL_STORAGE_KEY,
} from "@/utils/constants";
import {
  localStorageGetItem,
  localStorageSetItem,
} from "@/utils/localStorage";

// Helper component to observe current feedForm state
function StateViewer() {
  const { state } = useFeedForm();
  return <div data-testid="state-title">{state.mMSourceDescription?.title}</div>;
}

describe("ResetSourceChanges", () => {
  const mockBaseline: FeedFormState = {
    mMSourceDescription: {
      id: "src-1",
      title: "Original Manuscript Title",
      type: "MANUSCRIPT",
      link: "https://imslp.org/example",
      permalink: undefined,
      year: 1820,
      isYearEstimated: false,
      comment: null,
      references: [],
    },
    mMSourceContributions: [],
    mMSourceOnPieceVersions: [],
    persons: [],
    organizations: [],
    collections: [],
    pieces: [],
    pieceVersions: [],
    tempoIndications: [],
    metronomeMarks: [],
    formInfo: {
      currentStepRank: 0,
      introDone: false,
      allSourceOnPieceVersionsDone: true,
    },
  };

  const mockInitialState: FeedFormState = {
    ...mockBaseline,
  };

  const selfEditSession: FormSession = {
    mode: "self-source-edit",
    selfEdit: {
      mMSourceId: "src-1",
      authorId: "user-123",
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
    localStorage.clear();
    jest.clearAllMocks();
  });

  it("does not render when session mode is not 'self-source-edit'", () => {
    render(
      <FormSessionProvider session={{ mode: "data-entering" }}>
        <FeedFormProvider
          initialState={mockInitialState}
          storageKey="test-key"
        >
          <ResetSourceChanges initialState={mockInitialState} />
        </FeedFormProvider>
      </FormSessionProvider>,
    );

    expect(screen.queryByText(/Reset changes/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Danger zone/i)).not.toBeInTheDocument();
  });

  it("renders Danger zone and Reset changes button in self-source-edit mode", () => {
    render(
      <FormSessionProvider session={selfEditSession}>
        <FeedFormProvider
          initialState={mockInitialState}
          storageKey={GET_SELF_EDIT_STORAGE_KEYS("src-1").feedForm}
        >
          <ResetSourceChanges initialState={mockInitialState} />
        </FeedFormProvider>
      </FormSessionProvider>,
    );

    expect(screen.getByText("Danger zone")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Reset changes" }),
    ).toBeInTheDocument();
  });

  it("opens confirmation modal when clicking Reset changes", async () => {
    render(
      <FormSessionProvider session={selfEditSession}>
        <FeedFormProvider
          initialState={mockInitialState}
          storageKey={GET_SELF_EDIT_STORAGE_KEYS("src-1").feedForm}
        >
          <ResetSourceChanges initialState={mockInitialState} />
        </FeedFormProvider>
      </FormSessionProvider>,
    );

    const resetBtn = screen.getByRole("button", { name: "Reset changes" });
    fireEvent.click(resetBtn);

    expect(await screen.findByText("Confirmation needed")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Discard all modifications made to this MM Source and restore its original data.",
      ),
    ).toBeInTheDocument();
  });

  it("closes modal without resetting when clicking Cancel in confirmation modal", async () => {
    const modifiedState: FeedFormState = {
      ...mockInitialState,
      mMSourceDescription: {
        ...mockInitialState.mMSourceDescription!,
        title: "Edited Title Before Cancel",
      },
    };

    const storageKeys = GET_SELF_EDIT_STORAGE_KEYS("src-1");
    localStorageSetItem(storageKeys.feedForm, modifiedState);

    render(
      <FormSessionProvider session={selfEditSession}>
        <FeedFormProvider
          initialState={modifiedState}
          storageKey={storageKeys.feedForm}
        >
          <ResetSourceChanges initialState={mockInitialState} />
          <StateViewer />
        </FeedFormProvider>
      </FormSessionProvider>,
    );

    expect(screen.getByTestId("state-title")).toHaveTextContent(
      "Edited Title Before Cancel",
    );

    const resetBtn = screen.getByRole("button", { name: "Reset changes" });
    fireEvent.click(resetBtn);

    const cancelBtn = await screen.findByRole("button", { name: "Cancel" });
    fireEvent.click(cancelBtn);

    // State and localStorage should remain modified
    expect(screen.getByTestId("state-title")).toHaveTextContent(
      "Edited Title Before Cancel",
    );
    expect(localStorageGetItem(storageKeys.feedForm)).toEqual(modifiedState);
  });

  it("resets state and local storage when confirming reset", async () => {
    const modifiedState: FeedFormState = {
      ...mockInitialState,
      mMSourceDescription: {
        ...mockInitialState.mMSourceDescription!,
        title: "Edited Title To Be Reset",
      },
    };

    const storageKeys = GET_SELF_EDIT_STORAGE_KEYS("src-1");
    localStorageSetItem(storageKeys.feedForm, modifiedState);
    localStorageSetItem(storageKeys.singlePieceVersionForm, { foo: "bar" });
    localStorageSetItem(storageKeys.collectionPieceVersionForm, { baz: "qux" });
    localStorageSetItem(SINGLE_PIECE_VERSION_FORM_LOCAL_STORAGE_KEY, {
      sub: "single",
    });
    localStorageSetItem(COLLECTION_PIECE_VERSION_FORM_LOCAL_STORAGE_KEY, {
      sub: "collection",
    });

    render(
      <FormSessionProvider session={selfEditSession}>
        <FeedFormProvider
          initialState={modifiedState}
          storageKey={storageKeys.feedForm}
        >
          <ResetSourceChanges initialState={mockInitialState} />
          <StateViewer />
        </FeedFormProvider>
      </FormSessionProvider>,
    );

    expect(screen.getByTestId("state-title")).toHaveTextContent(
      "Edited Title To Be Reset",
    );

    const resetBtn = screen.getByRole("button", { name: "Reset changes" });
    fireEvent.click(resetBtn);

    const confirmBtn = await screen.findByRole("button", { name: "Confirm" });
    fireEvent.click(confirmBtn);

    // Feed form state should be reverted to original
    await waitFor(() => {
      expect(screen.getByTestId("state-title")).toHaveTextContent(
        "Original Manuscript Title",
      );
    });

    // Local storage feedForm draft should be reset to initial state
    expect(localStorageGetItem(storageKeys.feedForm)).toEqual(mockInitialState);
    expect(localStorageGetItem(storageKeys.singlePieceVersionForm)).toBeNull();
    expect(
      localStorageGetItem(storageKeys.collectionPieceVersionForm),
    ).toBeNull();
    expect(
      localStorageGetItem(SINGLE_PIECE_VERSION_FORM_LOCAL_STORAGE_KEY),
    ).toBeNull();
    expect(
      localStorageGetItem(COLLECTION_PIECE_VERSION_FORM_LOCAL_STORAGE_KEY),
    ).toBeNull();

    // Session remains preserved in local storage
    expect(localStorageGetItem(storageKeys.session)).toEqual(
      selfEditSession.selfEdit,
    );
  });

  it("supports resetting when only baseline prop is provided", async () => {
    const modifiedState: FeedFormState = {
      ...mockBaseline,
      mMSourceDescription: {
        ...mockBaseline.mMSourceDescription!,
        title: "Edited Title With Baseline",
      },
    };

    const storageKeys = GET_SELF_EDIT_STORAGE_KEYS("src-1");
    localStorageSetItem(storageKeys.feedForm, modifiedState);

    render(
      <FormSessionProvider session={selfEditSession}>
        <FeedFormProvider
          initialState={modifiedState}
          storageKey={storageKeys.feedForm}
        >
          <ResetSourceChanges baseline={mockBaseline} />
          <StateViewer />
        </FeedFormProvider>
      </FormSessionProvider>,
    );

    expect(screen.getByTestId("state-title")).toHaveTextContent(
      "Edited Title With Baseline",
    );

    const resetBtn = screen.getByRole("button", { name: "Reset changes" });
    fireEvent.click(resetBtn);

    const confirmBtn = await screen.findByRole("button", { name: "Confirm" });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(screen.getByTestId("state-title")).toHaveTextContent(
        "Original Manuscript Title",
      );
    });
  });
});
