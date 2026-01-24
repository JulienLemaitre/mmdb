import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChecklistPage from "@/app/(signedIn)/review/[reviewId]/checklist/page";
import { ReviewWorkingCopyProvider } from "@/context/reviewWorkingCopyContext";
import { buildMockOverview } from "@/features/review/reviewMock";
import { URL_REVIEW_LIST } from "@/utils/routes";
import { expandRequiredChecklistItems } from "@/features/review/utils/expandRequiredChecklistItems";

// Mock navigation hooks
const pushMock = jest.fn();
jest.mock("next/navigation", () => ({
  useParams: () => ({ reviewId: "r-1" }),
  useRouter: () => ({ push: pushMock }),
}));

function makeOverview() {
  const { graph, globallyReviewed } = buildMockOverview("r-1");
  return {
    reviewId: "r-1",
    graph,
    globallyReviewed: {
      personIds: globallyReviewed.personIds,
      organizationIds: globallyReviewed.organizationIds,
      collectionIds: globallyReviewed.collectionIds,
      pieceIds: globallyReviewed.pieceIds,
    },
    sourceOnPieceVersions: graph.sourceOnPieceVersions,
    progress: {
      source: { required: 0, checked: 0 },
      perCollection: {},
      perPiece: {},
    },
  };
}

describe("Review lifecycle UI integration: submit flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock HTMLDialogElement methods for JSDOM
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

    // @ts-ignore
    global.fetch = jest.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === "string" ? input : String(input);
        if (url.includes("/api/review/r-1/overview")) {
          return { ok: true, json: async () => makeOverview() } as any;
        }
        if (url.includes("/api/review/r-1/submit")) {
          const summary = {
            reviewId: "r-1",
            overallComment: "super review",
            requiredCount: 66,
            submittedCheckedCount: 70,
            changedCount: 0,
            entitiesTouched: [],
            changedFieldPathsSample: [],
          };
          return {
            ok: true,
            json: async () => ({ ok: true, summary }),
          } as any;
        }
        if (url.includes("/api/review/r-1/audit-logs")) {
          return {
            ok: true,
            json: async () => ({
              items: [],
              nextCursor: null,
              review: {
                sourceTitle: "Test Source",
                authorName: "Reviewer",
                date: new Date().toISOString(),
              },
            }),
          } as any;
        }
        return {
          ok: false,
          status: 404,
          json: async () => ({ error: "not found" }),
        } as any;
      },
    );
    localStorage.clear();
  });

  it("submits when all required are pre-checked, clears local storage, and navigates to review list", async () => {
    const overview = makeOverview();
    const required = expandRequiredChecklistItems(overview.graph);
    const allKeys = required.map((it) => it.fieldPath);

    // Pre-populate checked keys so submit button is enabled without clicking all checkboxes
    localStorage.setItem("review:r-1:checklist", JSON.stringify(allKeys));

    render(
      <ReviewWorkingCopyProvider reviewId="r-1" initialGraph={overview.graph}>
        <ChecklistPage />
      </ReviewWorkingCopyProvider>,
    );

    // Wait for page content
    await screen.findByText("Checklist items");

    // Submit button should be enabled
    const submit = screen.getByRole("button", { name: /submit review/i });
    expect(submit).toBeEnabled();

    const user = userEvent.setup();
    await user.click(submit);

    // Wait for the success modal to appear
    await screen.findByText(/Review submitted successfully/i);

    // Find and click the close button in the modal to trigger the redirect logic
    const closeBtn = screen.getByRole("button", { name: /close/i }); // Adjust name if it's "OK" or similar
    await user.click(closeBtn);

    // Expect navigation to review list
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith(URL_REVIEW_LIST);
    });

    // Checklist checked storage removed
    const checklistStorage = localStorage.getItem("review:r-1:checklist");
    expect(checklistStorage === null || checklistStorage === "[]").toBe(true);
    // Working copy is expected to be cleared by provider.clear(); we do not assert here due to Provider nesting in this test context.
  });
});
