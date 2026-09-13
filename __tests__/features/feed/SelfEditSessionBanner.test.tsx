import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import SelfEditSessionBanner from "@/features/feed/components/SelfEditSessionBanner";
import { FormSessionProvider } from "@/context/formSessionContext";
import { FeedFormProvider } from "@/context/feedFormContext";
import { FeedFormState } from "@/types/feedFormTypes";
import { FormSession } from "@/types/zodTypes";
import { URL_DASHBOARD } from "@/utils/routes";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe("SelfEditSessionBanner", () => {
  const mockBaseline = {
    mMSourceDescription: {
      id: "src-1",
      title: "Beethoven Op. 1",
      link: "https://imslp.org/wiki/Piano_Trio_No.1,_Op.1_No.1_(Beethoven,_Ludwig_van)",
    },
    mMSourceContributions: [],
    mMSourceOnPieceVersions: [],
    persons: [{ id: "pers-1", firstName: "Ludwig van", lastName: "Beethoven" }],
    organizations: [],
    collections: [],
    pieces: [
      { id: "piece-1", composerId: "pers-1", title: "Piano Trio No. 1" },
    ],
    pieceVersions: [],
    tempoIndications: [],
    metronomeMarks: [],
  } as unknown as FeedFormState;

  const mockInitialState = {
    ...mockBaseline,
    formInfo: { currentStepRank: 0 },
  } as unknown as FeedFormState;

  const selfEditSession: FormSession = {
    mode: "self-source-edit",
    selfEdit: {
      mMSourceId: "src-1",
      authorId: "user-123",
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not render when session mode is not 'self-source-edit'", () => {
    render(
      <FormSessionProvider session={{ mode: "data-entering" }}>
        <FeedFormProvider initialState={mockInitialState} storageKey="test-key">
          <SelfEditSessionBanner baseline={mockBaseline} />
        </FeedFormProvider>
      </FormSessionProvider>,
    );

    expect(screen.queryByText(/Self-edit in progress/i)).not.toBeInTheDocument();
  });

  it("renders source details, composer, link, and disclaimer in self-source-edit mode", () => {
    render(
      <FormSessionProvider session={selfEditSession}>
        <FeedFormProvider initialState={mockInitialState} storageKey="test-key">
          <SelfEditSessionBanner
            baseline={mockBaseline}
            mMSource={{
              id: "src-1",
              title: "Beethoven Op. 1",
              link: "https://imslp.org/wiki/Piano_Trio_No.1,_Op.1_No.1_(Beethoven,_Ludwig_van)",
            }}
          />
        </FeedFormProvider>
      </FormSessionProvider>,
    );

    expect(screen.getByText(/Self-edit in progress/i)).toBeInTheDocument();
    expect(screen.getByText("Beethoven Op. 1")).toBeInTheDocument();
    expect(screen.getByText(/by Ludwig van Beethoven/i)).toBeInTheDocument();
    expect(screen.getByText(/\[Source Link]/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /You are editing your submitted MM Source. Modifications are saved in your local draft/i,
      ),
    ).toBeInTheDocument();
  });

  it("renders View Changes and Cancel & Return to Dashboard buttons", () => {
    render(
      <FormSessionProvider session={selfEditSession}>
        <FeedFormProvider initialState={mockInitialState} storageKey="test-key">
          <SelfEditSessionBanner baseline={mockBaseline} />
        </FeedFormProvider>
      </FormSessionProvider>,
    );

    expect(
      screen.getByRole("button", { name: /view changes/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /cancel & return to dashboard/i }),
    ).toBeInTheDocument();
  });

  it("opens View Changes modal when clicking the button", () => {
    render(
      <FormSessionProvider session={selfEditSession}>
        <FeedFormProvider initialState={mockInitialState} storageKey="test-key">
          <SelfEditSessionBanner baseline={mockBaseline} />
        </FeedFormProvider>
      </FormSessionProvider>,
    );

    const viewChangesBtn = screen.getByRole("button", {
      name: /view changes/i,
    });
    fireEvent.click(viewChangesBtn);

    expect(
      screen.getByText(/No modifications detected/i),
    ).toBeInTheDocument();

    const closeBtn = screen.getByRole("button", { name: "Close" });
    fireEvent.click(closeBtn);

    expect(
      screen.queryByText(/No modifications detected/i),
    ).not.toBeInTheDocument();
  });

  it("displays diff in modal when working state is modified compared to baseline", () => {
    const modifiedState = {
      ...mockInitialState,
      mMSourceDescription: {
        ...mockInitialState.mMSourceDescription,
        title: "Beethoven Op. 1 (Revised Edition)",
      },
    } as unknown as FeedFormState;

    render(
      <FormSessionProvider session={selfEditSession}>
        <FeedFormProvider initialState={modifiedState} storageKey="test-key">
          <SelfEditSessionBanner baseline={mockBaseline} />
        </FeedFormProvider>
      </FormSessionProvider>,
    );

    const viewChangesBtn = screen.getByRole("button", {
      name: /view changes/i,
    });
    fireEvent.click(viewChangesBtn);

    expect(
      screen.queryByText(/No modifications detected/i),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/MM Source/i)).toBeInTheDocument();
  });

  it("opens confirmation modal on Cancel and navigates to dashboard when confirmed", () => {
    render(
      <FormSessionProvider session={selfEditSession}>
        <FeedFormProvider initialState={mockInitialState} storageKey="test-key">
          <SelfEditSessionBanner baseline={mockBaseline} />
        </FeedFormProvider>
      </FormSessionProvider>,
    );

    const cancelBtn = screen.getByRole("button", {
      name: /cancel & return to dashboard/i,
    });
    fireEvent.click(cancelBtn);

    expect(screen.getByText(/Leave Editing Session\?/i)).toBeInTheDocument();

    const stayBtn = screen.getByRole("button", { name: /stay/i });
    fireEvent.click(stayBtn);
    expect(screen.queryByText(/Leave Editing Session\?/i)).not.toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();

    fireEvent.click(cancelBtn);
    const returnBtn = screen.getByRole("button", {
      name: /^return to dashboard$/i,
    });
    fireEvent.click(returnBtn);
    expect(mockPush).toHaveBeenCalledWith(URL_DASHBOARD);
  });
});
