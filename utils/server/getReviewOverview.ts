import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/options";
import { db } from "@/utils/db";
import { REVIEW_STATE, REVIEWED_ENTITY_TYPE } from "@prisma/client";
import { ChecklistGraph } from "@/utils/ReviewChecklistSchema";

/**
 * Returns the real overview data for a given reviewId.
 * Throws on authorization or data errors—caller should handle and convert to HTTP responses.
 */
export async function getReviewOverview(reviewId: string): Promise<{
  graph: ChecklistGraph;
  globallyReviewed: {
    personIds: string[];
    organizationIds: string[];
    collectionIds: string[];
    pieceIds: string[];
  };
}> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }
  const role = session.user.role;
  if (!role || !["REVIEWER", "ADMIN"].includes(role)) {
    throw new Error("Forbidden: reviewer role required");
  }

  if (!reviewId) {
    throw new Error("reviewId is required");
  }

  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: { id: true, creatorId: true, state: true, mMSourceId: true },
  });
  if (!review) {
    throw new Error("Review not found");
  }

  const isOwner = review.creatorId === session.user.id;
  const isAdmin = role === "ADMIN";
  if (!isOwner && !isAdmin) {
    throw new Error(
      "Forbidden: only review owner or admin can access this overview",
    );
  }

  if (review.state !== REVIEW_STATE.IN_REVIEW) {
    throw new Error("Review must be IN_REVIEW");
  }

  // Load MM Source graph for the overview
  const mmSource = await db.mMSource.findUnique({
    where: { id: review.mMSourceId },
    select: {
      id: true,
      title: true,
      type: true,
      link: true,
      permalink: true,
      year: true,
      comment: true,
      // Source-level references
      references: {
        select: { id: true, type: true, reference: true },
        orderBy: { createdAt: "asc" },
      },
      // Source-level contributions
      contributions: {
        select: { id: true, personId: true, organizationId: true, role: true },
        orderBy: { createdAt: "asc" },
      },
      // Join table for source contents; requires an id on the join
      pieceVersions: {
        select: {
          id: true, // joinId on MMSourcesOnPieceVersions
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
                  sections: {
                    select: {
                      id: true,
                      rank: true,
                      metreNumerator: true,
                      metreDenominator: true,
                      isCommonTime: true,
                      isCutTime: true,
                      fastestStructuralNotesPerBar: true,
                      fastestStaccatoNotesPerBar: true,
                      fastestRepeatedNotesPerBar: true,
                      fastestOrnamentalNotesPerBar: true,
                      isFastestStructuralNoteBelCanto: true,
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
    throw new Error("MM Source not found");
  }

  // Collect ids to query globally reviewed registry and to hydrate collections/persons/orgs
  const personIds = new Set<string>();
  const organizationIds = new Set<string>();
  const collectionIds = new Set<string>();
  const pieceIds = new Set<string>();
  const tempoIndicationIds = new Set<string>();

  // From contributions
  for (const c of mmSource.contributions) {
    if (c.personId) personIds.add(c.personId);
    if (c.organizationId) organizationIds.add(c.organizationId);
  }

  // From source contents (piece graph)
  for (const join of mmSource.pieceVersions) {
    const pv = join.pieceVersion;
    if (!pv) continue;
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

  // Lookup globally reviewed registry
  const reviewed = await db.reviewedEntity.findMany({
    where: {
      OR: [
        {
          entityType: REVIEWED_ENTITY_TYPE.PERSON,
          entityId: { in: Array.from(personIds) },
        },
        {
          entityType: REVIEWED_ENTITY_TYPE.ORGANIZATION,
          entityId: { in: Array.from(organizationIds) },
        },
        {
          entityType: REVIEWED_ENTITY_TYPE.COLLECTION,
          entityId: { in: Array.from(collectionIds) },
        },
        {
          entityType: REVIEWED_ENTITY_TYPE.PIECE,
          entityId: { in: Array.from(pieceIds) },
        },
      ],
    },
    select: { entityType: true, entityId: true },
  });

  const globallyReviewed = {
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
  };

  // Hydrate collections used by pieces
  const collections =
    collectionIds.size > 0
      ? await db.collection.findMany({
          where: { id: { in: Array.from(collectionIds) } },
          select: { id: true, title: true, composerId: true },
        })
      : [];

  // Hydrate persons (composer + contributions)
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

  // Hydrate organizations appearing in contributions
  const organizations =
    organizationIds.size > 0
      ? await db.organization.findMany({
          where: { id: { in: Array.from(organizationIds) } },
          select: { id: true, name: true },
        })
      : [];

  // Flatten graph to ChecklistGraph shape
  const pieces = Array.from(pieceIds).map((pid) => {
    // find a representative pv that has this piece to read piece metadata (all should match same piece row)
    for (const join of mmSource.pieceVersions) {
      const pv = join.pieceVersion;
      if (pv?.piece?.id === pid) {
        const p = pv.piece;
        return {
          id: p.id,
          title: p.title ?? null,
          nickname: p.nickname ?? null,
          composerId: p.composerId ?? null,
          yearOfComposition: p.yearOfComposition ?? null,
          collectionId: p.collectionId ?? null,
          collectionRank: p.collectionRank ?? null,
        };
      }
    }
    // Fallback if not found (should not happen)
    return {
      id: pid,
      title: null,
      nickname: null,
      composerId: null,
      yearOfComposition: null,
      collectionId: null,
      collectionRank: null,
    };
  });

  const pieceVersions = mmSource.pieceVersions.map((join) => ({
    id: join.pieceVersion?.id ?? join.pieceVersionId,
    pieceId: join.pieceVersion?.piece?.id ?? null,
    category: join.pieceVersion?.category ?? null,
  }));

  const movements = mmSource.pieceVersions.flatMap((join) =>
    (join.pieceVersion?.movements ?? []).map((m) => ({
      id: m.id,
      pieceVersionId: join.pieceVersion?.id ?? join.pieceVersionId,
      rank: m.rank,
      key: m.key ?? null,
    })),
  );

  const sections = mmSource.pieceVersions.flatMap((join) =>
    (join.pieceVersion?.movements ?? []).flatMap((m) =>
      (m.sections ?? []).map((s) => ({
        id: s.id,
        movementId: m.id,
        rank: s.rank,
        metreNumerator: s.metreNumerator,
        metreDenominator: s.metreDenominator,
        isCommonTime: s.isCommonTime,
        isCutTime: s.isCutTime,
        fastestStructuralNotesPerBar: s.fastestStructuralNotesPerBar,
        fastestStaccatoNotesPerBar: s.fastestStaccatoNotesPerBar,
        fastestRepeatedNotesPerBar: s.fastestRepeatedNotesPerBar,
        fastestOrnamentalNotesPerBar: s.fastestOrnamentalNotesPerBar,
        isFastestStructuralNoteBelCanto: s.isFastestStructuralNoteBelCanto,
        tempoIndicationId: s.tempoIndicationId,
        comment: s.comment ?? "",
        commentForReview: s.commentForReview ?? "",
      })),
    ),
  );

  // Deduplicate tempo indications collected from sections
  const tempoIndications = Array.from(tempoIndicationIds).map((tiId) => {
    // find first occurrence with text
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

  const metronomeMarks = mmSource.metronomeMarks.map((mm) => ({
    id: mm.id,
    sectionId: mm.sectionId,
    beatUnit: mm.beatUnit,
    bpm: mm.bpm,
    comment: mm.comment ?? "",
  }));

  const sourceContents = mmSource.pieceVersions.map((join) => ({
    joinId: join.id,
    mMSourceId: mmSource.id,
    pieceVersionId: join.pieceVersion?.id ?? join.pieceVersionId,
    rank: join.rank,
    pieceId: join.pieceVersion?.piece?.id ?? null,
    collectionId: join.pieceVersion?.piece?.collectionId ?? undefined,
    collectionRank: join.pieceVersion?.piece?.collectionRank ?? undefined,
  }));

  const graph: ChecklistGraph = {
    source: {
      id: mmSource.id,
      title: mmSource.title ?? null,
      type: (mmSource as any).type ?? null, // keep optional if type isn’t always selected
      link: mmSource.link ?? null,
      permalink: mmSource.permalink ?? null,
      year: mmSource.year ?? null,
      comment: mmSource.comment ?? null,
    },
    collections: collections.map((c) => ({
      id: c.id,
      title: c.title ?? null,
      composerId: c.composerId ?? null,
    })),
    pieces,
    pieceVersions,
    movements,
    sections,
    tempoIndications,
    metronomeMarks,
    references: mmSource.references.map((r) => ({
      id: r.id,
      type: r.type,
      reference: r.reference,
    })),
    contributions: mmSource.contributions.map((c) => ({
      id: c.id,
      role: c.role,
      personId: c.personId ?? undefined,
      organizationId: c.organizationId ?? undefined,
    })),
    persons: persons.map((p) => ({
      id: p.id,
      firstName: p.firstName ?? null,
      lastName: p.lastName ?? null,
      birthYear: p.birthYear ?? null,
      deathYear: p.deathYear ?? null,
    })),
    organizations: organizations.map((o) => ({
      id: o.id,
      // Keeping shape consistent with mock graph; add more fields if your graph schema expects them
      name: (o as any).name ?? null,
    })),
    sourceContents,
  };

  return { graph, globallyReviewed };
}
