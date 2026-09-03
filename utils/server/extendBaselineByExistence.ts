import { db } from "@/utils/server/db";
import { FeedFormState } from "@/types/feedFormTypes";
import { PrismaClient, Prisma } from "@/prisma/client";

type DbOrTx = PrismaClient | Prisma.TransactionClient;

/**
 * Extends the baseline FeedFormState by querying the database for any entity IDs
 * present in the submittedState that are absent from the baseline.
 * Used during server-side review submission (L10B) to ensure pre-existing entities
 * selected or modified are properly compared rather than audited as creations.
 *
 * Performs at most one findMany query per entity type.
 */
export async function extendBaselineByExistence(
  baseline: FeedFormState,
  submittedState: FeedFormState,
  prisma: DbOrTx = db,
): Promise<FeedFormState> {
  const extended: FeedFormState = {
    ...baseline,
    mMSourceDescription: baseline.mMSourceDescription
      ? {
          ...baseline.mMSourceDescription,
          references: [...(baseline.mMSourceDescription.references ?? [])],
        }
      : undefined,
    mMSourceContributions: [...(baseline.mMSourceContributions ?? [])],
    mMSourceOnPieceVersions: [...(baseline.mMSourceOnPieceVersions ?? [])],
    organizations: [...(baseline.organizations ?? [])],
    collections: [...(baseline.collections ?? [])],
    persons: [...(baseline.persons ?? [])],
    pieces: [...(baseline.pieces ?? [])],
    pieceVersions: [...(baseline.pieceVersions ?? [])],
    tempoIndications: [...(baseline.tempoIndications ?? [])],
    metronomeMarks: [...(baseline.metronomeMarks ?? [])],
  };

  // 1. Persons
  const baselinePersonIds = new Set(extended.persons?.map((p) => p.id) ?? []);
  const missingPersonIds = Array.from(
    new Set(
      (submittedState.persons ?? [])
        .map((p) => p.id)
        .filter((id): id is string => Boolean(id) && !baselinePersonIds.has(id)),
    ),
  );

  if (missingPersonIds.length > 0) {
    const dbPersons = await prisma.person.findMany({
      where: { id: { in: missingPersonIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        birthYear: true,
        deathYear: true,
      },
    });
    for (const p of dbPersons) {
      extended.persons!.push({
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        birthYear: p.birthYear,
        deathYear: p.deathYear ?? null,
      });
    }
  }

  // 2. Organizations
  const baselineOrgIds = new Set(
    extended.organizations?.map((o) => o.id) ?? [],
  );
  const missingOrgIds = Array.from(
    new Set(
      (submittedState.organizations ?? [])
        .map((o) => o.id)
        .filter((id): id is string => Boolean(id) && !baselineOrgIds.has(id)),
    ),
  );

  if (missingOrgIds.length > 0) {
    const dbOrgs = await prisma.organization.findMany({
      where: { id: { in: missingOrgIds } },
      select: { id: true, name: true },
    });
    for (const o of dbOrgs) {
      extended.organizations!.push({
        id: o.id,
        name: o.name,
      });
    }
  }

  // 3. Collections
  const baselineCollectionIds = new Set(
    extended.collections?.map((c) => c.id) ?? [],
  );
  const missingCollectionIds = Array.from(
    new Set(
      (submittedState.collections ?? [])
        .map((c) => c.id)
        .filter(
          (id): id is string => Boolean(id) && !baselineCollectionIds.has(id),
        ),
    ),
  );

  if (missingCollectionIds.length > 0) {
    const dbCollections = await prisma.collection.findMany({
      where: { id: { in: missingCollectionIds } },
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
    });
    for (const c of dbCollections) {
      extended.collections!.push({
        id: c.id,
        title: c.title,
        composerId: c.composerId,
        pieceCount: c._count.pieces,
      });
    }
  }

  // 4. Pieces
  const baselinePieceIds = new Set(extended.pieces?.map((p) => p.id) ?? []);
  const missingPieceIds = Array.from(
    new Set(
      (submittedState.pieces ?? [])
        .map((p) => p.id)
        .filter((id): id is string => Boolean(id) && !baselinePieceIds.has(id)),
    ),
  );

  if (missingPieceIds.length > 0) {
    const dbPieces = await prisma.piece.findMany({
      where: { id: { in: missingPieceIds } },
      select: {
        id: true,
        title: true,
        nickname: true,
        composerId: true,
        yearOfComposition: true,
        collectionId: true,
        collectionRank: true,
      },
    });
    for (const p of dbPieces) {
      extended.pieces!.push({
        id: p.id,
        title: p.title,
        nickname: p.nickname ?? null,
        composerId: p.composerId,
        yearOfComposition: p.yearOfComposition ?? null,
        collectionId: p.collectionId ?? null,
        collectionRank: p.collectionRank ?? null,
      });
    }
  }

  // 5. PieceVersions (including Movements and Sections)
  const baselinePvIds = new Set(
    extended.pieceVersions?.map((pv) => pv.id) ?? [],
  );
  const missingPvIds = Array.from(
    new Set(
      (submittedState.pieceVersions ?? [])
        .map((pv) => pv.id)
        .filter((id): id is string => Boolean(id) && !baselinePvIds.has(id)),
    ),
  );

  if (missingPvIds.length > 0) {
    const dbPieceVersions = await prisma.pieceVersion.findMany({
      where: { id: { in: missingPvIds } },
      select: {
        id: true,
        category: true,
        pieceId: true,
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
                comment: true,
                commentForReview: true,
              },
              orderBy: { rank: "asc" },
            },
          },
          orderBy: { rank: "asc" },
        },
      },
    });

    for (const pv of dbPieceVersions) {
      extended.pieceVersions!.push({
        id: pv.id,
        pieceId: pv.pieceId,
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
            tempoIndicationId: s.tempoIndicationId,
            comment: s.comment ?? null,
            commentForReview: s.commentForReview ?? null,
          })),
        })),
      });
    }
  }

  // 6. TempoIndications
  const baselineTiIds = new Set(
    extended.tempoIndications?.map((ti) => ti.id) ?? [],
  );
  const missingTiIds = Array.from(
    new Set(
      (submittedState.tempoIndications ?? [])
        .map((ti) => ti.id)
        .filter((id): id is string => Boolean(id) && !baselineTiIds.has(id)),
    ),
  );

  if (missingTiIds.length > 0) {
    const dbTis = await prisma.tempoIndication.findMany({
      where: { id: { in: missingTiIds } },
      select: { id: true, text: true },
    });
    for (const ti of dbTis) {
      extended.tempoIndications!.push({
        id: ti.id,
        text: ti.text,
      });
    }
  }

  // 7. References
  const baselineRefIds = new Set(
    (extended.mMSourceDescription?.references ?? [])
      .map((r) => r.id)
      .filter((id): id is string => Boolean(id)),
  );
  const missingRefIds = Array.from(
    new Set(
      (submittedState.mMSourceDescription?.references ?? [])
        .map((r) => r.id)
        .filter((id): id is string => Boolean(id) && !baselineRefIds.has(id!)),
    ),
  );

  if (missingRefIds.length > 0) {
    const dbRefs = await prisma.reference.findMany({
      where: { id: { in: missingRefIds } },
      select: { id: true, type: true, reference: true },
    });
    if (!extended.mMSourceDescription) {
      extended.mMSourceDescription = {
        title: "",
        type: "EDITION" as any,
        link: "",
        year: null,
        isYearEstimated: false,
        references: [],
      };
    }
    const description = extended.mMSourceDescription;
    if (!description.references) {
      description.references = [];
    }
    for (const r of dbRefs) {
      description.references.push({
        id: r.id,
        type: r.type,
        reference: r.reference,
      });
    }
  }

  // 8. Contributions
  const baselineContribIds = new Set(
    (extended.mMSourceContributions ?? [])
      .map((c) => c.id)
      .filter((id): id is string => Boolean(id)),
  );
  const missingContribIds = Array.from(
    new Set(
      (submittedState.mMSourceContributions ?? [])
        .map((c) => c.id)
        .filter(
          (id): id is string => Boolean(id) && !baselineContribIds.has(id!),
        ),
    ),
  );

  if (missingContribIds.length > 0) {
    const dbContribs = await prisma.contribution.findMany({
      where: { id: { in: missingContribIds } },
      select: {
        id: true,
        role: true,
        personId: true,
        organizationId: true,
      },
    });
    for (const c of dbContribs) {
      if (c.personId) {
        extended.mMSourceContributions!.push({
          id: c.id,
          role: c.role,
          personId: c.personId,
        });
      } else if (c.organizationId) {
        extended.mMSourceContributions!.push({
          id: c.id,
          role: c.role,
          organizationId: c.organizationId,
        });
      }
    }
  }

  // 9. MetronomeMarks
  const baselineMmIds = new Set(
    (extended.metronomeMarks ?? [])
      .map((mm) => mm.id)
      .filter((id): id is string => Boolean(id)),
  );
  const missingMmIds = Array.from(
    new Set(
      (submittedState.metronomeMarks ?? [])
        .map((mm) => mm.id)
        .filter((id): id is string => Boolean(id) && !baselineMmIds.has(id!)),
    ),
  );

  if (missingMmIds.length > 0) {
    const dbMms = await prisma.metronomeMark.findMany({
      where: { id: { in: missingMmIds } },
      select: {
        id: true,
        beatUnit: true,
        bpm: true,
        comment: true,
        sectionId: true,
        section: {
          select: {
            movement: {
              select: {
                pieceVersionId: true,
              },
            },
          },
        },
      },
    });
    for (const mm of dbMms) {
      const pieceVersionId = mm.section?.movement?.pieceVersionId ?? "";
      if (!mm.beatUnit || mm.bpm == null) {
        extended.metronomeMarks!.push({
          id: mm.id,
          sectionId: mm.sectionId,
          pieceVersionId,
          noMM: true,
        });
      } else {
        extended.metronomeMarks!.push({
          id: mm.id,
          sectionId: mm.sectionId,
          beatUnit: mm.beatUnit,
          bpm: mm.bpm,
          comment: mm.comment ?? null,
          pieceVersionId,
          noMM: false,
        });
      }
    }
  }

  return extended;
}
