## Me
Le projet est une interface qui permet à des utilisateurs enregistrés d'entrer des données dans une base de données, concernant les éléments de partitions relatifs aux tempos, aux structures de temps et aux numéros de métronome, afin de calculer des vitesses d'exécution maximale.

Nous avons une petite équipe d'éditeurs qui entrent les données pour le moment.
Quelques-uns ont aussi un role leur permettant de faire la revue des données entrées, car tout doit être revu une seconde fois.

Je souhaite mettre en place un "leaderboard" avec classement par semaine et par mois des utilisateurs les plus actifs.
L'élément à mesurer pour cela est le nombre de numéros de métronome (metronome marks) entrés ou revus.

Je pense aussi à des badges acquis selon le volume d'activité et la régularité des éditeurs. Nous avons par exemple un objectif d'au minimum un numéro de métronome entré par semaine. Il pourrait y avoir un décompte du nombre de semaines de suite ou l'objectif est atteint pour chaque utilisateur. (donc moins la compétition qu'une récompense à la constance.

Voici mon schéma de base de données Prisma (PostgreSQL) : @file:schema.prisma
Voici un exemple de requête actuelle sur les utilisateurs qui alimente une page de tableau de bord d'admin : @file:getAdminUsers.ts

Je me dis que je peux certainement commencer avec simplement une requête en base de données qui rassemble ces données, ou si c'est nécessaire une VIEW en base de donnée.

Si je veux "gamifier" un peu plus, j'aurais sans doute besoin d'enregistrer quelques données concernant le leaderboard, au moins les badges acquis par les utilisateurs sur certains critères.

Quelle approche pragmatique et la plus légère possible puis-je prendre pour mettre cela en place, étape par étape ? C'est un projet auquel je contribue sur mon temps libre, c'est pourquoi je cherche l'approche la plus simple et légère possible.

## AI Assistant
Je vais vous proposer une approche pragmatique et légère pour mettre en place cette gamification. Commençons par examiner votre schéma et votre structure actuelle.Excellente question ! Je vais vous proposer une approche **pragmatique et progressive** pour mettre en place votre système de gamification sans surcharger votre projet.

##  Analyse du contexte

À partir de votre schéma, j'observe que :
- Les `MetronomeMark` sont créés/modifiés par des utilisateurs
- Vous avez un système de `Review` avec des rôles (créateurs et reviewers)
- Vous pouvez déjà compter les métronomes entrés ou revus par utilisateur

##  Approche progressive recommandée

### **Étape 1 : Vue de base (Leaderboard simple) - SEMAINE 1**
Commencer par une **requête SQL / fonction Prisma** sans modification du schéma.

### **Étape 2 : Gamification légère (Badges) - SEMAINE 2-3**
Ajouter un **modèle minimal** pour persister les badges.

### **Étape 3 : Streak tracker - SEMAINE 3-4**
Ajouter tracking des semaines consécutives.

---

##  Étape 1 : Requête Leaderboard basique

Créez un nouveau fichier `getLeaderboard.ts` :

```typescript
// utils/server/admin/getLeaderboard.ts

import { db } from "@/utils/server/db";

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
  period: LeaderboardPeriod = "week",
): Promise<LeaderboardResult> {
  const { start, end } = getDateRangeForPeriod(period);

  // Comptabiliser les métronomes entrés (créés)
  const mmEntered = await db.metronomeMark.groupBy({
    by: ["mMSource"],
    where: {
      createdAt: { gte: start, lte: end },
    },
    _count: { id: true },
  });

  // Récupérer les utilisateurs + leurs MMSources créées
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
          id: true,
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

  // Comptabiliser les métronomes revus
  const mmReviewed = await db.review.groupBy({
    by: ["creatorId"],
    where: {
      startedAt: { gte: start, lte: end },
      state: "APPROVED",
    },
    _count: { id: true },
  });

  const reviewCountMap = new Map<string, number>();
  for (const row of mmReviewed) {
    reviewCountMap.set(row.creatorId, row._count.id);
  }

  // Construire les résultats
  const items: LeaderboardItem[] = usersWithMM
    .map((user) => {
      const mmCount = user.mMSources.reduce(
        (sum, source) => sum + source.metronomeMarks.length,
        0,
      );
      const reviewCount = reviewCountMap.get(user.id) ?? 0;

      return {
        userId: user.id,
        userName: user.name,
        email: user.email,
        role: user.role,
        metronomeMarksEntered: mmCount,
        metronomeMarksReviewed: reviewCount,
        totalActivity: mmCount + reviewCount,
        rank: 0, // À remplir après tri
      };
    })
    .sort((a, b) => b.totalActivity - a.totalActivity)
    .map((item, index) => ({ ...item, rank: index + 1 }));

  return {
    period,
    items,
    generatedAt: new Date().toISOString(),
  };
}
```


