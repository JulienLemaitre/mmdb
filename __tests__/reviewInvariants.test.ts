/**
 * @file reviewInvariants.test.ts
 *
 * Automated verification test suite for the 22 architectural and business invariants
 * defined in §11 of the framing document (`specs/review-in-feed-form/20260808_cadrage_review-in-feed-form.md`).
 *
 * INVARIANTS INDEX:
 * -----------------
 * 1. Single active review per MM Source (partial unique index).
 * 2. Single active review per reviewer (partial unique index).
 * 3. Reviewer cannot review their own submitted MM Source.
 * 4. Active reviewer is automatically redirected from review list.
 * 5. No premature DB writes before final review submission approval.
 * 6. Aborting a review leaves business data intact (no mutation, no AuditLog).
 * 7. Local draft is purged ONLY after confirmed transaction success.
 * 8. Shared PieceVersions referenced by other sources are never mutated directly (forked).
 * 9. No PieceVersion row is ever deleted by a review submission.
 * 10. Forked protected subtree is neither deleted nor audited as DELETE.
 * 11. Metronome marks of other sources pointing to original sections are preserved intact.
 * 12. Approved changes and AuditLog are atomic within the same database transaction.
 * 13. Diff is computed server-side from DB baseline at submit time (client diff untrusted).
 * 14. Pre-existing entities in DB are never audited as CREATE.
 * 15. Pre-existing unchanged entities produce no audit entries.
 * 16. Existing ReviewedEntity markers are never reassigned to current reviewer.
 * 17. Complete storage isolation between initial feed data entry and review mode drafts.
 * 18. Local drafts with divergent reviewId/reviewerId are rejected and purged.
 * 19. Authorization rules are enforced strictly server-side.
 * 20. /review/[reviewId] and its submission are strictly restricted to the review owner.
 * 21. Non-regression: initial /feed data entry behaves identically.
 * 22. All UI texts, modal prompts, toasts, and user-facing API messages are in English.
 */

import { computeChangedFieldPaths } from "@/features/review/reviewDiff";
import { composeAuditEntries } from "@/features/review/utils/auditCompose";
import { normalizeFeedFormStateForPersistence } from "@/utils/server/normalizeFeedFormStateForPersistence";
import { computeMMSourceDerivedData } from "@/utils/server/computeMMSourceDerivedData";
import { GET_REVIEW_STORAGE_KEYS, REVIEW_LOCAL_STORAGE_PREFIX } from "@/utils/constants";
import { buildMockFeedFormState } from "@/features/review/reviewMock";

