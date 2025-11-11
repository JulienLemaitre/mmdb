import { describe, it, expect, beforeEach } from "@jest/globals";
import {
  resolveStepFromReviewItem,
  writeBootStateForFeedForm,
  consumeBootStateForFeedForm,
  buildFeedFormBootStateFromWorkingCopy,
  rebuildWorkingCopyFromFeedForm,
  type ReviewWorkingCopy,
  type FeedBootType,
} from "@/features/review/reviewEditBridge";
import { FEED_FORM_BOOT_KEY } from "@/utils/constants";
import { FeedFormState } from "@/types/feedFormTypes";
import { ChecklistGraph, RequiredChecklistItem } from "@/types/reviewTypes";

// Mock data that reflects the new nested ChecklistGraph structure.
const mockWorkingCopy: ReviewWorkingCopy = {
  updatedAt: "2024-10-18T10:00:00.000Z",
  graph: {
    source: {
      id: "source-1",
      title: "Test Source",
      references: [{ id: "ref-1", type: "ISBN", reference: "123" }],
    },
    collections: [
      {
        id: "coll-1",
        title: "Test Collection",
        pieceCount: 1,
        composerId: "person-1",
      },
    ],
    contributions: [
      {
        id: "contrib-1",
        role: "EDITOR",
        person: {
          id: "person-1",
          firstName: "John",
          lastName: "Doe",
          birthYear: 1900,
          deathYear: null,
        },
      },
    ],
    persons: [
      {
        id: "person-1",
        firstName: "John",
        lastName: "Doe",
        birthYear: 1900,
        deathYear: null,
      },
    ],
    pieces: [
      {
        id: "piece-1",
        title: "My Piece",
        collectionId: "coll-1",
        composerId: "person-1",
        collectionRank: 1,
      },
    ],
    pieceVersions: [
      {
        id: "pv-1",
        pieceId: "piece-1",
        category: "KEYBOARD",
        movements: [
          {
            id: "mov-1",
            rank: 1,
            key: "C_MAJOR",
            sections: [
              {
                id: "sec-1",
                rank: 1,
                metreNumerator: 4,
                metreDenominator: 4,
                isCommonTime: true,
                isCutTime: false,
                fastestStructuralNotesPerBar: 16,
                tempoIndication: { id: "ti-1", text: "Allegro" },
              },
            ],
          },
        ],
      },
    ],
    metronomeMarks: [
      {
        id: "mm-1",
        sectionId: "sec-1",
        bpm: 120,
        beatUnit: "QUARTER",
        noMM: false,
        pieceVersionId: "pv-1",
      },
    ],
    sourceOnPieceVersions: [
      {
        joinId: "join-1",
        mMSourceId: "source-1",
        pieceVersionId: "pv-1",
        rank: 1,
        pieceId: "piece-1",
      },
    ],
  } as unknown as ChecklistGraph,
};

