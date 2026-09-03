import { FeedFormState } from "@/types/feedFormTypes";
import {
  CollectionState,
  ContributionState,
  MetronomeMarkState,
  MMSourceContributionsState,
  MMSourceDescriptionState,
  MMSourceOnPieceVersionsState,
  MovementState,
  OrganizationState,
  PersonState,
  PieceState,
  PieceVersionState,
  ReferenceState,
  SectionState,
  TempoIndicationState,
} from "@/types/formTypes";
import { norm } from "@/features/review/reviewDiff";
import { prodLog } from "@/utils/debugLogger";
import { getNewUuid } from "@/utils/getNewUuid";

function generateIdWithWarning(entityName: string): string {
  const newId = getNewUuid();
  prodLog.warn(
    `[normalizeFeedFormStateForPersistence] Missing id for ${entityName}, generated id: ${newId}`,
  );
  return newId;
}

function normalizeMMSourceDescription(
  desc: MMSourceDescriptionState | undefined,
): MMSourceDescriptionState | undefined {
  if (!desc) return undefined;

  const id = desc.id || generateIdWithWarning("MMSource");
  const references: ReferenceState[] = (desc.references || []).map((ref) => ({
    id: ref.id || getNewUuid(), // Legitimate case: server UUID without warning
    type: norm(ref.type),
    reference: norm(ref.reference),
  }));

  return {
    id,
    title: norm(desc.title),
    type: norm(desc.type),
    link: norm(desc.link),
    permalink: norm(desc.permalink),
    year: norm(desc.year),
    isYearEstimated: Boolean(desc.isYearEstimated),
    comment: norm(desc.comment),
    references,
  };
}

function normalizeContributions(
  contributions: MMSourceContributionsState | undefined,
): MMSourceContributionsState {
  if (!contributions) return [];

  return contributions.map((c) => {
    const id = c.id || generateIdWithWarning("Contribution");
    const role = norm(c.role);
    const personId = norm((c as any).personId);
    const organizationId = norm((c as any).organizationId);

    return {
      id,
      role,
      personId: personId ?? null,
      organizationId: organizationId ?? null,
    } as ContributionState;
  });
}

function normalizeOrganizations(
  organizations: OrganizationState[] | undefined,
): OrganizationState[] {
  if (!organizations) return [];

  return organizations.map((org) => ({
    id: org.id || generateIdWithWarning("Organization"),
    name: norm(org.name),
  }));
}

function normalizePersons(persons: PersonState[] | undefined): PersonState[] {
  if (!persons) return [];

  return persons.map((person) => ({
    id: person.id || generateIdWithWarning("Person"),
    firstName: norm(person.firstName),
    lastName: norm(person.lastName),
    birthYear: norm(person.birthYear),
    deathYear: norm(person.deathYear),
  }));
}

function normalizeCollections(
  collections: CollectionState[] | undefined,
): CollectionState[] {
  if (!collections) return [];

  return collections.map((col) => ({
    id: col.id || generateIdWithWarning("Collection"),
    title: norm(col.title),
    composerId: norm(col.composerId),
    pieceCount: typeof col.pieceCount === "number" ? col.pieceCount : 0,
  }));
}

function normalizePieces(pieces: PieceState[] | undefined): PieceState[] {
  if (!pieces) return [];

  return pieces.map((piece) => ({
    id: piece.id || generateIdWithWarning("Piece"),
    title: norm(piece.title),
    nickname: norm(piece.nickname),
    composerId: norm(piece.composerId),
    yearOfComposition: norm(piece.yearOfComposition),
    collectionId: norm(piece.collectionId),
    collectionRank: norm(piece.collectionRank),
  }));
}

function normalizePieceVersions(
  pieceVersions: PieceVersionState[] | undefined,
): PieceVersionState[] {
  if (!pieceVersions) return [];

  return pieceVersions.map((pv) => {
    const pvId = pv.id || generateIdWithWarning("PieceVersion");
    const movements: MovementState[] = (pv.movements || []).map((mov) => {
      const movId = mov.id || generateIdWithWarning("Movement");
      const sections: SectionState[] = (mov.sections || []).map((sec) => {
        const secId = sec.id || generateIdWithWarning("Section");
        return {
          id: secId,
          rank: typeof sec.rank === "number" ? sec.rank : 1,
          tempoIndicationId: norm(sec.tempoIndicationId),
          metreNumerator: norm(sec.metreNumerator),
          metreDenominator: norm(sec.metreDenominator),
          isCommonTime: Boolean(sec.isCommonTime),
          isCutTime: Boolean(sec.isCutTime),
          fastestStructuralNotesPerBar: norm(sec.fastestStructuralNotesPerBar),
          fastestBelCantoNotesPerBar: norm(sec.fastestBelCantoNotesPerBar),
          fastestStaccatoNotesPerBar: norm(sec.fastestStaccatoNotesPerBar),
          fastestRepeatedNotesPerBar: norm(sec.fastestRepeatedNotesPerBar),
          fastestOrnamentalNotesPerBar: norm(sec.fastestOrnamentalNotesPerBar),
          comment: norm(sec.comment),
          commentForReview: norm(sec.commentForReview),
        };
      });

      return {
        id: movId,
        rank: typeof mov.rank === "number" ? mov.rank : 1,
        key: norm(mov.key),
        isVariation: Boolean(mov.isVariation),
        sections,
      };
    });

    return {
      id: pvId,
      pieceId: norm(pv.pieceId),
      category: norm(pv.category),
      movements,
    };
  });
}