**Utilisation** :
```typescript
const leaderboard = await getLeaderboard("week");
```


---

##  Étape 2 : Modèle pour les Badges

Ajoutez d'abord au schéma Prisma :

```prisma
// ... existing code ...

enum BADGE_TYPE {
  FIRST_MARK // Premier métronome entré
  WEEKLY_CONTRIBUTOR // 1+ métronome par semaine
  CONSISTENT_CONTRIBUTOR_4W // 4 semaines de suite
  CONSISTENT_CONTRIBUTOR_12W // 12 semaines de suite
  REVIEW_EXPERT // 10 reviews approuvés
  POWER_CONTRIBUTOR // 50 métronomes entrés
}

model UserBadge {
  id        String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    String    @db.Uuid
  type      BADGE_TYPE
  awardedAt DateTime  @default(now())
  createdAt DateTime  @default(now())

  @@unique([userId, type])
  @@index([userId])
}

model UserStreak {
  id                    String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId                String   @db.Uuid
  currentWeekStreak     Int      @default(0)
  lastContributionWeek  Int? // ISO week number
  lastContributionYear  Int? // ISO year
  longestWeekStreak     Int      @default(0)
  longestStreakEndDate  DateTime?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@unique([userId])
}

// ... existing code ...

model User {
  // ... existing code ...
  badges   UserBadge[]
  streak   UserStreak?

  // ... existing code ...
}
```


Ensuite, générez les fichiers Prisma :
```shell script
npx prisma migrate dev --name add_badges_system
```


---

##  Étape 3 : Service de mise à jour des Badges

Créez `utils/server/admin/updateUserBadges.ts` :

```typescript
// utils/server/admin/updateUserBadges.ts

import { db } from "@/utils/server/db";
import type { BADGE_TYPE } from "@prisma/client";

/**
 * Fonction pour vérifier et attribuer les badges aux utilisateurs
 * À appeler périodiquement (par cron ou au moment de chaque contribution)
 */
export async function updateUserBadges(userId: string): Promise<BADGE_TYPE[]> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      mMSources: { select: { id: true, createdAt: true } },
      reviews: { select: { id: true, state: true } },
    },
  });

  if (!user) return [];

  const badgesAwarded: BADGE_TYPE[] = [];

  // Badge 1 : FIRST_MARK
  if (user.mMSources.length === 1) {
    await awardBadgeIfNotExists(userId, "FIRST_MARK");
    badgesAwarded.push("FIRST_MARK");
  }

  // Badge 2 : REVIEW_EXPERT
  const approvedReviews = user.reviews.filter(
    (r) => r.state === "APPROVED",
  ).length;
  if (approvedReviews >= 10) {
    await awardBadgeIfNotExists(userId, "REVIEW_EXPERT");
    badgesAwarded.push("REVIEW_EXPERT");
  }

  // Badge 3 : POWER_CONTRIBUTOR
  const totalMarks = user.mMSources.length;
  if (totalMarks >= 50) {
    await awardBadgeIfNotExists(userId, "POWER_CONTRIBUTOR");
    badgesAwarded.push("POWER_CONTRIBUTOR");
  }

  return badgesAwarded;
}

async function awardBadgeIfNotExists(
  userId: string,
  badgeType: BADGE_TYPE,
): Promise<void> {
  await db.userBadge.upsert({
    where: { userId_type: { userId, type: badgeType } },
    update: {},
    create: { userId, type: badgeType },
  });
}

/**
 * Vérifie et met à jour les streaks hebdomadaires
 * À appeler une fois par semaine (lundi matin)
 */
export async function updateWeeklyStreaks(): Promise<void> {
  const users = await db.user.findMany({
    select: {
      id: true,
      mMSources: {
        select: { createdAt: true },
        where: { createdAt: { gte: getStartOfCurrentWeek() } },
      },
      streak: true,
    },
  });

  for (const user of users) {
    const hasCurrentWeekContribution = user.mMSources.length > 0;
    const currentWeekNumber = getISOWeek(new Date());
    const currentYear = new Date().getFullYear();

    if (!user.streak) {
      // Créer le streak s'il n'existe pas
      await db.userStreak.create({
        data: {
          userId: user.id,
          currentWeekStreak: hasCurrentWeekContribution ? 1 : 0,
          lastContributionWeek: hasCurrentWeekContribution
            ? currentWeekNumber
            : undefined,
          lastContributionYear: hasCurrentWeekContribution
            ? currentYear
            : undefined,
        },
      });
    } else if (hasCurrentWeekContribution) {
      // Mettre à jour le streak
      const wasLastWeek =
        user.streak.lastContributionWeek === currentWeekNumber - 1 &&
        user.streak.lastContributionYear === currentYear;

      const newStreak = wasLastWeek
        ? user.streak.currentWeekStreak + 1
        : 1;

      await db.userStreak.update({
        where: { userId: user.id },
        data: {
          currentWeekStreak: newStreak,
          lastContributionWeek: currentWeekNumber,
          lastContributionYear: currentYear,
          longestWeekStreak:
            newStreak > user.streak.longestWeekStreak
              ? newStreak
              : user.streak.longestWeekStreak,
          ...(newStreak > user.streak.longestWeekStreak && {
            longestStreakEndDate: new Date(),
          }),
        },
      });

      // Attribuer les badges de streak
      if (newStreak === 4) {
        await awardBadgeIfNotExists(userId, "CONSISTENT_CONTRIBUTOR_4W");
      }
      if (newStreak === 12) {
        await awardBadgeIfNotExists(userId, "CONSISTENT_CONTRIBUTOR_12W");
      }
    }
  }
}

function getStartOfCurrentWeek(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // S'ajuste pour lundi
  return new Date(now.setDate(diff));
}

function getISOWeek(date: Date): number {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  return (
    1 +
    Math.round((firstThursday - target.valueOf()) / (24 * 3600 * 1000) / 7)
  );
}
```


