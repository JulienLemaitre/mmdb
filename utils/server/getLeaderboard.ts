import { db } from "@/utils/server/db";
import { REVIEW_STATE } from "@/prisma/client";

export type LeaderboardPeriod = "week" | "month" | "all_time";

export type LeaderboardItem = {
  userId: string;
  userName: string | null;
  email: string | null;
  role: string | null;
  metronomeMarksEntered: number;
  metronomeMarksReviewed: number;
  totalActivity: number;
  rank: number;
};

export type LeaderboardResult = {
  period: LeaderboardPeriod;
  items: LeaderboardItem[];
  generatedAt: string;
};

function getDateRangeForPeriod(period: LeaderboardPeriod): {
  start: Date;
  end: Date;
} {
  const now = new Date();
  const end = new Date();

  let start: Date;
  if (period === "week") {
    start = new Date(now);
    start.setDate(now.getDate() - now.getDay()); // Début de la semaine
  } else if (period === "month") {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    start = new Date(0); // Début des temps
  }

  return { start, end };
}

export async function getLeaderboard(
  period: LeaderboardPeriod = "month",
): Promise<LeaderboardResult> {
  const { start, end } = getDateRangeForPeriod(period);

  // 1. Récupérer les utilisateurs actifs sur la période + leurs sources créées
  const usersWithMM = await db.user.findMany({
    where: {
      mMSources: {
        some: {
          createdAt: { gte: start, lte: end },
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      mMSources: {
        where: {
          createdAt: { gte: start, lte: end },
        },
        select: {
          metronomeMarks: {
            where: {
              createdAt: { gte: start, lte: end },
            },
            select: { id: true },
          },
        },
      },
    },
  });

  // 2. Récupérer les reviews approuvées créées par les éditeurs/revues sur la période
  const reviewsByUser = await db.review.findMany({
    where: {
      state: REVIEW_STATE.APPROVED,
      startedAt: { gte: start, lte: end },
    },
    select: {
      creatorId: true,
      mMSource: {
        select: {
          metronomeMarks: {
            select: { id: true },
          },
        },
      },
    },
  });

  // 3. Associer et compter les métronomes revus par utilisateur
  const reviewedByUser = new Map<string, number>();
  for (const review of reviewsByUser) {
    const currentCount = reviewedByUser.get(review.creatorId) ?? 0;
    const mmCount = review.mMSource?.metronomeMarks?.length ?? 0;
    reviewedByUser.set(review.creatorId, currentCount + mmCount);
  }

  // 4. Fusionner les données de création et de review
  const itemsMap = new Map<string, LeaderboardItem>();

  // Ajouter d'abord les créateurs
  for (const user of usersWithMM) {
    const mmEntered = user.mMSources.reduce(
      (sum, source) => sum + source.metronomeMarks.length,
      0,
    );
    const mmReviewed = reviewedByUser.get(user.id) ?? 0;

    itemsMap.set(user.id, {
      userId: user.id,
      userName: user.name,
      email: user.email,
      role: user.role,
      metronomeMarksEntered: mmEntered,
      metronomeMarksReviewed: mmReviewed,
      totalActivity: mmEntered + mmReviewed,
      rank: 0,
    });
  }

  // Ajouter les reviewers qui n'auraient pas créé de sources sur la même période
  for (const [reviewerId, mmReviewed] of reviewedByUser.entries()) {
    if (!itemsMap.has(reviewerId)) {
      const user = await db.user.findUnique({
        where: { id: reviewerId },
        select: { name: true, email: true, role: true },
      });

      if (user) {
        itemsMap.set(reviewerId, {
          userId: reviewerId,
          userName: user.name,
          email: user.email,
          role: user.role,
          metronomeMarksEntered: 0,
          metronomeMarksReviewed: mmReviewed,
          totalActivity: mmReviewed,
          rank: 0,
        });
      }
    }
  }

  // 5. Transformer en liste, trier par activité totale et attribuer le rang
  const items: LeaderboardItem[] = Array.from(itemsMap.values())
    .sort((a, b) => b.totalActivity - a.totalActivity)
    .map((item, index) => ({ ...item, rank: index + 1 }));

  return {
    period,
    items,
    generatedAt: new Date().toISOString(),
  };
}