function normalizeTempoIndications(
  tempoIndications: TempoIndicationState[] | undefined,
): TempoIndicationState[] {
  if (!tempoIndications) return [];

  return tempoIndications.map((ti) => ({
    id: ti.id || generateIdWithWarning("TempoIndication"),
    text: norm(ti.text),
  }));
}

function normalizeMetronomeMarks(
  metronomeMarks: MetronomeMarkState[] | undefined,
): MetronomeMarkState[] {
  if (!metronomeMarks) return [];

  // 1. Retrait des marques noMM: true
  const retained = metronomeMarks.filter((mm) => (mm as any).noMM !== true);

  return retained.map((mm) => {
    const id = mm.id || generateIdWithWarning("MetronomeMark");
    return {
      id,
      pieceVersionId: norm(mm.pieceVersionId),
      sectionId: norm(mm.sectionId),
      bpm: norm((mm as any).bpm),
      beatUnit: norm((mm as any).beatUnit),
      comment: norm((mm as any).comment),
      noMM: false as const,
    };
  });
}

function normalizeMMSourceOnPieceVersions(
  mMSourceOnPieceVersions: MMSourceOnPieceVersionsState[] | undefined,
): MMSourceOnPieceVersionsState[] {
  if (!mMSourceOnPieceVersions) return [];

  // Sort by existing rank ascending
  const sorted = [...mMSourceOnPieceVersions].sort(
    (a, b) => (a.rank ?? 0) - (b.rank ?? 0),
  );

  // 4. Continuité des rangs à partir de 1
  return sorted.map((item, index) => ({
    pieceVersionId: norm(item.pieceVersionId),
    rank: index + 1,
  }));
}

function validateCoherence(
  pieceVersions: PieceVersionState[],
  metronomeMarks: MetronomeMarkState[],
) {
  const allSectionIds = new Set<string>();

  for (const pv of pieceVersions) {
    for (const mov of pv.movements) {
      for (const sec of mov.sections) {
        if (
          !sec.tempoIndicationId ||
          typeof sec.tempoIndicationId !== "string" ||
          sec.tempoIndicationId.trim() === ""
        ) {
          throw new Error(
            `[normalizeFeedFormStateForPersistence] Section ${sec.id} is missing mandatory tempoIndicationId`,
          );
        }
        allSectionIds.add(sec.id);
      }
    }
  }

  for (const mm of metronomeMarks) {
    if (!mm.sectionId || !allSectionIds.has(mm.sectionId)) {
      throw new Error(
        `[normalizeFeedFormStateForPersistence] MetronomeMark ${mm.id} references unknown sectionId "${mm.sectionId}"`,
      );
    }
  }
}

/**
 * Normalizes a FeedFormState for database persistence and diff comparison.
 *
 * Operations applied in order:
 * 1. Filter out metronome marks with `noMM: true`.
 * 2. Strip UI-only fields (`isNew`, `isComposerNew`, etc.).
 * 3. Normalize empty string values `""` and `undefined` to `null` via `norm()`.
 * 4. Ensure rank continuity for `mMSourceOnPieceVersions` starting from 1.
 * 5. Assign server UUIDs to any entity missing an id (with `prodLog.warn` for non-references).
 * 6. Validate coherence (each Section must have tempoIndicationId, each retained MetronomeMark must reference an existing Section).
 */
export function normalizeFeedFormStateForPersistence(
  state: FeedFormState,
): FeedFormState {
  const metronomeMarks = normalizeMetronomeMarks(state.metronomeMarks);
  const mMSourceDescription = normalizeMMSourceDescription(
    state.mMSourceDescription,
  );
  const mMSourceContributions = normalizeContributions(
    state.mMSourceContributions,
  );
  const organizations = normalizeOrganizations(state.organizations);
  const persons = normalizePersons(state.persons);
  const collections = normalizeCollections(state.collections);
  const pieces = normalizePieces(state.pieces);
  const pieceVersions = normalizePieceVersions(state.pieceVersions);
  const tempoIndications = normalizeTempoIndications(state.tempoIndications);
  const mMSourceOnPieceVersions = normalizeMMSourceOnPieceVersions(
    state.mMSourceOnPieceVersions,
  );

  // 6. Vérification de cohérence
  validateCoherence(pieceVersions, metronomeMarks);

  return {
    ...(state.formInfo ? { formInfo: { ...state.formInfo } } : {}),
    ...(mMSourceDescription ? { mMSourceDescription } : {}),
    mMSourceContributions,
    mMSourceOnPieceVersions,
    organizations,
    collections,
    persons,
    pieces,
    pieceVersions,
    tempoIndications,
    metronomeMarks,
  };
}

export default normalizeFeedFormStateForPersistence;