---

##  Étape 4 : API Route pour le Leaderboard

Créez `app/api/admin/leaderboard/route.ts` :

```typescript
import { getLeaderboard } from "@/utils/server/admin/getLeaderboard";
import { hasMinimalRole } from "@/utils/server/hasMinimalRole";
import { getDecodedTokenFromReq } from "@/utils/server/getDecodedTokenFromReq";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const token = await getDecodedTokenFromReq(req);
    const isAdmin = await hasMinimalRole(token?.sub, "ADMIN");

    if (!isAdmin) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const period = (req.nextUrl.searchParams.get("period") as any) ?? "week";
    const leaderboard = await getLeaderboard(period);

    return Response.json(leaderboard);
  } catch (error) {
    return Response.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```


---

##  Étape 5 : Automatisation avec Cron (optionnel mais recommandé)

Utilisez **Vercel Crons** ou une tâche `node-cron` locale :

```typescript
// lib/cron.ts
import { updateWeeklyStreaks } from "@/utils/server/admin/updateUserBadges";

export async function runWeeklyBadgeUpdate() {
  try {
    await updateWeeklyStreaks();
    console.log("✅ Weekly badges updated");
  } catch (error) {
    console.error("❌ Badge update failed:", error);
  }
}
```


---

##  Résumé de l'approche

| Étape | Effort | Impact | Dépendances |
|-------|--------|--------|------------|
| 1️⃣ Requête leaderboard | ⭐ | Tableau de bord immédiat | Aucune |
| 2️⃣ Modèle badges | ⭐⭐ | Système gamifié | Migration Prisma |
| 3️⃣ Service badges | ⭐⭐ | Attribution auto | Étape 2 |
| 4️⃣ API route | ⭐ | Accessible frontend | Étape 1 |
| 5️⃣ Cron jobs | ⭐⭐⭐ | Complètement auto | Étape 3 |

---

## ✅ Recommandations

1. **Commencez par l'Étape 1** : Vous avez instantanément un leaderboard sans migration BD
2. **Testez manuellement les requêtes** avant de migrer
3. **Ajoutez des badges simples d'abord** (FIRST_MARK, POWER_CONTRIBUTOR)
4. **Laissez la cron pour plus tard** quand vous aurez du trafic

Cette approche vous permet d'itérer rapidement et d'ajuster selon le feedback réel. 