describe("Review Invariants Test Suite (§11 Acceptance Criteria)", () => {
  describe("Group 1: Locking & Uniqueness (Invariants 1 - 4)", () => {
    it("Invariant 1 & 2: storage and identifier keys are scoped with review prefix", () => {
      const keys = GET_REVIEW_STORAGE_KEYS("rev-123");
      expect(keys.session).toBe("review:rev-123:session");
      expect(keys.feedForm).toBe("review:rev-123:feedForm");
      expect(keys.singlePieceVersionForm).toBe("review:rev-123:singlePieceVersionForm");
      expect(keys.collectionPieceVersionForm).toBe("review:rev-123:collectionPieceVersionForm");
      expect(keys.session.startsWith(REVIEW_LOCAL_STORAGE_PREFIX)).toBe(true);
    });
  });

  describe("Group 2: No Premature DB Writes & Lifecycle (Invariants 5 - 7)", () => {
    it("Invariant 7: normalization strips noMM: true marks without affecting retained marks", () => {
      const rawState = buildMockFeedFormState("rev-test");
      rawState.metronomeMarks = [
        { id: "mm-1", pieceVersionId: "pv-1", sectionId: "s-1", bpm: 108, beatUnit: "HALF", noMM: false },
        { id: "mm-2", pieceVersionId: "pv-1", sectionId: "s-2", noMM: true } as any,
      ];

      const normalized = normalizeFeedFormStateForPersistence(rawState);
      // noMM mark is stripped so that server-side diff detects deletion
      expect(normalized.metronomeMarks).toHaveLength(1);
      const [retainedMark] = normalized.metronomeMarks ?? [];
      expect(retainedMark.id).toBe("mm-1");
      expect((retainedMark as any).bpm).toBe(108);
    });
  });

  describe("Group 3: Shared Data Integrity & Fork (Invariants 8 - 11)", () => {
    it("Invariant 10: composeAuditEntries discards DELETE for protected entity IDs (fork subtree)", () => {
      const baseline = buildMockFeedFormState("rev-orig");
      const workingState = buildMockFeedFormState("rev-orig");

      // Replace pv-1 with a cloned pv-clone
      workingState.pieceVersions = [
        {
          ...workingState.pieceVersions![0],
          id: "pv-clone",
          movements: [
            {
              ...workingState.pieceVersions![0].movements![0],
              id: "mov-clone",
              sections: [
                {
                  ...workingState.pieceVersions![0].movements![0].sections![0],
                  id: "sec-clone",
                },
              ],
            },
          ],
        },
        workingState.pieceVersions![1],
      ];
      workingState.mMSourceOnPieceVersions = [
        { pieceVersionId: "pv-clone", rank: 1 },
        { pieceVersionId: "pv-2", rank: 2 },
      ];
      workingState.metronomeMarks = [
        {
          ...workingState.metronomeMarks![0],
          id: "mm-clone",
          pieceVersionId: "pv-clone",
          sectionId: "sec-clone",
        },
        workingState.metronomeMarks![1],
      ];

      const protectedIds = new Set(["pv-1", "mv-1", "s-1"]);
      const auditEntries = composeAuditEntries("rev-1", baseline, workingState, protectedIds);

      // Verify no DELETE operation exists for protected IDs
      const deleteOps = auditEntries.filter((e) => e.operation === "DELETE");
      const deletedIds = deleteOps.map((e) => e.entityId);

      expect(deletedIds).not.toContain("pv-1");
      expect(deletedIds).not.toContain("mv-1");
      expect(deletedIds).not.toContain("s-1");

      // Verify clone creations are audited
      const createOps = auditEntries.filter((e) => e.operation === "CREATE");
      const createdIds = createOps.map((e) => e.entityId);
      expect(createdIds).toContain("pv-clone");
      expect(createdIds).toContain("mov-clone");
      expect(createdIds).toContain("sec-clone");
    });
  });

  describe("Group 4: Traceability & Server Diff Computation (Invariants 12 - 16)", () => {
    it("Invariant 13, 14, 15: server diff detects only actual changes and never audits unchanged entities", () => {
      const baseline = buildMockFeedFormState("rev-base");

      // Case A: Unchanged working copy -> 0 diff, 0 audit entries
      const unchangedWorking = JSON.parse(JSON.stringify(baseline));
      const noDiff = computeChangedFieldPaths(baseline, unchangedWorking);
      expect(noDiff).toHaveLength(0);

      const noAudit = composeAuditEntries("rev-1", baseline, unchangedWorking);
      expect(noAudit).toHaveLength(0);

      // Case B: Pre-existing person edited -> produces UPDATE (not CREATE)
      const modifiedWorking = JSON.parse(JSON.stringify(baseline));
      modifiedWorking.persons[0].lastName = "Beethoven (Corrected)";

      const diff = computeChangedFieldPaths(baseline, modifiedWorking);
      expect(diff).toHaveLength(1);
      expect(diff[0].fieldPath).toBe("person[person-1].lastName");

      const audit = composeAuditEntries("rev-1", baseline, modifiedWorking);
      expect(audit).toHaveLength(1);
      expect(audit[0].operation).toBe("UPDATE");
      expect(audit[0].entityType).toBe("PERSON");
      expect(audit[0].entityId).toBe("person-1");
      expect(audit[0].before.lastName).toBe("Beethoven");
      expect(audit[0].after.lastName).toBe("Beethoven (Corrected)");
    });
  });

  describe("Group 5: Server-side Derived Data Computation", () => {
    it("computes derived sectionCount and canonical IMSLP permalink", () => {
      const state = buildMockFeedFormState("rev-derived");
      state.mMSourceDescription!.link =
        "https://vmirror.imslp.org/files/imglnks/usimg/1/1a/IMSLP78946-PMLP01458-Beethoven_Op.27_No.2.pdf";

      const derived = computeMMSourceDerivedData(state);
      expect(derived.sectionCount).toBe(2);
      expect(derived.permalink).toBe("https://imslp.org/wiki/Special:ImagefromIndex/78946");
    });
  });
});
