import { describe, it, expect, beforeEach } from "@jest/globals";
import {
  resolveStepForFieldPath,
  writeBootStateForFeedForm,
  consumeBootStateForFeedForm,
  buildFeedFormStateFromWorkingCopy,
  rebuildWorkingCopyFromFeedForm,
  type ReviewWorkingCopy,
} from "@/utils/reviewEditBridge";
import { FEED_FORM_BOOT_KEY } from "@/utils/constants";
import {
  RequiredChecklistItem,
  ChecklistGraph,
} from "@/utils/ReviewChecklistSchema";
import { FeedFormState } from "@/types/feedFormTypes";

// Mock data that reflects the new nested ChecklistGraph structure.
const mockWorkingCopy: ReviewWorkingCopy = {
  updatedAt: "2024-10-18T10:00:00.000Z",
  graph: {
    source: {
      id: "source-1",
      title: "Test Source",
      references: [{ id: "ref-1", type: "ISBN", reference: "123" }],
    },
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
    sourceContents: [
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

  it("resolveStepForFieldPath maps by root entity token", () => {
    expect(resolveStepForFieldPath("source.title")).toBe(1);
    expect(resolveStepForFieldPath("pieceVersion[pv123].category")).toBe(2);
    expect(resolveStepForFieldPath("movement[mv1].rank")).toBe(2);
    expect(resolveStepForFieldPath("section[sec1].metreNumerator")).toBe(2);
    expect(resolveStepForFieldPath("metronomeMark[mm1].bpm")).toBe(3);
    expect(resolveStepForFieldPath("reference[ref1].type")).toBe(1);
    expect(resolveStepForFieldPath("UNKNOWN[foo].bar")).toBe(0);
  });

  it("writeBootStateForFeedForm and consumeBootStateForFeedForm round-trip via localStorage", () => {
    const payload = {
      formInfo: {
        currentStepRank: 2,
        reviewContext: {
          reviewId: "r1",
          reviewEdit: true,
          updatedAt: new Date().toISOString(),
        },
      },
    };
    writeBootStateForFeedForm(payload as any);
    const consumed = consumeBootStateForFeedForm();
    expect(localStorage.getItem(FEED_FORM_BOOT_KEY)).toBeNull();
    expect(consumed?.formInfo?.currentStepRank).toBe(2);
    expect(consumed?.formInfo?.reviewContext?.reviewId).toBe("r1");
  });

  describe("buildFeedFormStateFromWorkingCopy", () => {
    it("should correctly build a FeedFormState, copying all graph data", () => {
      const clickedItem: RequiredChecklistItem = {
        entityType: "SECTION",
        entityId: "sec-1",
        fieldPath: "section[sec-1].metreNumerator",
        label: "Metre",
        lineage: {
          pieceId: "piece-1",
          pieceVersionId: "pv-1",
          movementId: "mov-1",
        },
      };

      const opts = { reviewId: "rev-xyz" };
      const feedState = buildFeedFormStateFromWorkingCopy(
        mockWorkingCopy,
        clickedItem,
        opts,
      );

      // Check formInfo and context
      expect(feedState.formInfo?.currentStepRank).toBe(2);
      expect(feedState.formInfo?.reviewContext?.reviewId).toBe("rev-xyz");
      expect(feedState.formInfo?.reviewContext?.anchors?.pvId).toBe("pv-1");
      expect(feedState.formInfo?.reviewContext?.anchors?.movId).toBe("mov-1");
      expect(feedState.formInfo?.reviewContext?.anchors?.secId).toBe("sec-1");

      // Check that graph data is copied
      expect(feedState.pieces).toEqual(mockWorkingCopy.graph.pieces);
      expect(feedState.pieceVersions).toEqual(
        mockWorkingCopy.graph.pieceVersions,
      );
      expect(feedState.mMSourceDescription?.title).toBe("Test Source");
      expect(feedState.mMSourceOnPieceVersions).toEqual(
        mockWorkingCopy.graph.sourceContents,
      );
      // Ensure it's a copy, not a reference
      expect(feedState.pieces).not.toBe(mockWorkingCopy.graph.pieces);
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
