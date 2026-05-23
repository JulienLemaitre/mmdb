import { db } from "@/utils/server/db";

export type UserStreakData = {
  currentStreak: number;
  longestStreak: number;
  totalWeeksWithGoal: number;
  isCurrentStreakRecord: boolean;
  hasContributedThisWeek: boolean;
};

export type TeamStreakData = {
  currentStreak: number;
  longestStreak: number;
  totalWeeksWithGoal: number;
  isCurrentStreakRecord: boolean;
  hasTeamMetGoalThisWeek: boolean;
};

export type TeamMemberStatus = {
  userId: string;
  userName: string | null;
  email: string | null;
  hasContributedThisWeek: boolean;
  lastContributionDate: Date;
};

export type StreaksResult = {
  user: UserStreakData | null;
  team: TeamStreakData;
  teamMembers: TeamMemberStatus[];
  generatedAt: string;
};

// Helper pour obtenir le numéro de semaine ISO (Lundi au Dimanche) et l'année ISO
function getISOWeekAndYear(date: Date): { week: number; year: number } {
  const tempDate = new Date(date.valueOf());
  tempDate.setHours(0, 0, 0, 0);
  // Jeudi de la semaine en cours détermine l'année ISO
  tempDate.setDate(tempDate.getDate() + 3 - ((tempDate.getDay() + 6) % 7));
  const firstThursday = tempDate.getTime();
  tempDate.setMonth(0, 1);
  if (tempDate.getDay() !== 4) {
    tempDate.setMonth(0, 1 + ((4 - tempDate.getDay() + 7) % 7));
  }
  const week = 1 + Math.round((firstThursday - tempDate.getTime()) / 604800000);
  const year = new Date(firstThursday).getFullYear();
  return { week, year };
}

// Clé unique pour identifier une semaine ISO (ex: "2026-w21")
function getWeekKey(date: Date): string {
  const { week, year } = getISOWeekAndYear(date);
  return `${year}-w${String(week).padStart(2, "0")}`;
}

// Soustraire ou additionner des semaines à une clé de semaine ISO
function getAdjacentWeekKey(weekKey: string, offset: number): string {
  const [yearStr, weekStr] = weekKey.split("-w");
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekStr, 10);

  // Créer un objet date au milieu de la semaine identifiée
  // Jan 4th is always in ISO Week 1
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dayOfWeek = simple.getDay();
  const isoMonday = new Date(simple);
  if (dayOfWeek <= 4) {
    isoMonday.setDate(simple.getDate() - simple.getDay() + 1);
  } else {
    isoMonday.setDate(simple.getDate() + 8 - simple.getDay());
  }

  // Appliquer l'offset
  isoMonday.setDate(isoMonday.getDate() + offset * 7);
  return getWeekKey(isoMonday);
}

