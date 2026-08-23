import { PrismaClient, Prisma } from "@/prisma/client";

export type PrismaTx = PrismaClient | Prisma.TransactionClient;

export type RankUpdateItem = {
  id: string;
  rank: number;
};

export type MMSourceOnPieceVersionScope = { mMSourceId: string };
export type MovementScope = { pieceVersionId: string };
export type SectionScope = { movementId: string };
export type PieceScope = { collectionId: string };

export type ApplyRankUpdatesParams =
  | {
      model: "MMSourcesOnPieceVersions" | "mMSourcesOnPieceVersions";
      updates: RankUpdateItem[];
      scope: MMSourceOnPieceVersionScope;
    }
  | {
      model: "Movement" | "movement";
      updates: RankUpdateItem[];
      scope: MovementScope;
    }
  | {
      model: "Section" | "section";
      updates: RankUpdateItem[];
      scope: SectionScope;
    }
  | {
      model: "Piece" | "piece";
      updates: RankUpdateItem[];
      scope: PieceScope;
    };

export type ApplyRankUpdatesResult = {
  updatedCount: number;
};

type ModelConfig = {
  delegateKey: "mMSourcesOnPieceVersions" | "movement" | "section" | "piece";
  rankField: string;
  scopeField: string;
  getWhereScope: (scope: any) => Record<string, string>;
};

const MODEL_CONFIGS: Record<string, ModelConfig> = {
  MMSourcesOnPieceVersions: {
    delegateKey: "mMSourcesOnPieceVersions",
    rankField: "rank",
    scopeField: "mMSourceId",
    getWhereScope: (scope: MMSourceOnPieceVersionScope) => ({
      mMSourceId: scope.mMSourceId,
    }),
  },
  mMSourcesOnPieceVersions: {
    delegateKey: "mMSourcesOnPieceVersions",
    rankField: "rank",
    scopeField: "mMSourceId",
    getWhereScope: (scope: MMSourceOnPieceVersionScope) => ({
      mMSourceId: scope.mMSourceId,
    }),
  },
  Movement: {
    delegateKey: "movement",
    rankField: "rank",
    scopeField: "pieceVersionId",
    getWhereScope: (scope: MovementScope) => ({
      pieceVersionId: scope.pieceVersionId,
    }),
  },
  movement: {
    delegateKey: "movement",
    rankField: "rank",
    scopeField: "pieceVersionId",
    getWhereScope: (scope: MovementScope) => ({
      pieceVersionId: scope.pieceVersionId,
    }),
  },
  Section: {
    delegateKey: "section",
    rankField: "rank",
    scopeField: "movementId",
    getWhereScope: (scope: SectionScope) => ({
      movementId: scope.movementId,
    }),
  },
  section: {
    delegateKey: "section",
    rankField: "rank",
    scopeField: "movementId",
    getWhereScope: (scope: SectionScope) => ({
      movementId: scope.movementId,
    }),
  },
  Piece: {
    delegateKey: "piece",
    rankField: "collectionRank",
    scopeField: "collectionId",
    getWhereScope: (scope: PieceScope) => ({
      collectionId: scope.collectionId,
    }),
  },
  piece: {
    delegateKey: "piece",
    rankField: "collectionRank",
    scopeField: "collectionId",
    getWhereScope: (scope: PieceScope) => ({
      collectionId: scope.collectionId,
    }),
  },
};

/**
 * Transactional Prisma helper to apply rank permutations without unique constraint collisions.
 *
 * Algorithm (2-phase write):
 * 1. Update items whose rank is changing to temporary out-of-range ranks (max(ranks) + 1000 + offset)
 *    to vacate target ordered slots.
 * 2. Update items to their final target ranks.
 *
 * Supported models & constraints:
 * - MMSourcesOnPieceVersions: @@unique([mMSourceId, rank])
 * - Movement: @@unique([pieceVersionId, rank])
 * - Section: @@unique([movementId, rank])
 * - Piece: @@unique([collectionId, collectionRank])
 */
export async function applyRankUpdatesInTwoPhases(
  tx: PrismaTx,
  params: ApplyRankUpdatesParams,
): Promise<ApplyRankUpdatesResult> {
  const { model, updates, scope } = params;

  if (!updates || updates.length === 0) {
    return { updatedCount: 0 };
  }

  const config = MODEL_CONFIGS[model];
  if (!config) {
    throw new Error(
      `[applyRankUpdatesInTwoPhases] Unsupported model: ${String(model)}`,
    );
  }

  const whereScope = config.getWhereScope(scope);
  const scopeValue = (whereScope as Record<string, string>)[config.scopeField];
  if (!scopeValue) {
    throw new Error(
      `[applyRankUpdatesInTwoPhases] Missing required scope field "${config.scopeField}" for model ${model}`,
    );
  }

  // Check for duplicate target ranks in inputs
  const targetRanks = new Set<number>();
  for (const u of updates) {
    if (targetRanks.has(u.rank)) {
      throw new Error(
        `[applyRankUpdatesInTwoPhases] Duplicate target rank ${u.rank} in updates for model ${model}`,
      );
    }
    targetRanks.add(u.rank);
  }

  const delegate = (tx as any)[config.delegateKey];
  if (!delegate) {
    throw new Error(
      `[applyRankUpdatesInTwoPhases] Delegate "${config.delegateKey}" not found on transaction client`,
    );
  }

  // Fetch all existing rows in the scope
  const existingRows: any[] = await delegate.findMany({
    where: whereScope,
    select: {
      id: true,
      [config.rankField]: true,
    },
  });

  const currentRankMap = new Map<string, number | null>();
  const existingRanks: number[] = [];

  for (const row of existingRows) {
    const r = row[config.rankField];
    currentRankMap.set(row.id, r);
    if (typeof r === "number") {
      existingRanks.push(r);
    }
  }

  // Verify all updated IDs exist in scope
  for (const u of updates) {
    if (!currentRankMap.has(u.id)) {
      throw new Error(
        `[applyRankUpdatesInTwoPhases] Record with id "${u.id}" not found in scope for model ${model}`,
      );
    }
  }

  // Filter items that actually need a rank change
  const itemsToUpdate = updates.filter((u) => {
    const currentRank = currentRankMap.get(u.id);
    return currentRank !== u.rank;
  });

  if (itemsToUpdate.length === 0) {
    return { updatedCount: 0 };
  }

  // Compute a safe out-of-range base offset
  const allRanks = [...existingRanks, ...updates.map((u) => u.rank)];
  const maxRank = allRanks.length > 0 ? Math.max(...allRanks) : 0;
  const baseOffset = Math.max(1000, maxRank + 1000);

  // Phase 1: assign temporary out-of-range ranks
  for (let i = 0; i < itemsToUpdate.length; i++) {
    const item = itemsToUpdate[i];
    const tempRank = baseOffset + i + 1;
    await delegate.update({
      where: { id: item.id },
      data: { [config.rankField]: tempRank },
    });
  }

  // Phase 2: assign final target ranks
  for (const item of itemsToUpdate) {
    await delegate.update({
      where: { id: item.id },
      data: { [config.rankField]: item.rank },
    });
  }

  return { updatedCount: itemsToUpdate.length };
}

export default applyRankUpdatesInTwoPhases;
