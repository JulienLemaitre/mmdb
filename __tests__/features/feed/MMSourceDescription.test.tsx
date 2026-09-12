import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import MMSourceDescription from "@/features/feed/multiStepMMSourceForm/stepForms/MMSourceDescription";
import { FormSessionProvider } from "@/context/formSessionContext";
import { FeedFormProvider } from "@/context/feedFormContext";
import { FeedFormState } from "@/types/feedFormTypes";
import { FormSession } from "@/types/zodTypes";

// Mock SourceDescriptionEditForm to inspect received props
jest.mock(
  "@/features/sourceDescription/SourceDescriptionEditForm",
  () => {
    return function MockSourceDescriptionEditForm(props: any) {
      return (
        <div data-testid="source-description-edit-form">
          <span data-testid="is-review-mode">
            {props.isReviewMode ? "true" : "false"}
          </span>
          <span data-testid="submit-title">{props.submitTitle}</span>
        </div>
      );
    };
  },
);

jest.mock("@/features/feed/multiStepMMSourceForm/stepsUtils", () => ({
  steps: [
    {
      rank: 0,
      id: "intro",
      actionTypes: ["formInfo"],
      title: "Intro",
      isComplete: () => true,
    },
    {
      rank: 1,
      id: "mMSourceDescription",
      actionTypes: ["mMSourceDescription"],
      title: "MM Source description",
      isComplete: () => false,
    },
  ],
  getStepByRank: jest.fn(() => ({
    rank: 1,
    id: "mMSourceDescription",
    title: "MM Source description",
    isComplete: () => false,
  })),
}));

describe("MMSourceDescription step container", () => {
  const baseInitialState = {
    mMSourceDescription: {
      id: "src-1",
      title: "Score Title",
      type: "EDITION",
      link: "https://imslp.org/wiki/Special:ImagefromIndex/12345",
      year: 1850,
      isYearEstimated: false,
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
      currentStepRank: 1,
      introDone: true,
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

  it("passes isReviewMode=false when in data-entering mode", () => {
    render(
      <FormSessionProvider session={{ mode: "data-entering" }}>
        <FeedFormProvider
          initialState={baseInitialState}
          storageKey="test-mmsource-desc-key-1"
        >
          <MMSourceDescription />
        </FeedFormProvider>
      </FormSessionProvider>,
    );

    expect(screen.getByTestId("is-review-mode")).toHaveTextContent("false");
  });

  it("passes isReviewMode=true when in review mode", () => {
    render(
      <FormSessionProvider session={reviewSession}>
        <FeedFormProvider
          initialState={baseInitialState}
          storageKey="test-mmsource-desc-key-2"
        >
          <MMSourceDescription />
        </FeedFormProvider>
      </FormSessionProvider>,
    );

    expect(screen.getByTestId("is-review-mode")).toHaveTextContent("true");
  });
});
