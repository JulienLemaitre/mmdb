import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/options";
import { db } from "@/utils/server/db";
import {
  REVIEW_STATE,
  REVIEWED_ENTITY_TYPE,
  SOURCE_TYPE,
} from "@/prisma/client/enums";
import { FeedFormState } from "@/types/feedFormTypes";
import {
  ContributionState,
  MMSourceContributionsState,
  MMSourceOnPieceVersionsState,
  MetronomeMarkState,
  PieceState,
  PieceVersionState,
  TempoIndicationState,
} from "@/types/formTypes";
import { GloballyReviewedIds } from "@/types/zodTypes";

export type ReviewBaselineResult = {
  review: {
    id: string;
    creatorId: string;
    state: REVIEW_STATE;
    mMSourceId: string;
  };
  mMSource: {
    id: string;
    title: string | null;
    type: SOURCE_TYPE | null;
    link: string | null;
    permalink: string | null;
    year: number | null;
    isYearEstimated: boolean | null;
    comment: string | null;
    creator: { id: string; name: string | null; email: string | null } | null;
  };
  baseline: FeedFormState;
  globallyReviewed: GloballyReviewedIds;
};

export type GetReviewBaselineOptions = {
  requireOwner?: boolean;
};

/**
 * Loads the review baseline data for a given reviewId.
 * Produces a baseline FeedFormState (without formInfo) alongside review metadata and globallyReviewed IDs.
 */
