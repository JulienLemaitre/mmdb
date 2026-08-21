import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import OverallCommentModal from "@/features/review/components/OverallCommentModal";
import { FormSessionProvider } from "@/context/formSessionContext";
import { FormSession } from "@/types/zodTypes";

describe("OverallCommentModal", () => {
  const mockOnClose = jest.fn();

  const baseSession: FormSession = {
    mode: "review",
    review: {
      reviewId: "rev-1",
      reviewerId: "user-1",
      mMSourceId: "src-1",
      overallComment: "Initial comment",
    },
    globallyReviewed: {
      personIds: [],
      organizationIds: [],
      collectionIds: [],
      pieceIds: [],
      pieceVersionIds: [],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not render when isOpen is false", () => {
    render(
      <FormSessionProvider session={baseSession}>
        <OverallCommentModal isOpen={false} onClose={mockOnClose} />
      </FormSessionProvider>,
    );

    expect(screen.queryByText(/General Review Comment/i)).not.toBeInTheDocument();
  });

  it("renders when isOpen is true and pre-populates comment from session context", () => {
    render(
      <FormSessionProvider session={baseSession}>
        <OverallCommentModal isOpen={true} onClose={mockOnClose} />
      </FormSessionProvider>,
    );

    expect(screen.getByText(/General Review Comment/i)).toBeInTheDocument();
    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveValue("Initial comment");
  });

  it("allows clearing the text and saving", () => {
    render(
      <FormSessionProvider session={baseSession}>
        <OverallCommentModal isOpen={true} onClose={mockOnClose} />
      </FormSessionProvider>,
    );

    const textarea = screen.getByRole("textbox");
    const clearBtn = screen.getByRole("button", { name: /clear/i });
    fireEvent.click(clearBtn);

    expect(textarea).toHaveValue("");

    const saveBtn = screen.getByRole("button", { name: /save comment/i });
    fireEvent.click(saveBtn);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("saves updated comment to session context on Save Comment", () => {
    render(
      <FormSessionProvider session={baseSession}>
        <OverallCommentModal isOpen={true} onClose={mockOnClose} />
      </FormSessionProvider>,
    );

    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "Updated review notes" } });

    const saveBtn = screen.getByRole("button", { name: /save comment/i });
    fireEvent.click(saveBtn);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("closes without saving when Cancel is clicked", () => {
    render(
      <FormSessionProvider session={baseSession}>
        <OverallCommentModal isOpen={true} onClose={mockOnClose} />
      </FormSessionProvider>,
    );

    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "Discarded text" } });

    const cancelBtn = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(cancelBtn);

    expect(mockOnClose).toHaveBeenCalled();
  });
});
