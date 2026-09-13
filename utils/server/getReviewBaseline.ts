import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/options";
import { db } from "@/utils/server/db";
import {
  REVIEW_STATE,
  REVIEWED_ENTITY_TYPE,
  SOURCE_TYPE,
} from "@/prisma/client/enums";
import { FeedFormState } from "@/types/feedFormTypes";
import { GloballyReviewedIds } from "@/types/zodTypes";
import { getSourceFeedFormBaseline } from "@/utils/server/getSourceFeedFormBaseline";

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

  const baselineData = await getSourceFeedFormBaseline(review.mMSourceId);
  if (!baselineData) {
    throw new Error("[getReviewBaseline] MM Source not found");
  }

  const {
    baseline,
    mMSource,
    personIds,
    organizationIds,
    collectionIds,
    pieceIds,
    pieceVersionIds,
  } = baselineData;

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

  return {
    review: {
      id: review.id,
      creatorId: review.creatorId,
      state: review.state,
      mMSourceId: review.mMSourceId,
    },
    mMSource: {
      id: mMSource.id,
      title: mMSource.title,
      type: mMSource.type,
      link: mMSource.link,
      permalink: mMSource.permalink,
      year: mMSource.year,
      isYearEstimated: mMSource.isYearEstimated,
      comment: mMSource.comment,
      creator: mMSource.creator,
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
