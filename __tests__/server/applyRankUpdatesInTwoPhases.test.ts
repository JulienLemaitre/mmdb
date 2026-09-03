import {
  applyRankUpdatesInTwoPhases,
  PrismaTx,
} from "@/utils/server/applyRankUpdatesInTwoPhases";

type MockRow = {
  id: string;
  rank?: number;
  collectionRank?: number;
  mMSourceId?: string;
  pieceVersionId?: string;
  movementId?: string;
  collectionId?: string;
};

/**
 * Creates an in-memory mock Prisma transaction that enforces unique rank constraints
 * within the corresponding scope, exactly like PostgreSQL / Prisma does.
 */
function createMockPrismaTx(initialData: {
  mMSourcesOnPieceVersions?: MockRow[];
  movement?: MockRow[];
  section?: MockRow[];
  piece?: MockRow[];
}) {
  const store: Record<string, MockRow[]> = {
    mMSourcesOnPieceVersions: (initialData.mMSourcesOnPieceVersions ?? []).map(
      (r) => ({ ...r }),
    ),
    movement: (initialData.movement ?? []).map((r) => ({ ...r })),
    section: (initialData.section ?? []).map((r) => ({ ...r })),
    piece: (initialData.piece ?? []).map((r) => ({ ...r })),
  };

  const updateSpy = jest.fn();
  const findManySpy = jest.fn();

  function createDelegate(
    modelKey: "mMSourcesOnPieceVersions" | "movement" | "section" | "piece",
    rankField: "rank" | "collectionRank",
    scopeField:
      | "mMSourceId"
      | "pieceVersionId"
      | "movementId"
      | "collectionId",
  ) {
    return {
      findMany: jest.fn(async ({ where }: any) => {
        findManySpy(modelKey, where);
        const rows = store[modelKey].filter((row) => {
          if (where[scopeField] && row[scopeField] !== where[scopeField]) {
            return false;
          }
          return true;
        });
        return rows.map((r) => ({
          id: r.id,
          [rankField]: r[rankField],
          [scopeField]: r[scopeField],
        }));
      }),

      update: jest.fn(async ({ where, data }: any) => {
        updateSpy(modelKey, where.id, data);
        const rows = store[modelKey];
        const targetRow = rows.find((r) => r.id === where.id);
        if (!targetRow) {
          throw new Error(`Record to update not found: ${where.id}`);
        }

        const newRank = data[rankField];
        const currentScope = targetRow[scopeField];

        // Enforce uniqueness within the scope (like PostgreSQL unique constraint)
        const conflict = rows.find(
          (r) =>
            r.id !== targetRow.id &&
            r[scopeField] === currentScope &&
            r[rankField] === newRank,
        );
        if (conflict) {
          throw new Error(
            `Unique constraint failed on the fields: (${scopeField}, ${rankField}). Conflict on rank: ${newRank}`,
          );
        }

        targetRow[rankField] = newRank;
        return { ...targetRow };
      }),
    };
  }

  const tx = {
    mMSourcesOnPieceVersions: createDelegate(
      "mMSourcesOnPieceVersions",
      "rank",
      "mMSourceId",
    ),
    movement: createDelegate("movement", "rank", "pieceVersionId"),
    section: createDelegate("section", "rank", "movementId"),
    piece: createDelegate("piece", "collectionRank", "collectionId"),
    _store: store,
    _spies: { updateSpy, findManySpy },
  } as unknown as PrismaTx & {
    _store: Record<string, MockRow[]>;
    _spies: { updateSpy: jest.Mock; findManySpy: jest.Mock };
  };

  return tx;
}