export async function getStreaks(
  currentUserId?: string,
): Promise<StreaksResult> {
  // 1. Récupérer toutes les créations de mMSources avec leurs metronomeMarks associés
  const allSources = await db.mMSource.findMany({
    select: {
      id: true,
      creatorId: true,
      createdAt: true,
      metronomeMarks: {
        select: { id: true },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Filtrer pour ne garder que les sources contenant au moins un metronomeMark
  const validContributions = allSources.filter(
    (source) => source.creatorId && source.metronomeMarks.length > 0,
  );

  const now = new Date();
  const currentWeekKey = getWeekKey(now);
  const lastWeekKey = getAdjacentWeekKey(currentWeekKey, -1);

  // Identifier tous les contributeurs ayant déjà fait au moins 1 contribution valide historiquement
  const historicContributors = new Set<string>();
  validContributions.forEach((c) => {
    if (c.creatorId) historicContributors.add(c.creatorId);
  });

  // Associer à chaque utilisateur la liste des clés de semaines où il a contribué
  const userContributionsMap = new Map<string, Set<string>>();
  validContributions.forEach((contrib) => {
    const userId = contrib.creatorId!;
    const weekKey = getWeekKey(contrib.createdAt);

    if (!userContributionsMap.has(userId)) {
      userContributionsMap.set(userId, new Set<string>());
    }
    userContributionsMap.get(userId)!.add(weekKey);
  });

  // --- CALCUL DU STREAK INDIVIDUEL ---
  let userResult: UserStreakData | null = null;

  if (currentUserId && userContributionsMap.has(currentUserId)) {
    const userWeeks = Array.from(
      userContributionsMap.get(currentUserId)!,
    ).sort();

    let currentStreak = 0;
    let longestStreak = 0;
    const totalWeeksWithGoal = userWeeks.length;
    const hasContributedThisWeek = userWeeks.includes(currentWeekKey);

    // Calcul des streaks à rebours ou à l'endroit
    if (userWeeks.length > 0) {
      // 1. Calcul du streak en cours
      let checkKey = currentWeekKey;
      if (userWeeks.includes(checkKey)) {
        while (userWeeks.includes(checkKey)) {
          currentStreak++;
          checkKey = getAdjacentWeekKey(checkKey, -1);
        }
      } else {
        // Si pas de contribution cette semaine, on vérifie si la série s'est arrêtée juste la semaine dernière
        checkKey = lastWeekKey;
        while (userWeeks.includes(checkKey)) {
          currentStreak++;
          checkKey = getAdjacentWeekKey(checkKey, -1);
        }
      }

      // 2. Calcul du streak maximum historique (longest streak)
      let tempStreak = 0;
      let prevKey: string | null = null;

      // Trier les semaines pour calculer séquentiellement
      const sortedWeeks = [...userWeeks].sort();
      for (const weekKey of sortedWeeks) {
        if (prevKey === null) {
          tempStreak = 1;
        } else if (getAdjacentWeekKey(prevKey, 1) === weekKey) {
          tempStreak++;
        } else if (prevKey !== weekKey) {
          if (tempStreak > longestStreak) {
            longestStreak = tempStreak;
          }
          tempStreak = 1;
        }
        prevKey = weekKey;
      }
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    }

    userResult = {
      currentStreak,
      longestStreak,
      totalWeeksWithGoal,
      isCurrentStreakRecord:
        currentStreak > 0 && currentStreak >= longestStreak,
      hasContributedThisWeek,
    };
  } else if (currentUserId) {
    // L'utilisateur est connecté mais n'a pas encore fait de contribution valide
    userResult = {
      currentStreak: 0,
      longestStreak: 0,
      totalWeeksWithGoal: 0,
      isCurrentStreakRecord: false,
      hasContributedThisWeek: false,
    };
  }

  // --- CALCUL DU STREAK COLLECTIF (TEAM STREAK) ---
  // Nous définissons l'équipe comme l'ensemble des contributeurs historiques.
  // Une semaine collective est réussie si CHACUN de ces contributeurs historiques y a entré au moins 1 métronome.
  // Pour éviter d'attendre que des anciens membres inactifs contribuent, nous filtrons l'équipe active :
  // Définissons les membres actifs comme ceux ayant contribué au moins 1 fois sur les 4 dernières semaines calendaires.
  const activeCutoffDate = new Date();
  activeCutoffDate.setDate(now.getDate() - 30); // 30 jours d'inactivité max

  const activeContributors = new Set<string>();
  validContributions.forEach((c) => {
    if (c.creatorId && c.createdAt >= activeCutoffDate) {
      activeContributors.add(c.creatorId);
    }
  });

  // Si aucun membre n'est actif sur les 30 derniers jours, on prend tous les contributeurs historiques
  const teamMembersToConsider =
    activeContributors.size > 0 ? activeContributors : historicContributors;

  // Récupérer les informations d'utilisateur (noms et emails) pour les membres considérés
  const dbUsers = await db.user.findMany({
    where: {
      id: { in: Array.from(teamMembersToConsider) },
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  // Associer à chaque utilisateur sa date de dernière contribution
  const lastContributionMap = new Map<string, Date>();
  validContributions.forEach((c) => {
    if (c.creatorId) {
      const existing = lastContributionMap.get(c.creatorId);
      if (!existing || c.createdAt > existing) {
        lastContributionMap.set(c.creatorId, c.createdAt);
      }
    }
  });

  const teamMembers: TeamMemberStatus[] = dbUsers.map((u) => {
    const memberWeeks = userContributionsMap.get(u.id);
    return {
      userId: u.id,
      userName: u.name,
      email: u.email,
      hasContributedThisWeek: memberWeeks
        ? memberWeeks.has(currentWeekKey)
        : false,
      lastContributionDate: lastContributionMap.get(u.id) ?? new Date(0),
    };
  });

  // Trouver la liste complète et chronologique de toutes les semaines de contributions de la base de données
  const allWeeksSet = new Set<string>();
  validContributions.forEach((c) => allWeeksSet.add(getWeekKey(c.createdAt)));
  const sortedAllWeeks = Array.from(allWeeksSet).sort();

  const teamSuccessfulWeeks = new Set<string>();

  for (const weekKey of sortedAllWeeks) {
    // Si la semaine est dans le futur par rapport aux données, on l'ignore
    let allMetGoal = true;

    if (teamMembersToConsider.size === 0) {
      allMetGoal = false;
    } else {
      for (const memberId of teamMembersToConsider) {
        const memberWeeks = userContributionsMap.get(memberId);
        if (!memberWeeks || !memberWeeks.has(weekKey)) {
          allMetGoal = false;
          break;
        }
      }
    }

    if (allMetGoal) {
      teamSuccessfulWeeks.add(weekKey);
    }
  }

  // Calcul du streak collectif
  let teamCurrentStreak = 0;
  let teamLongestStreak = 0;
  const teamTotalWeeksWithGoal = teamSuccessfulWeeks.size;
  const hasTeamMetGoalThisWeek = teamSuccessfulWeeks.has(currentWeekKey);

  if (teamSuccessfulWeeks.size > 0) {
    // 1. Calcul du streak collectif en cours
    let checkKey = currentWeekKey;
    if (teamSuccessfulWeeks.has(checkKey)) {
      while (teamSuccessfulWeeks.has(checkKey)) {
        teamCurrentStreak++;
        checkKey = getAdjacentWeekKey(checkKey, -1);
      }
    } else {
      checkKey = lastWeekKey;
      while (teamSuccessfulWeeks.has(checkKey)) {
        teamCurrentStreak++;
        checkKey = getAdjacentWeekKey(checkKey, -1);
      }
    }

    // 2. Calcul du streak collectif maximum historique
    let tempTeamStreak = 0;
    let prevTeamKey: string | null = null;
    const sortedTeamWeeks = Array.from(teamSuccessfulWeeks).sort();

    for (const weekKey of sortedTeamWeeks) {
      if (prevTeamKey === null) {
        tempTeamStreak = 1;
      } else if (getAdjacentWeekKey(prevTeamKey, 1) === weekKey) {
        tempTeamStreak++;
      } else if (prevTeamKey !== weekKey) {
        if (tempTeamStreak > teamLongestStreak) {
          teamLongestStreak = tempTeamStreak;
        }
        tempTeamStreak = 1;
      }
      prevTeamKey = weekKey;
    }
    if (tempTeamStreak > teamLongestStreak) {
      teamLongestStreak = tempTeamStreak;
    }
  }

  const teamResult: TeamStreakData = {
    currentStreak: teamCurrentStreak,
    longestStreak: teamLongestStreak,
    totalWeeksWithGoal: teamTotalWeeksWithGoal,
    isCurrentStreakRecord:
      teamCurrentStreak > 0 && teamCurrentStreak >= teamLongestStreak,
    hasTeamMetGoalThisWeek,
  };

  return {
    user: userResult,
    team: teamResult,
    teamMembers,
    generatedAt: now.toISOString(),
  };
}
