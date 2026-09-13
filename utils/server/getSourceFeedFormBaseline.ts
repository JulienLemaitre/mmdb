import { db } from "@/utils/server/db";
import {
  REVIEW_STATE,
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
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/options";

export type SourceFeedFormBaselineData = {
  baseline: FeedFormState;
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
    creatorId: string | null;
    reviewState: REVIEW_STATE;
  };
  personIds: Set<string>;
  organizationIds: Set<string>;
  collectionIds: Set<string>;
  pieceIds: Set<string>;
  pieceVersionIds: Set<string>;
  tempoIndicationIds: Set<string>;
};

/**
 * Extracts and maps the full entity graph of an MMSource into a FeedFormState baseline (without formInfo).
 */
export async function getSourceFeedFormBaseline(
  mMSourceId: string,
  prismaClient = db,
): Promise<SourceFeedFormBaselineData | null> {
  if (!mMSourceId) {
    throw new Error("[getSourceFeedFormBaseline] mMSourceId is required");
  }

  const mmSource = await prismaClient.mMSource.findUnique({
    where: { id: mMSourceId },
    select: {
      id: true,
      title: true,
      type: true,
      link: true,
      permalink: true,
      year: true,
      isYearEstimated: true,
      comment: true,
      creatorId: true,
      reviewState: true,
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
    return null;
  }

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

  const collections =
    collectionIds.size > 0
      ? await prismaClient.collection.findMany({
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
      ? await prismaClient.person.findMany({
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
      ? await prismaClient.organization.findMany({
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
          `[getSourceFeedFormBaseline] Metronome mark sectionId ${mm.sectionId} not found in pieceVersions`,
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
      link: mmSource.permalink ?? mmSource.link ?? null,
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
    baseline,
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
      creatorId: mmSource.creatorId,
      reviewState: mmSource.reviewState,
    },
    personIds,
    organizationIds,
    collectionIds,
    pieceIds,
    pieceVersionIds,
    tempoIndicationIds,
  };
}

export type SourceEditBaselineResult = {
  mMSource: NonNullable<SourceFeedFormBaselineData["mMSource"]>;
  baseline: FeedFormState;
  initialState: FeedFormState;
};

/**
 * Loads baseline and validates permissions/status for self-source-edit.
 */
export async function getSourceEditBaseline(
  mMSourceId: string,
): Promise<SourceEditBaselineResult> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("[getSourceEditBaseline] Unauthorized");
  }

  if (!mMSourceId) {
    throw new Error("[getSourceEditBaseline] mMSourceId is required");
  }

  const activeReview = await db.review.findFirst({
    where: { mMSourceId, state: REVIEW_STATE.IN_REVIEW },
    select: { id: true },
  });
  if (activeReview) {
    throw new Error(
      "[getSourceEditBaseline] A review is currently in progress on this MM Source",
    );
  }

  const baselineData = await getSourceFeedFormBaseline(mMSourceId);
  if (!baselineData) {
    throw new Error("[getSourceEditBaseline] MM Source not found");
  }

  const { baseline, mMSource } = baselineData;

  if (mMSource.creatorId !== session.user.id) {
    throw new Error(
      "[getSourceEditBaseline] Forbidden: only the creator can edit this MM Source",
    );
  }

  if (mMSource.reviewState !== REVIEW_STATE.PENDING) {
    throw new Error(
      "[getSourceEditBaseline] Only PENDING MM Sources can be edited",
    );
  }

  const initialState: FeedFormState = {
    ...baseline,
    formInfo: {
      currentStepRank: 0,
      introDone: false,
      allSourceOnPieceVersionsDone: true,
    },
  };

  return {
    mMSource,
    baseline,
    initialState,
  };
}
