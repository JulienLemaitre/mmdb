import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ReviewSessionBanner from "@/features/review/components/ReviewSessionBanner";
import { FormSessionProvider } from "@/context/formSessionContext";
import { FeedFormProvider } from "@/context/feedFormContext";
import { FeedFormState } from "@/types/feedFormTypes";
import { FormSession } from "@/types/zodTypes";

// Mock next/navigation for AbortReviewButton
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe("ReviewSessionBanner", () => {
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

  const reviewSession: FormSession = {
    mode: "review",
    review: {
      reviewId: "rev-123",
      reviewerId: "user-456",
      mMSourceId: "src-1",
      overallComment: "My review comment",
    },
    globallyReviewed: {
      personIds: [],
      organizationIds: [],
      collectionIds: [],
      pieceIds: [],
      pieceVersionIds: [],
    },
  };

  it("does not render when session mode is not 'review'", () => {
    render(
      <FormSessionProvider session={{ mode: "data-entering" }}>
        <FeedFormProvider initialState={mockInitialState} storageKey="test-key">
          <ReviewSessionBanner baseline={mockBaseline} />
        </FeedFormProvider>
      </FormSessionProvider>,
    );

    expect(screen.queryByText(/Review in progress/i)).not.toBeInTheDocument();
  });

  it("renders source details, composer, link, and disclaimer in review mode", () => {
    render(
      <FormSessionProvider session={reviewSession}>
        <FeedFormProvider initialState={mockInitialState} storageKey="test-key">
          <ReviewSessionBanner
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

    expect(screen.getByText(/Review in progress/i)).toBeInTheDocument();
    expect(screen.getByText("Beethoven Op. 1")).toBeInTheDocument();
    expect(screen.getByText(/by Ludwig van Beethoven/i)).toBeInTheDocument();
    expect(screen.getByText(/\[Source Link]/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Modifications are saved in your local draft and will only be applied/i,
      ),
    ).toBeInTheDocument();
  });

  it("opens View Changes modal when clicking the button", () => {
    render(
      <FormSessionProvider session={reviewSession}>
        <FeedFormProvider initialState={mockInitialState} storageKey="test-key">
          <ReviewSessionBanner baseline={mockBaseline} />
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
  });

  it("opens General Comment modal when clicking the button", () => {
    render(
      <FormSessionProvider session={reviewSession}>
        <FeedFormProvider initialState={mockInitialState} storageKey="test-key">
          <ReviewSessionBanner baseline={mockBaseline} />
        </FeedFormProvider>
      </FormSessionProvider>,
    );

    const commentBtn = screen.getByRole("button", { name: /general comment/i });
    fireEvent.click(commentBtn);

    expect(screen.getByText(/General Review Comment/i)).toBeInTheDocument();
  });

  it("renders Abort Review button", () => {
    render(
      <FormSessionProvider session={reviewSession}>
        <FeedFormProvider initialState={mockInitialState} storageKey="test-key">
          <ReviewSessionBanner baseline={mockBaseline} />
        </FeedFormProvider>
      </FormSessionProvider>,
    );

    expect(
      screen.getByRole("button", { name: /abort review/i }),
    ).toBeInTheDocument();
  });
});
