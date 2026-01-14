import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { buildMockOverview } from "@/features/review/reviewMock";
import ChecklistPage from "@/app/(signedIn)/review/[reviewId]/checklist/page";
import { FEED_FORM_LOCAL_STORAGE_KEY } from "@/utils/constants";

// Mock Next.js navigation hooks
jest.mock("next/navigation", () => ({
  useParams: () => ({ reviewId: "r-1" }),
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/features/review/reviewEditBridge", () => ({
  ...jest.requireActual("@/features/review/reviewEditBridge"),
  rebuildWorkingCopyFromFeedForm: (_state: any, prev: any) => ({
    ...prev,
    updatedAt: new Date().toISOString(),
  }),
}));

// Use the real provider so the hook in the page can resolve
import { ReviewWorkingCopyProvider } from "@/context/reviewWorkingCopyContext";
import { expandRequiredChecklistItems } from "@/features/review/utils/expandRequiredChecklistItems";

// Utility to build a fake overview API response
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

describe("Back-to-review restoration (slice + scroll)", () => {
  beforeEach(() => {
    // @ts-ignore
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => makeOverview(),
    }));
    // Clear storage before each test
    localStorage.clear();
  });

  it("scrolls to the row matching the saved sliceKey on return", async () => {
    const overview = makeOverview();
    const items = expandRequiredChecklistItems(overview.graph);
    // Pick a deterministic item to anchor to
    const target =
      items.find((it) => it.entityType !== "MM_SOURCE") || items[0];
    const sliceKey = target.fieldPath;

    // Prepare feed form state indicating we are returning from edit
    localStorage.setItem(
      FEED_FORM_LOCAL_STORAGE_KEY,
      JSON.stringify({
        formInfo: {
          reviewContext: { reviewEdit: true, reviewId: "r-1", sliceKey },
        },
      }),
    );

    // Also set a return-route payload with both sliceKey and scrollY
    localStorage.setItem(
      "review:r-1:returnRoute",
      JSON.stringify({
        currentView: { view: "SUMMARY" }, // Provide the actual view object
        fieldPath: sliceKey, // page.tsx expects 'fieldPath', not 'sliceKey'
      }),
    );

    // Spy on scrollIntoView to verify anchor scrolling is used (jsdom lacks it by default)
    (HTMLElement.prototype as any).scrollIntoView = jest.fn();
    const spy = (HTMLElement.prototype as any).scrollIntoView as jest.Mock;
    // TODO: implement scrollIntoView call so this test passes

    render(
      <ReviewWorkingCopyProvider reviewId="r-1" initialGraph={overview.graph}>
        <ChecklistPage />
      </ReviewWorkingCopyProvider>,
    );

    // Wait for the checklist to appear
    await screen.findByText("Checklist items"); // TODO: choose an existing text from the interface

    // Expect anchor-based scrolling to have been triggered
    await waitFor(() => {
      expect(spy).toHaveBeenCalled();
    });
  });
});