describe("applyRankUpdatesInTwoPhases", () => {
  describe("Swap 1 ↔ 2 for all 4 models", () => {
    it("successfully swaps ranks for MMSourcesOnPieceVersions without unique constraint collision", async () => {
      const tx = createMockPrismaTx({
        mMSourcesOnPieceVersions: [
          { id: "join-1", rank: 1, mMSourceId: "source-1" },
          { id: "join-2", rank: 2, mMSourceId: "source-1" },
        ],
      });

      const result = await applyRankUpdatesInTwoPhases(tx, {
        model: "MMSourcesOnPieceVersions",
        scope: { mMSourceId: "source-1" },
        updates: [
          { id: "join-1", rank: 2 },
          { id: "join-2", rank: 1 },
        ],
      });

      expect(result.updatedCount).toBe(2);

      // Verify final store state
      const rows = tx._store.mMSourcesOnPieceVersions;
      expect(rows.find((r) => r.id === "join-1")?.rank).toBe(2);
      expect(rows.find((r) => r.id === "join-2")?.rank).toBe(1);

      // 2 phase updates = 2 updates in phase 1 + 2 updates in phase 2 = 4 updates total
      expect(tx._spies.updateSpy).toHaveBeenCalledTimes(4);
    });

    it("successfully swaps ranks for Movement (using camelCase model name)", async () => {
      const tx = createMockPrismaTx({
        movement: [
          { id: "mov-1", rank: 1, pieceVersionId: "pv-100" },
          { id: "mov-2", rank: 2, pieceVersionId: "pv-100" },
        ],
      });

      const result = await applyRankUpdatesInTwoPhases(tx, {
        model: "movement",
        scope: { pieceVersionId: "pv-100" },
        updates: [
          { id: "mov-1", rank: 2 },
          { id: "mov-2", rank: 1 },
        ],
      });

      expect(result.updatedCount).toBe(2);
      expect(tx._store.movement.find((r) => r.id === "mov-1")?.rank).toBe(2);
      expect(tx._store.movement.find((r) => r.id === "mov-2")?.rank).toBe(1);
    });

    it("successfully swaps ranks for Section", async () => {
      const tx = createMockPrismaTx({
        section: [
          { id: "sec-1", rank: 1, movementId: "mov-50" },
          { id: "sec-2", rank: 2, movementId: "mov-50" },
        ],
      });

      const result = await applyRankUpdatesInTwoPhases(tx, {
        model: "Section",
        scope: { movementId: "mov-50" },
        updates: [
          { id: "sec-1", rank: 2 },
          { id: "sec-2", rank: 1 },
        ],
      });

      expect(result.updatedCount).toBe(2);
      expect(tx._store.section.find((r) => r.id === "sec-1")?.rank).toBe(2);
      expect(tx._store.section.find((r) => r.id === "sec-2")?.rank).toBe(1);
    });

    it("successfully swaps collectionRank for Piece", async () => {
      const tx = createMockPrismaTx({
        piece: [
          { id: "piece-1", collectionRank: 1, collectionId: "col-10" },
          { id: "piece-2", collectionRank: 2, collectionId: "col-10" },
        ],
      });

      const result = await applyRankUpdatesInTwoPhases(tx, {
        model: "Piece",
        scope: { collectionId: "col-10" },
        updates: [
          { id: "piece-1", rank: 2 },
          { id: "piece-2", rank: 1 },
        ],
      });

      expect(result.updatedCount).toBe(2);
      expect(
        tx._store.piece.find((r) => r.id === "piece-1")?.collectionRank,
      ).toBe(2);
      expect(
        tx._store.piece.find((r) => r.id === "piece-2")?.collectionRank,
      ).toBe(1);
    });
  });

  describe("Complex shifts and full list reorderings", () => {
    it("handles full list reversal [1, 2, 3, 4, 5] -> [5, 4, 3, 2, 1]", async () => {
      const tx = createMockPrismaTx({
        movement: [
          { id: "m-1", rank: 1, pieceVersionId: "pv-1" },
          { id: "m-2", rank: 2, pieceVersionId: "pv-1" },
          { id: "m-3", rank: 3, pieceVersionId: "pv-1" },
          { id: "m-4", rank: 4, pieceVersionId: "pv-1" },
          { id: "m-5", rank: 5, pieceVersionId: "pv-1" },
        ],
      });

      const result = await applyRankUpdatesInTwoPhases(tx, {
        model: "Movement",
        scope: { pieceVersionId: "pv-1" },
        updates: [
          { id: "m-1", rank: 5 },
          { id: "m-2", rank: 4 },
          { id: "m-3", rank: 3 }, // unchanged rank
          { id: "m-4", rank: 2 },
          { id: "m-5", rank: 1 },
        ],
      });

      // m-3 was already at rank 3, so only 4 items changed
      expect(result.updatedCount).toBe(4);

      const rows = tx._store.movement;
      expect(rows.find((r) => r.id === "m-1")?.rank).toBe(5);
      expect(rows.find((r) => r.id === "m-2")?.rank).toBe(4);
      expect(rows.find((r) => r.id === "m-3")?.rank).toBe(3);
      expect(rows.find((r) => r.id === "m-4")?.rank).toBe(2);
      expect(rows.find((r) => r.id === "m-5")?.rank).toBe(1);
    });

    it("handles cyclic shift of items [1, 2, 3, 4] -> [2, 3, 4, 1]", async () => {
      const tx = createMockPrismaTx({
        section: [
          { id: "s-1", rank: 1, movementId: "mov-1" },
          { id: "s-2", rank: 2, movementId: "mov-1" },
          { id: "s-3", rank: 3, movementId: "mov-1" },
          { id: "s-4", rank: 4, movementId: "mov-1" },
        ],
      });

      const result = await applyRankUpdatesInTwoPhases(tx, {
        model: "Section",
        scope: { movementId: "mov-1" },
        updates: [
          { id: "s-1", rank: 4 },
          { id: "s-2", rank: 1 },
          { id: "s-3", rank: 2 },
          { id: "s-4", rank: 3 },
        ],
      });

      expect(result.updatedCount).toBe(4);

      const rows = tx._store.section;
      expect(rows.find((r) => r.id === "s-1")?.rank).toBe(4);
      expect(rows.find((r) => r.id === "s-2")?.rank).toBe(1);
      expect(rows.find((r) => r.id === "s-3")?.rank).toBe(2);
      expect(rows.find((r) => r.id === "s-4")?.rank).toBe(3);
    });
  });

  describe("No-op / unneeded updates handling", () => {
    it("makes zero update calls when all items are already at their target ranks", async () => {
      const tx = createMockPrismaTx({
        mMSourcesOnPieceVersions: [
          { id: "join-1", rank: 1, mMSourceId: "source-1" },
          { id: "join-2", rank: 2, mMSourceId: "source-1" },
          { id: "join-3", rank: 3, mMSourceId: "source-1" },
        ],
      });

      const result = await applyRankUpdatesInTwoPhases(tx, {
        model: "MMSourcesOnPieceVersions",
        scope: { mMSourceId: "source-1" },
        updates: [
          { id: "join-1", rank: 1 },
          { id: "join-2", rank: 2 },
          { id: "join-3", rank: 3 },
        ],
      });

      expect(result.updatedCount).toBe(0);
      expect(tx._spies.updateSpy).not.toHaveBeenCalled();
    });

    it("makes zero calls when updates array is empty", async () => {
      const tx = createMockPrismaTx({});

      const result = await applyRankUpdatesInTwoPhases(tx, {
        model: "Movement",
        scope: { pieceVersionId: "pv-empty" },
        updates: [],
      });

      expect(result.updatedCount).toBe(0);
      expect(tx._spies.findManySpy).not.toHaveBeenCalled();
      expect(tx._spies.updateSpy).not.toHaveBeenCalled();
    });

    it("updates only the items that actually change ranks in a partial reorder", async () => {
      const tx = createMockPrismaTx({
        piece: [
          { id: "p-1", collectionRank: 1, collectionId: "col-1" },
          { id: "p-2", collectionRank: 2, collectionId: "col-1" },
          { id: "p-3", collectionRank: 3, collectionId: "col-1" },
          { id: "p-4", collectionRank: 4, collectionId: "col-1" },
        ],
      });

      const result = await applyRankUpdatesInTwoPhases(tx, {
        model: "Piece",
        scope: { collectionId: "col-1" },
        updates: [
          { id: "p-1", rank: 1 }, // unchanged
          { id: "p-2", rank: 2 }, // unchanged
          { id: "p-3", rank: 4 }, // changed
          { id: "p-4", rank: 3 }, // changed
        ],
      });

      expect(result.updatedCount).toBe(2);
      // Only p-3 and p-4 were updated (2 in phase 1, 2 in phase 2 = 4 update calls)
      expect(tx._spies.updateSpy).toHaveBeenCalledTimes(4);
    });
  });

  describe("Validation & error handling", () => {
    it("throws error when duplicate target rank is provided in updates", async () => {
      const tx = createMockPrismaTx({});

      await expect(
        applyRankUpdatesInTwoPhases(tx, {
          model: "Movement",
          scope: { pieceVersionId: "pv-1" },
          updates: [
            { id: "m-1", rank: 1 },
            { id: "m-2", rank: 1 }, // Duplicate rank 1
          ],
        }),
      ).rejects.toThrow("Duplicate target rank 1");

      expect(tx._spies.findManySpy).not.toHaveBeenCalled();
    });

    it("throws error when an updated item ID is not found in the scope", async () => {
      const tx = createMockPrismaTx({
        section: [{ id: "sec-1", rank: 1, movementId: "mov-1" }],
      });

      await expect(
        applyRankUpdatesInTwoPhases(tx, {
          model: "Section",
          scope: { movementId: "mov-1" },
          updates: [{ id: "sec-non-existent", rank: 1 }],
        }),
      ).rejects.toThrow('Record with id "sec-non-existent" not found in scope');
    });

    it("throws error when required scope field is missing or empty", async () => {
      const tx = createMockPrismaTx({});

      await expect(
        applyRankUpdatesInTwoPhases(tx, {
          model: "MMSourcesOnPieceVersions",
          scope: { mMSourceId: "" } as any,
          updates: [{ id: "join-1", rank: 1 }],
        }),
      ).rejects.toThrow('Missing required scope field "mMSourceId"');
    });

    it("throws error when model name is unsupported", async () => {
      const tx = createMockPrismaTx({});

      await expect(
        applyRankUpdatesInTwoPhases(tx, {
          model: "UnsupportedModel" as any,
          scope: { mMSourceId: "s-1" } as any,
          updates: [{ id: "1", rank: 1 }],
        }),
      ).rejects.toThrow("Unsupported model: UnsupportedModel");
    });
  });
});
