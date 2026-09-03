import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ReviewDiffModal from "@/features/review/components/ReviewDiffModal";
import { FeedFormProvider } from "@/context/feedFormContext";
import { FormSessionProvider } from "@/context/formSessionContext";
import { FeedFormState } from "@/types/feedFormTypes";
import { FormSession } from "@/types/zodTypes";
import { buildMockFeedFormState } from "@/features/review/reviewMock";

const mockComposeAuditEntries = jest.fn();
jest.mock("@/features/review/utils/auditCompose", () => {
  const actual = jest.requireActual("@/features/review/utils/auditCompose");
  return {
    ...actual,
    composeAuditEntries: (...args: any[]) =>
      mockComposeAuditEntries(...args),
  };
});

function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

describe("ReviewDiffModal", () => {
  const mockOnClose = jest.fn();

  const reviewSession: FormSession = {
    mode: "review",
    review: {
      reviewId: "rev-123",
      reviewerId: "user-456",
      mMSourceId: "src-1",
      overallComment: null,
    },
    globallyReviewed: {
      personIds: [],
      organizationIds: [],
      collectionIds: [],
      pieceIds: [],
      pieceVersionIds: [],
    },
  };

  let mockBaseline: FeedFormState;

  beforeEach(() => {
    jest.clearAllMocks();
    const actual = jest.requireActual("@/features/review/utils/auditCompose");
    mockComposeAuditEntries.mockImplementation(actual.composeAuditEntries);
    mockBaseline = buildMockFeedFormState("src-1");
  });

  it("does not render when isOpen is false", () => {
    render(
      <FormSessionProvider session={reviewSession}>
        <FeedFormProvider
          initialState={mockBaseline}
          storageKey="test-feed-form"
        >
          <ReviewDiffModal
            isOpen={false}
            onClose={mockOnClose}
            baseline={mockBaseline}
          />
        </FeedFormProvider>
      </FormSessionProvider>,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders with 'No modifications detected.' when diff is empty", () => {
    render(
      <FormSessionProvider session={reviewSession}>
        <FeedFormProvider
          initialState={mockBaseline}
          storageKey="test-feed-form"
        >
          <ReviewDiffModal
            isOpen={true}
            onClose={mockOnClose}
            baseline={mockBaseline}
            title="Custom Title"
          />
        </FeedFormProvider>
      </FormSessionProvider>,
    );

    expect(screen.getByText("Custom Title")).toBeInTheDocument();
    expect(screen.getByText("No modifications detected.")).toBeInTheDocument();

    const closeBtn = screen.getByRole("button", { name: "Close" });
    fireEvent.click(closeBtn);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("renders diff entries when source is modified, organization is added, and person is deleted", () => {
    const working = deepClone(mockBaseline);
    // 1. Modify MM_Source title
    working.mMSourceDescription!.title = "Modified Manuscript Title";
    // 2. Add Organization
    const newOrg = { id: "org-new", name: "New Publisher" };
    working.organizations = [...(working.organizations ?? []), newOrg as any];
    // 3. Delete a person
    working.persons = (working.persons ?? []).slice(1);

    render(
      <FormSessionProvider session={reviewSession}>
        <FeedFormProvider
          initialState={working}
          storageKey="test-feed-form"
        >
          <ReviewDiffModal
            isOpen={true}
            onClose={mockOnClose}
            baseline={mockBaseline}
          />
        </FeedFormProvider>
      </FormSessionProvider>,
    );

    // Header title defaults to working source title
    expect(screen.getByText("Modified Manuscript Title")).toBeInTheDocument();

    // Table headers and action controls
    expect(screen.getByText("Entity")).toBeInTheDocument();
    expect(screen.getByText("Operation")).toBeInTheDocument();
    expect(screen.getByText("Changes")).toBeInTheDocument();
    expect(screen.getByText("Show unchanged")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /expand all/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /collapse all/i }),
    ).toBeInTheDocument();

    // Rendered rows for MM_Source (UPDATE), Organization (CREATE), Person (DELETE)
    expect(screen.getByText("MM_Source")).toBeInTheDocument();
    expect(screen.getByText("Organization")).toBeInTheDocument();
    expect(screen.getByText("Person")).toBeInTheDocument();
    expect(screen.getByText("UPDATE")).toBeInTheDocument();
    expect(screen.getByText("CREATE")).toBeInTheDocument();
    expect(screen.getByText("DELETE")).toBeInTheDocument();
  });

  it("supports interactive controls: Expand all, Collapse all, Show unchanged, and row toggle", () => {
    const working = deepClone(mockBaseline);
    working.mMSourceDescription!.title = "Modified Manuscript Title";

    render(
      <FormSessionProvider session={reviewSession}>
        <FeedFormProvider
          initialState={working}
          storageKey="test-feed-form"
        >
          <ReviewDiffModal
            isOpen={true}
            onClose={mockOnClose}
            baseline={mockBaseline}
          />
        </FeedFormProvider>
      </FormSessionProvider>,
    );

    // Expand all
    const expandAllBtn = screen.getByRole("button", { name: /expand all/i });
    fireEvent.click(expandAllBtn);

    // Details should now show Before and After content
    expect(screen.getByText("Before")).toBeInTheDocument();
    expect(screen.getByText("After")).toBeInTheDocument();
    expect(
      screen.getByText((content) =>
        content.includes('title: "Modified Manuscript Title"'),
      ),
    ).toBeInTheDocument();

    // Collapse all
    const collapseAllBtn = screen.getByRole("button", { name: /collapse all/i });
    fireEvent.click(collapseAllBtn);

    // Toggle row individually
    const beforeAfterSummary = screen.getByText("Before / After");
    fireEvent.click(beforeAfterSummary);
    expect(screen.getByText("Before")).toBeInTheDocument();

    // Toggle "Show unchanged" checkbox
    const showUnchangedCheckbox = screen.getByRole("checkbox");
    expect(showUnchangedCheckbox).not.toBeChecked();
    fireEvent.click(showUnchangedCheckbox);
    expect(showUnchangedCheckbox).toBeChecked();
  });

  it("handles backdrop close click and non-review session fallback", () => {
    render(
      <FormSessionProvider session={{ mode: "data-entering" }}>
        <FeedFormProvider
          initialState={mockBaseline}
          storageKey="test-feed-form"
        >
          <ReviewDiffModal
            isOpen={true}
            onClose={mockOnClose}
            baseline={mockBaseline}
          />
        </FeedFormProvider>
      </FormSessionProvider>,
    );

    const backdropCloseBtn = screen.getByRole("button", { name: "close" });
    fireEvent.click(backdropCloseBtn);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("falls back to default title 'Review Modifications' when no title is provided in props or state", () => {
    const baselineWithoutTitle = {
      ...mockBaseline,
      mMSourceDescription: {
        ...mockBaseline.mMSourceDescription,
        title: undefined,
      },
    } as unknown as FeedFormState;

    render(
      <FormSessionProvider session={reviewSession}>
        <FeedFormProvider
          initialState={baselineWithoutTitle}
          storageKey="test-feed-form"
        >
          <ReviewDiffModal
            isOpen={true}
            onClose={mockOnClose}
            baseline={baselineWithoutTitle}
          />
        </FeedFormProvider>
      </FormSessionProvider>,
    );

    expect(screen.getByText("Review Modifications")).toBeInTheDocument();
  });

  it("handles errors gracefully if composeAuditEntries throws", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockComposeAuditEntries.mockImplementationOnce(() => {
      throw new Error("Unexpected diff composition error");
    });

    render(
      <FormSessionProvider session={reviewSession}>
        <FeedFormProvider
          initialState={mockBaseline}
          storageKey="test-feed-form"
        >
          <ReviewDiffModal
            isOpen={true}
            onClose={mockOnClose}
            baseline={mockBaseline}
          />
        </FeedFormProvider>
      </FormSessionProvider>,
    );

    expect(screen.getByText("No modifications detected.")).toBeInTheDocument();
    expect(consoleSpy).toHaveBeenCalledWith(
      "[ReviewDiffModal] Error composing audit entries:",
      expect.any(Error),
    );

    consoleSpy.mockRestore();
  });
});