describe("reviewEditBridge utilities", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("resolveStepFromReviewItem maps entity types to step numbers", () => {
    // Basic cases
    expect(
      resolveStepFromReviewItem(
        { entityType: "MM_SOURCE" } as any,
        mockWorkingCopy,
      ),
    ).toBe(1);
    expect(
      resolveStepFromReviewItem(
        { entityType: "METRONOME_MARK" } as any,
        mockWorkingCopy,
      ),
    ).toBe(4);

    // Person who IS a contributor
    expect(
      resolveStepFromReviewItem(
        { entityType: "PERSON", entityId: "person-1" } as any,
        mockWorkingCopy,
      ),
    ).toBe(2);

    // Person who is NOT a contributor (e.g. a composer)
    const composerOnlyWC: ReviewWorkingCopy = {
      graph: {
        contributions: [],
      },
    } as any;
    expect(
      resolveStepFromReviewItem(
        { entityType: "PERSON", entityId: "any-person" } as any,
        composerOnlyWC,
      ),
    ).toBe(3);

    // Unknown entity
    expect(
      resolveStepFromReviewItem(
        { entityType: "GARBAGE" } as any,
        mockWorkingCopy,
      ),
    ).toBe(0);
  });

  it("writeBootStateForFeedForm and consumeBootStateForFeedForm round-trip via localStorage", () => {
    const payload: FeedBootType = {
      feedFormState: {
        formInfo: {
          currentStepRank: 2,
          reviewContext: {
            reviewId: "r1",
            reviewEdit: true,
            updatedAt: new Date().toISOString(),
          },
        },
      } as FeedFormState,
    };
    writeBootStateForFeedForm(payload);
    const consumed = consumeBootStateForFeedForm();
    expect(localStorage.getItem(FEED_FORM_BOOT_KEY)).toBeNull();
    expect(consumed?.feedFormState.formInfo?.currentStepRank).toBe(2);
    expect(consumed?.feedFormState.formInfo?.reviewContext?.reviewId).toBe(
      "r1",
    );
  });

  describe("buildFeedFormBootStateFromWorkingCopy", () => {
    it("should correctly build a full boot state for a collection piece item", () => {
      const clickedItem: RequiredChecklistItem = {
        entityType: "SECTION",
        entityId: "sec-1",
        fieldPath: "section[sec-1].metreNumerator",
        field: { path: "metreNumerator", label: "Metre numerator" },
        value: 4,
        label: "Metre",
        lineage: {
          collectionId: "coll-1",
          pieceId: "piece-1",
          pieceVersionId: "pv-1",
          movementId: "mov-1",
        },
      };

      const opts = { reviewId: "rev-xyz" };
      const bootState = buildFeedFormBootStateFromWorkingCopy(
        mockWorkingCopy,
        clickedItem,
        opts,
      );
      const {
        feedFormState,
        collectionPieceVersionsFormState,
        singlePieceVersionFormState,
      } = bootState;

      // Check feedFormState formInfo and context
      expect(feedFormState.formInfo?.currentStepRank).toBe(3); // SECTION is step 3
      expect(feedFormState.formInfo?.reviewContext?.reviewId).toBe("rev-xyz");
      expect(feedFormState.formInfo?.reviewContext?.anchors?.pvId).toBe("pv-1");
      expect(feedFormState.formInfo?.reviewContext?.anchors?.movId).toBe(
        "mov-1",
      );
      expect(feedFormState.formInfo?.reviewContext?.anchors?.secId).toBe(
        "sec-1",
      );
      expect(feedFormState.formInfo?.isSourceOnPieceVersionformOpen).toBe(true);
      expect(feedFormState.formInfo?.formType).toBe("collection");

      // Check that graph data is copied to feedFormState
      expect(feedFormState.pieces).toEqual(mockWorkingCopy.graph.pieces);
      expect(feedFormState.pieceVersions).toEqual(
        mockWorkingCopy.graph.pieceVersions,
      );
      expect(feedFormState.mMSourceDescription?.title).toBe("Test Source");
      expect(feedFormState.mMSourceOnPieceVersions).toEqual(
        mockWorkingCopy.graph.sourceOnPieceVersions,
      );
      // Ensure it's a copy, not a reference
      expect(feedFormState.pieces).not.toBe(mockWorkingCopy.graph.pieces);

      // Check collectionPieceVersionsFormState
      expect(collectionPieceVersionsFormState).not.toBeNull();
      expect(
        collectionPieceVersionsFormState?.formInfo.isSinglePieceVersionFormOpen,
      ).toBe(true);
      expect(collectionPieceVersionsFormState?.collection?.title).toBe(
        "Test Collection",
      );
      expect(
        collectionPieceVersionsFormState?.mMSourceOnPieceVersions?.[0]
          .pieceVersionId,
      ).toBe("pv-1");

      // Check singlePieceVersionFormState
      expect(singlePieceVersionFormState).not.toBeNull();
      expect(
        singlePieceVersionFormState?.formInfo.currentStepRank,
      ).toBeUndefined();
      expect(singlePieceVersionFormState?.piece?.id).toBe("piece-1");
      expect(singlePieceVersionFormState?.composer?.id).toBe("person-1");
    });
  });

  describe("rebuildWorkingCopyFromFeedForm", () => {
    const previousWc: ReviewWorkingCopy = {
      updatedAt: "2024-01-01T00:00:00.000Z",
      graph: {
        source: {
          id: "source-1",
          title: "Old Title",
          permalink: "preserved-link",
          references: [],
        },
        pieces: [{ id: "piece-to-be-deleted", title: "Old Piece" }],
      } as any,
    };

    it("should treat feedFormState as the source of truth, replacing data", () => {
      const formState: FeedFormState = {
        formInfo: {
          currentStepRank: 1,
          reviewContext: {
            reviewId: "rev-abc",
            reviewEdit: true,
            updatedAt: new Date().toISOString(),
          },
        },
        mMSourceDescription: {
          title: "New Title",
          type: "EDITION",
          link: "https://testmock.test",
          year: 1980,
          references: [],
        },
        pieces: [
          {
            id: "piece-new",
            title: "New Piece",
            composerId: "person-1",
            collectionId: "coll-1",
          },
        ],
        pieceVersions: [], // This empty array should overwrite the original
      };

      const result = rebuildWorkingCopyFromFeedForm(formState, previousWc);

      expect(result.graph.pieces?.length).toBe(1);
      expect(result.graph.pieces?.[0].id).toBe("piece-new");
      expect(result.graph.source.title).toBe("New Title");
      expect(new Date(result.updatedAt).getTime()).toBeGreaterThan(
        new Date(previousWc.updatedAt).getTime(),
      );
    });

    it("should correctly handle deleted slices by using empty arrays", () => {
      const formState: FeedFormState = {
        formInfo: {
          currentStepRank: 1,
          reviewContext: {
            reviewId: "rev-abc",
            reviewEdit: true,
            updatedAt: new Date().toISOString(),
          },
        },
        pieces: [], // User explicitly deleted all pieces
      };
      const result = rebuildWorkingCopyFromFeedForm(formState, previousWc);
      expect(result.graph.pieces).toEqual([]);
    });

    it("should preserve non-editable fields like source.id and source.permalink", () => {
      const formState: FeedFormState = {
        formInfo: {
          currentStepRank: 1,
          reviewContext: {
            reviewId: "rev-abc",
            reviewEdit: true,
            updatedAt: new Date().toISOString(),
          },
        },
        mMSourceDescription: {
          title: "A Brand New Title",
          type: "EDITION",
          link: "https://testmock.test",
          year: 1980,
          references: [],
        },
      };
      const result = rebuildWorkingCopyFromFeedForm(formState, previousWc);
      expect(result.graph.source.id).toBe("source-1");
      expect(result.graph.source.permalink).toBe("preserved-link");
    });

    it("should return previous working copy if reviewContext is missing", () => {
      const formState: FeedFormState = {
        formInfo: { currentStepRank: 1 }, // No reviewContext
        pieces: [
          {
            id: "some-other-piece",
            title: "Should Be Ignored",
            composerId: "person-1",
          },
        ],
      };
      const result = rebuildWorkingCopyFromFeedForm(formState, previousWc);
      expect(result).toBe(previousWc); // Should be the same object reference
    });
  });
});