export async function getReviewBaseline(
  reviewId: string,
  options?: GetReviewBaselineOptions,
): Promise<ReviewBaselineResult> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("[getReviewBaseline] Unauthorized");
  }
  const role = session.user.role;
  if (!role || !["REVIEWER", "ADMIN"].includes(role)) {
    throw new Error("[getReviewBaseline] Forbidden: reviewer role required");
  }

  if (!reviewId) {
    throw new Error("[getReviewBaseline] reviewId is required");
  }

  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: { id: true, creatorId: true, state: true, mMSourceId: true },
  });
  if (!review) {
    throw new Error("[getReviewBaseline] Review not found");
  }

  const isOwner = review.creatorId === session.user.id;
  const requireOwner = options?.requireOwner ?? true;

  if (requireOwner && !isOwner) {
    throw new Error(
      "[getReviewBaseline] Forbidden: only review owner can access this review baseline",
    );
  }

  if (review.state !== REVIEW_STATE.IN_REVIEW) {
    throw new Error("[getReviewBaseline] Review must be IN_REVIEW");
  }

  // Load MM Source graph for the baseline
  const mmSource = await db.mMSource.findUnique({
    where: { id: review.mMSourceId },
    select: {
      id: true,
      title: true,
      type: true,
      link: true,
      permalink: true,
      year: true,
      isYearEstimated: true,
      comment: true,
      creator: { select: { id: true, name: true, email: true } },
      // Source-level references
      references: {
        select: { id: true, type: true, reference: true },
        orderBy: { createdAt: "asc" },
      },
      // Source-level contributions
      contributions: {
        include: {
          person: true,
          organization: true,
        },
        orderBy: { createdAt: "asc" },
      },
      // Join table for source contents
      pieceVersions: {
        select: {
          id: true, // joinId
          rank: true,
          pieceVersionId: true,
          pieceVersion: {
            select: {
              id: true,
              category: true,
              piece: {
                select: {
                  id: true,
                  title: true,
                  nickname: true,
                  yearOfComposition: true,
                  composerId: true,
                  collectionId: true,
                  collectionRank: true,
                },
              },
              movements: {
                select: {
                  id: true,
                  rank: true,
                  key: true,
                  isVariation: true,
                  sections: {
                    select: {
                      id: true,
                      rank: true,
                      metreNumerator: true,
                      metreDenominator: true,
                      isCommonTime: true,
                      isCutTime: true,
                      fastestStructuralNotesPerBar: true,
                      fastestBelCantoNotesPerBar: true,
                      fastestStaccatoNotesPerBar: true,
                      fastestRepeatedNotesPerBar: true,
                      fastestOrnamentalNotesPerBar: true,
                      tempoIndicationId: true,
                      tempoIndication: { select: { id: true, text: true } },
                      comment: true,
                      commentForReview: true,
                    },
                    orderBy: { rank: "asc" },
                  },
                },
                orderBy: { rank: "asc" },
              },
            },
          },
        },
        orderBy: { rank: "asc" },
      },
      // Metronome marks belong to the source
      metronomeMarks: {
        select: {
          id: true,
          beatUnit: true,
          bpm: true,
          comment: true,
          sectionId: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!mmSource) {
    throw new Error("[getReviewBaseline] MM Source not found");
  }

  // Collect ids to query globally reviewed registry and to hydrate collections/persons/organizations/pieces/pieceVersions
  const personIds = new Set<string>();
  const organizationIds = new Set<string>();
  const collectionIds = new Set<string>();
  const pieceIds = new Set<string>();
  const pieceVersionIds = new Set<string>();
  const tempoIndicationIds = new Set<string>();

  for (const c of mmSource.contributions) {
    if (c.personId) personIds.add(c.personId);
    if (c.organizationId) organizationIds.add(c.organizationId);
  }

  for (const join of mmSource.pieceVersions) {
    const pv = join.pieceVersion;
    if (!pv) continue;
    pieceVersionIds.add(pv.id);
    const p = pv.piece;
    if (p) {
      pieceIds.add(p.id);
      if (p.composerId) personIds.add(p.composerId);
      if (p.collectionId) collectionIds.add(p.collectionId);
    }
    for (const m of pv.movements) {
      for (const s of m.sections) {
        if (s.tempoIndication?.id) tempoIndicationIds.add(s.tempoIndication.id);
      }
    }
  }

  const reviewed =
    personIds.size > 0 ||
    organizationIds.size > 0 ||
    collectionIds.size > 0 ||
    pieceIds.size > 0 ||
    pieceVersionIds.size > 0
      ? await db.reviewedEntity.findMany({
          where: {
            OR: [
              ...(personIds.size > 0
                ? [
                    {
                      entityType: REVIEWED_ENTITY_TYPE.PERSON,
                      entityId: { in: Array.from(personIds) },
                    },
                  ]
                : []),
              ...(organizationIds.size > 0
                ? [
                    {
                      entityType: REVIEWED_ENTITY_TYPE.ORGANIZATION,
                      entityId: { in: Array.from(organizationIds) },
                    },
                  ]
                : []),
              ...(collectionIds.size > 0
                ? [
                    {
                      entityType: REVIEWED_ENTITY_TYPE.COLLECTION,
                      entityId: { in: Array.from(collectionIds) },
                    },
                  ]
                : []),
              ...(pieceIds.size > 0
                ? [
                    {
                      entityType: REVIEWED_ENTITY_TYPE.PIECE,
                      entityId: { in: Array.from(pieceIds) },
                    },
                  ]
                : []),
              ...(pieceVersionIds.size > 0
                ? [
                    {
                      entityType: REVIEWED_ENTITY_TYPE.PIECE_VERSION,
                      entityId: { in: Array.from(pieceVersionIds) },
                    },
                  ]
                : []),
            ],
          },
          select: { entityType: true, entityId: true },
        })
      : [];

  const globallyReviewed: GloballyReviewedIds = {
    personIds: reviewed
      .filter((r) => r.entityType === REVIEWED_ENTITY_TYPE.PERSON)
      .map((r) => r.entityId),
    organizationIds: reviewed
      .filter((r) => r.entityType === REVIEWED_ENTITY_TYPE.ORGANIZATION)
      .map((r) => r.entityId),
    collectionIds: reviewed
      .filter((r) => r.entityType === REVIEWED_ENTITY_TYPE.COLLECTION)
      .map((r) => r.entityId),
    pieceIds: reviewed
      .filter((r) => r.entityType === REVIEWED_ENTITY_TYPE.PIECE)
      .map((r) => r.entityId),
    pieceVersionIds: reviewed
      .filter((r) => r.entityType === REVIEWED_ENTITY_TYPE.PIECE_VERSION)
      .map((r) => r.entityId),
  };

  const collections =
    collectionIds.size > 0
      ? await db.collection.findMany({
          where: { id: { in: Array.from(collectionIds) } },
          select: {
            id: true,
            title: true,
            composerId: true,
            _count: {
              select: {
                pieces: true,
              },
            },
          },
        })
      : [];

  const persons =
    personIds.size > 0
      ? await db.person.findMany({
          where: { id: { in: Array.from(personIds) } },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            birthYear: true,
            deathYear: true,
          },
        })
      : [];

  const organizations =
    organizationIds.size > 0
      ? await db.organization.findMany({
          where: { id: { in: Array.from(organizationIds) } },
          select: { id: true, name: true },
        })
      : [];

  const pieces: PieceState[] = Array.from(pieceIds)
    .map((pid) => {
      for (const join of mmSource.pieceVersions) {
        const pv = join.pieceVersion;
        if (pv?.piece?.id === pid) {
          const p = pv.piece;
          const pieceState: PieceState = {
            id: p.id,
            title: p.title,
            nickname: p.nickname ?? null,
            composerId: p.composerId,
            yearOfComposition: p.yearOfComposition ?? null,
            collectionId: p.collectionId ?? null,
            collectionRank: p.collectionRank ?? null,
          };
          return pieceState;
        }
      }
      return undefined;
    })
    .filter((p): p is PieceState => p !== undefined);

  const pieceVersions: PieceVersionState[] = mmSource.pieceVersions
    .map((join) => {
      const pv = join.pieceVersion;
      if (!pv) return null;
      const pvState: PieceVersionState = {
        id: pv.id,
        pieceId: pv.piece?.id ?? "",
        category: pv.category,
        movements: pv.movements.map((m) => ({
          id: m.id,
          rank: m.rank,
          key: m.key ?? null,
          isVariation: m.isVariation ?? false,
          sections: m.sections.map((s) => ({
            id: s.id,
            rank: s.rank,
            metreNumerator: s.metreNumerator,
            metreDenominator: s.metreDenominator,
            isCommonTime: s.isCommonTime,
            isCutTime: s.isCutTime,
            fastestStructuralNotesPerBar:
              s.fastestStructuralNotesPerBar ?? null,
            fastestBelCantoNotesPerBar: s.fastestBelCantoNotesPerBar ?? null,
            fastestStaccatoNotesPerBar: s.fastestStaccatoNotesPerBar ?? null,
            fastestRepeatedNotesPerBar: s.fastestRepeatedNotesPerBar ?? null,
            fastestOrnamentalNotesPerBar:
              s.fastestOrnamentalNotesPerBar ?? null,
            tempoIndicationId: s.tempoIndicationId ?? undefined,
            comment: s.comment ?? null,
            commentForReview: s.commentForReview ?? null,
          })),
        })),
      };
      return pvState;
    })
    .filter((pv): pv is PieceVersionState => pv !== null);

  const tempoIndications: TempoIndicationState[] = Array.from(
    tempoIndicationIds,
  ).map((tiId) => {
    for (const join of mmSource.pieceVersions) {
      for (const m of join.pieceVersion?.movements ?? []) {
        for (const s of m.sections ?? []) {
          if (s.tempoIndication?.id === tiId) {
            return { id: tiId, text: s.tempoIndication.text ?? "" };
          }
        }
      }
    }
    return { id: tiId, text: "" };
  });

  const metronomeMarks: MetronomeMarkState[] = mmSource.metronomeMarks.map(
    (mm) => {
      const sourceOnPieceVersion = mmSource.pieceVersions.find((pv) =>
        pv.pieceVersion?.movements?.some((m) =>
          m.sections?.some((s) => s.id === mm.sectionId),
        ),
      );
      if (!sourceOnPieceVersion || !sourceOnPieceVersion.pieceVersion) {
        throw new Error(
          `[getReviewBaseline] Metronome mark sectionId ${mm.sectionId} not found in pieceVersions`,
        );
      }
      const pieceVersionId = sourceOnPieceVersion.pieceVersion.id;
      if (!mm.beatUnit || mm.bpm == null) {
        return {
          id: mm.id,
          sectionId: mm.sectionId,
          pieceVersionId,
          noMM: true,
        };
      }
      return {
        id: mm.id,
        sectionId: mm.sectionId,
        beatUnit: mm.beatUnit,
        bpm: mm.bpm,
        comment: mm.comment ?? null,
        pieceVersionId,
        noMM: false,
      };
    },
  );

  const mMSourceContributions: MMSourceContributionsState =
    mmSource.contributions
      .map((c): ContributionState | null => {
        if (c.personId) {
          return {
            id: c.id,
            role: c.role,
            personId: c.personId,
          };
        }
        if (c.organizationId) {
          return {
            id: c.id,
            role: c.role,
            organizationId: c.organizationId,
          };
        }
        return null;
      })
      .filter((x): x is ContributionState => x !== null);

  const mMSourceOnPieceVersions: MMSourceOnPieceVersionsState[] =
    mmSource.pieceVersions.map((join) => ({
      pieceVersionId: join.pieceVersion?.id ?? join.pieceVersionId,
      rank: join.rank,
    }));

  const baseline: FeedFormState = {
    mMSourceDescription: {
      id: mmSource.id,
      title: mmSource.title ?? null,
      type: mmSource.type,
      link: mmSource.link ?? null,
      permalink: mmSource.permalink ?? null,
      year: mmSource.year ?? null,
      isYearEstimated: mmSource.isYearEstimated ?? false,
      comment: mmSource.comment ?? null,
      references: mmSource.references.map((r) => ({
        id: r.id,
        type: r.type,
        reference: r.reference,
      })),
    },
    mMSourceContributions,
    mMSourceOnPieceVersions,
    organizations: organizations.map((o) => ({
      id: o.id,
      name: o.name,
    })),
    collections: collections
      .filter((c) => {
        // We keep only a collection if all of its pieces are present in the MM Source.
        const collectionPieceCount = c._count.pieces;
        const collectionPresentPieceCount = pieces.filter(
          (p) => p.collectionId === c.id,
        ).length;

        return collectionPresentPieceCount === collectionPieceCount;
      })
      .map((c) => ({
        id: c.id,
        title: c.title,
        composerId: c.composerId,
        pieceCount: c._count.pieces,
      })),
    persons: persons.map((p) => ({
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      birthYear: p.birthYear,
      deathYear: p.deathYear ?? null,
    })),
    pieces,
    pieceVersions,
    tempoIndications,
    metronomeMarks,
  };

  return {
    review: {
      id: review.id,
      creatorId: review.creatorId,
      state: review.state,
      mMSourceId: review.mMSourceId,
    },
    mMSource: {
      id: mmSource.id,
      title: mmSource.title,
      type: mmSource.type,
      link: mmSource.link,
      permalink: mmSource.permalink,
      year: mmSource.year,
      isYearEstimated: mmSource.isYearEstimated,
      comment: mmSource.comment,
      creator: mmSource.creator,
    },
    baseline,
    globallyReviewed,
  };
}

/**
 * Builds the initial FeedFormState for a review session from the baseline and globally reviewed IDs.
 * Adds isNew flags to entities based on globallyReviewed and sets initial formInfo.
 */
export function buildReviewInitialFeedFormState({
  baseline,
  globallyReviewed,
}: {
  baseline: FeedFormState;
  globallyReviewed: GloballyReviewedIds;
}): FeedFormState {
  return {
    ...baseline,
    formInfo: {
      currentStepRank: 0,
      introDone: false,
      allSourceOnPieceVersionsDone: true,
    },
    persons: baseline.persons?.map((p) => ({
      ...p,
      isNew: !globallyReviewed.personIds.includes(p.id),
    })),
    organizations: baseline.organizations?.map((o) => ({
      ...o,
      isNew: !globallyReviewed.organizationIds.includes(o.id),
    })),
    collections: baseline.collections?.map((c) => ({
      ...c,
      isNew: !globallyReviewed.collectionIds.includes(c.id),
    })),
    pieces: baseline.pieces?.map((p) => ({
      ...p,
      isNew: !globallyReviewed.pieceIds.includes(p.id),
    })),
    pieceVersions: baseline.pieceVersions?.map((pv) => ({
      ...pv,
      isNew: !globallyReviewed.pieceVersionIds.includes(pv.id),
    })),
  };
}
