import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ReviewDiffModal from "@/features/review/components/ReviewDiffModal";
import { FeedFormProvider } from "@/context/feedFormContext";
import { FeedFormState } from "@/types/feedFormTypes";

const mockComputeChangedFieldPaths = jest.fn();
jest.mock("@/features/review/reviewDiff", () => ({
  ...jest.requireActual("@/features/review/reviewDiff"),
  computeChangedFieldPaths: (...args: any[]) =>
    mockComputeChangedFieldPaths(...args),
}));

describe("ReviewDiffModal", () => {
  const mockOnClose = jest.fn();

  const mockBaseline = {
    mMSourceDescription: { id: "src-1", title: "Beethoven Op. 1" },
    mMSourceContributions: [],
    mMSourceOnPieceVersions: [],
    persons: [],
    organizations: [],
    collections: [],
    pieces: [],
    pieceVersions: [],
    tempoIndications: [],
    metronomeMarks: [],
  } as unknown as FeedFormState;

  const mockInitialState = {
    ...mockBaseline,
    formInfo: { currentStepRank: 0 },
  } as unknown as FeedFormState;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not render when isOpen is false", () => {
    render(
      <FeedFormProvider
        initialState={mockInitialState}
        storageKey="test-feed-form"
      >
        <ReviewDiffModal
          isOpen={false}
          onClose={mockOnClose}
          baseline={mockBaseline}
        />
      </FeedFormProvider>,
    );

    expect(screen.queryByText(/Review Modifications/i)).not.toBeInTheDocument();
  });

  it("renders with 'No modifications detected' when diff is empty", () => {
    mockComputeChangedFieldPaths.mockReturnValue([]);

    render(
      <FeedFormProvider
        initialState={mockInitialState}
        storageKey="test-feed-form"
      >
        <ReviewDiffModal
          isOpen={true}
          onClose={mockOnClose}
          baseline={mockBaseline}
        />
      </FeedFormProvider>,
    );

    expect(screen.getByText(/Review Modifications/i)).toBeInTheDocument();
    expect(screen.getByText(/0 changed fields/i)).toBeInTheDocument();
    expect(screen.getByText(/No modifications detected/i)).toBeInTheDocument();

    const closeBtn = screen.getByRole("button", { name: "Close" });
    fireEvent.click(closeBtn);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("renders list of changed fields when diff returns items", () => {
    mockComputeChangedFieldPaths.mockReturnValue([
      {
        entityType: "MM_SOURCE",
        entityId: "src-1",
        fieldPath: "mMSourceDescription.title",
      },
      {
        entityType: "PIECE",
        entityId: "piece-1",
        fieldPath: "pieces.piece-1.title",
      },
    ]);

    render(
      <FeedFormProvider
        initialState={mockInitialState}
        storageKey="test-feed-form"
      >
        <ReviewDiffModal
          isOpen={true}
          onClose={mockOnClose}
          baseline={mockBaseline}
        />
      </FeedFormProvider>,
    );

    expect(screen.getByText(/Review Modifications/i)).toBeInTheDocument();
    expect(screen.getByText(/2 changed fields/i)).toBeInTheDocument();
    expect(screen.getByText("mMSourceDescription.title")).toBeInTheDocument();
    expect(screen.getByText("pieces.piece-1.title")).toBeInTheDocument();
    expect(screen.getByText("src-1")).toBeInTheDocument();
    expect(screen.getByText("piece-1")).toBeInTheDocument();

    const closeBtn = screen.getByRole("button", { name: "Close" });
    fireEvent.click(closeBtn);

    expect(mockOnClose).toHaveBeenCalled();
  });
});
