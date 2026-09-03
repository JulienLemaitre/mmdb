import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Intro from "@/features/feed/multiStepMMSourceForm/stepForms/Intro";
import { FormSessionProvider } from "@/context/formSessionContext";
import { FeedFormProvider, useFeedForm } from "@/context/feedFormContext";
import { FeedFormState } from "@/types/feedFormTypes";
import { FormSession } from "@/types/zodTypes";

const StateInspector = () => {
  const { state } = useFeedForm();
  return (
    <div data-testid="intro-done">
      {state.formInfo?.introDone ? "true" : "false"}
    </div>
  );
};

describe("Intro step component", () => {
  const baseInitialState = {
    mMSourceDescription: null,
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
    },
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

  it("renders standard registration content in data-entering mode", () => {
    render(
      <FormSessionProvider session={{ mode: "data-entering" }}>
        <FeedFormProvider initialState={baseInitialState} storageKey="test-intro-key">
          <Intro />
          <StateInspector />
        </FeedFormProvider>
      </FormSessionProvider>,
    );

    expect(screen.getByText("Registering new data")).toBeInTheDocument();
    expect(screen.getByText("PDF guide")).toBeInTheDocument();
    expect(screen.getByText("video tutorial")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /begin now!/i })).toBeInTheDocument();

    expect(screen.getByTestId("intro-done")).toHaveTextContent("false");

    fireEvent.click(screen.getByRole("button", { name: /begin now!/i }));
    expect(screen.getByTestId("intro-done")).toHaveTextContent("true");
  });

  it("renders review-specific content and 'Start Review' button in review mode", () => {
    render(
      <FormSessionProvider session={reviewSession}>
        <FeedFormProvider initialState={baseInitialState} storageKey="test-intro-key-2">
          <Intro />
          <StateInspector />
        </FeedFormProvider>
      </FormSessionProvider>,
    );

    expect(screen.getByText("Review Process")).toBeInTheDocument();
    expect(
      screen.getByText(
        /You are reviewing a submitted MM Source\. Inspect and adjust any fields across the steps\./i,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("PDF guide")).not.toBeInTheDocument();
    expect(screen.queryByText("video tutorial")).not.toBeInTheDocument();

    const startReviewBtn = screen.getByRole("button", { name: /start review/i });
    expect(startReviewBtn).toBeInTheDocument();

    expect(screen.getByTestId("intro-done")).toHaveTextContent("false");

    fireEvent.click(startReviewBtn);
    expect(screen.getByTestId("intro-done")).toHaveTextContent("true");
  });
});
