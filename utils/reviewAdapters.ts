import {
  buildFieldPath,
  ChecklistEntityType,
} from "@/utils/ReviewChecklistSchema";

export type SourceDescriptionValues = {
  title?: string | null;
  type?: string | null;
  link?: string | null;
  permalink?: string | null;
  year?: number | null;
  comment?: string | null;
};

export type PieceValues = {
  id: string;
  title?: string | null;
  nickname?: string | null;
  yearOfComposition?: number | null;
};

export type PieceVersionValues = {
  id: string;
  category?: string | null;
};

export type ApplyResult = {
  updatedGraph: any;
  affectedFieldPaths: string[]; // full field paths using the convention
  entityType: ChecklistEntityType;
  entityId?: string | null;
};

/**
 * Where to apply the reviewWorkingCopyContext in adapter save handlers
 * - In the components that invoke your adapters’ applySave(), use the hook to persist the updated graph and reset checks. Typical pattern inside the editor modal/drawer: const { get, save } = useReviewWorkingCopy(); const wc = get(); const workingGraph = wc?.graph ?? data.graph; const { updatedGraph, affectedFieldPaths, entityType, entityId } = SectionAdapter.applySave(workingGraph, values); save(updatedGraph); resetChecksFor(affectedFieldPaths, entityType, entityId); setReloadNonce(n => n + 1); // to recompute changed keys
 */

export const SourceDescriptionAdapter = {
  entityType: "MM_SOURCE" as const,
  buildInitialValues(graph: any): SourceDescriptionValues {
    const s = graph?.source ?? {};
    return {
      title: s.title ?? "",
      type: s.type ?? "",
      link: s.link ?? "",
      permalink: s.permalink ?? "",
      year: s.year ?? null,
      comment: s.comment ?? "",
    };
  },
  applySave(graph: any, values: SourceDescriptionValues): ApplyResult {
    const before = graph?.source ?? {};
    const next = { ...before, ...values };
    const updatedGraph = { ...graph, source: next };
    const affected: string[] = [];
    const relToFull = (rel: string) => buildFieldPath("MM_SOURCE", null, rel);
    if ((values.title ?? null) !== (before.title ?? null))
      affected.push(relToFull("title"));
    if ((values.type ?? null) !== (before.type ?? null))
      affected.push(relToFull("type"));
    if ((values.link ?? null) !== (before.link ?? null))
      affected.push(relToFull("link"));
    if ((values.permalink ?? null) !== (before.permalink ?? null))
      affected.push(relToFull("permalink"));
    if ((values.year ?? null) !== (before.year ?? null))
      affected.push(relToFull("year"));
    if ((values.comment ?? null) !== (before.comment ?? null))
      affected.push(relToFull("comment"));
    return {
      updatedGraph,
      affectedFieldPaths: affected,
      entityType: "MM_SOURCE",
      entityId: null,
    };
  },
};

export const PieceAdapter = {
  entityType: "PIECE" as const,
  buildInitialValues(graph: any, pieceId: string): PieceValues | null {
    const piece = (graph?.pieces ?? []).find((p: any) => p.id === pieceId);
    if (!piece) return null;
    return {
      id: piece.id,
      title: piece.title ?? "",
      nickname: piece.nickname ?? "",
      yearOfComposition: piece.yearOfComposition ?? null,
    };
  },
  applySave(graph: any, values: PieceValues): ApplyResult {
    const idx = (graph?.pieces ?? []).findIndex((p: any) => p.id === values.id);
    if (idx === -1)
      return {
        updatedGraph: graph,
        affectedFieldPaths: [],
        entityType: "PIECE",
        entityId: values.id,
      };
    const before = graph.pieces[idx];
    const nextPiece = { ...before, ...values };
    const pieces = graph.pieces.slice();
    pieces[idx] = nextPiece;
    const updatedGraph = { ...graph, pieces };
    const affected: string[] = [];
    const relToFull = (rel: string) => buildFieldPath("PIECE", values.id, rel);
    if ((values.title ?? null) !== (before.title ?? null))
      affected.push(relToFull("title"));
    if ((values.nickname ?? null) !== (before.nickname ?? null))
      affected.push(relToFull("nickname"));
    if (
      (values.yearOfComposition ?? null) !== (before.yearOfComposition ?? null)
    )
      affected.push(relToFull("yearOfComposition"));
    return {
      updatedGraph,
      affectedFieldPaths: affected,
      entityType: "PIECE",
      entityId: values.id,
    };
  },
};

export const PieceVersionAdapter = {
  entityType: "PIECE_VERSION" as const,
  buildInitialValues(
    graph: any,
    pieceVersionId: string,
  ): PieceVersionValues | null {
    const pv = (graph?.pieceVersions ?? []).find(
      (v: any) => v.id === pieceVersionId,
    );
    if (!pv) return null;
    return { id: pv.id, category: pv.category ?? "" };
  },
  applySave(graph: any, values: PieceVersionValues): ApplyResult {
    const idx = (graph?.pieceVersions ?? []).findIndex(
      (v: any) => v.id === values.id,
    );
    if (idx === -1)
      return {
        updatedGraph: graph,
        affectedFieldPaths: [],
        entityType: "PIECE_VERSION",
        entityId: values.id,
      };
    const before = graph.pieceVersions[idx];
    const nextPv = { ...before, ...values };
    const list = graph.pieceVersions.slice();
    list[idx] = nextPv;
    const updatedGraph = { ...graph, pieceVersions: list };
    const affected: string[] = [];
    const relToFull = (rel: string) =>
      buildFieldPath("PIECE_VERSION", values.id, rel);
    if ((values.category ?? null) !== (before.category ?? null))
      affected.push(relToFull("category"));
    return {
      updatedGraph,
      affectedFieldPaths: affected,
      entityType: "PIECE_VERSION",
      entityId: values.id,
    };
  },
};

export const MovementAdapter = {
  entityType: "MOVEMENT" as const,
  buildInitialValues(
    graph: any,
    movementId: string,
  ): { id: string; rank?: number | null; key?: string | null } | null {
    const mv = (graph?.movements ?? []).find((m: any) => m.id === movementId);
    if (!mv) return null;
    return { id: mv.id, rank: mv.rank ?? null, key: mv.key ?? null };
  },
  applySave(
    graph: any,
    values: { id: string; rank?: number | null; key?: string | null },
  ): ApplyResult {
    const list = graph?.movements ?? [];
    const idx = list.findIndex((m: any) => m.id === values.id);
    if (idx === -1)
      return {
        updatedGraph: graph,
        affectedFieldPaths: [],
        entityType: "MOVEMENT",
        entityId: values.id,
      };
    const before = list[idx];
    const next = { ...before, ...values };
    const nextList = list.slice();
    nextList[idx] = next;
    const updatedGraph = { ...graph, movements: nextList };
    const affected: string[] = [];
    const relToFull = (rel: string) =>
      buildFieldPath("MOVEMENT", values.id, rel);
    if ((values.rank ?? null) !== (before.rank ?? null))
      affected.push(relToFull("rank"));
    if ((values.key ?? null) !== (before.key ?? null))
      affected.push(relToFull("key"));
    return {
      updatedGraph,
      affectedFieldPaths: affected,
      entityType: "MOVEMENT",
      entityId: values.id,
    };
  },
};

export const SectionAdapter = {
  entityType: "SECTION" as const,
  buildInitialValues(graph: any, sectionId: string): any | null {
    const sec = (graph?.sections ?? []).find((s: any) => s.id === sectionId);
    if (!sec) return null;
    return {
      id: sec.id,
      rank: sec.rank ?? null,
      metreNumerator: sec.metreNumerator ?? null,
      metreDenominator: sec.metreDenominator ?? null,
      isCommonTime: !!sec.isCommonTime,
      isCutTime: !!sec.isCutTime,
      fastestStructuralNotesPerBar: sec.fastestStructuralNotesPerBar ?? null,
      fastestStaccatoNotesPerBar: sec.fastestStaccatoNotesPerBar ?? null,
      fastestRepeatedNotesPerBar: sec.fastestRepeatedNotesPerBar ?? null,
      fastestOrnamentalNotesPerBar: sec.fastestOrnamentalNotesPerBar ?? null,
      isFastestStructuralNoteBelCanto: !!sec.isFastestStructuralNoteBelCanto,
      tempoIndicationId: sec.tempoIndicationId ?? null,
      comment: sec.comment ?? null,
      commentForReview: sec.commentForReview ?? null,
    };
  },
  applySave(graph: any, values: any): ApplyResult {
    const list = graph?.sections ?? [];
    const idx = list.findIndex((s: any) => s.id === values.id);
    if (idx === -1)
      return {
        updatedGraph: graph,
        affectedFieldPaths: [],
        entityType: "SECTION",
        entityId: values.id,
      };
    const before = list[idx];
    const next = { ...before, ...values };
    const nextList = list.slice();
    nextList[idx] = next;
    const updatedGraph = { ...graph, sections: nextList };
    const affected: string[] = [];
    const relToFull = (rel: string) =>
      buildFieldPath("SECTION", values.id, rel);
    const diffKeys = [
      "rank",
      "metreNumerator",
      "metreDenominator",
      "isCommonTime",
      "isCutTime",
      "fastestStructuralNotesPerBar",
      "fastestStaccatoNotesPerBar",
      "fastestRepeatedNotesPerBar",
      "fastestOrnamentalNotesPerBar",
      "isFastestStructuralNoteBelCanto",
      "tempoIndicationId",
      "comment",
      "commentForReview",
    ];
    for (const k of diffKeys) {
      if ((values as any)[k] !== (before as any)[k])
        affected.push(relToFull(k));
    }
    return {
      updatedGraph,
      affectedFieldPaths: affected,
      entityType: "SECTION",
      entityId: values.id,
    };
  },
};

// ========== Extended adapters for remaining entities ==========
export type CollectionValues = {
  id: string;
  title?: string | null;
  composerId?: string | null;
};

export const CollectionAdapter = {
  entityType: "COLLECTION" as const,
  buildInitialValues(
    graph: any,
    collectionId: string,
  ): CollectionValues | null {
    const col = (graph?.collections ?? []).find(
      (c: any) => c.id === collectionId,
    );
    if (!col) return null;
    return {
      id: col.id,
      title: col.title ?? "",
      composerId: col.composerId ?? null,
    };
  },
  applySave(graph: any, values: CollectionValues) {
    const list = graph?.collections ?? [];
    const idx = list.findIndex((c: any) => c.id === values.id);
    if (idx === -1)
      return {
        updatedGraph: graph,
        affectedFieldPaths: [],
        entityType: "COLLECTION" as ChecklistEntityType,
        entityId: values.id,
      };
    const before = list[idx];
    const next = { ...before, ...values };
    const nextList = list.slice();
    nextList[idx] = next;
    const updatedGraph = { ...graph, collections: nextList };
    const affected: string[] = [];
    const relToFull = (rel: string) =>
      buildFieldPath("COLLECTION", values.id, rel);
    if ((values.title ?? null) !== (before.title ?? null))
      affected.push(relToFull("title"));
    if ((values.composerId ?? null) !== (before.composerId ?? null))
      affected.push(relToFull("composerId"));
    return {
      updatedGraph,
      affectedFieldPaths: affected,
      entityType: "COLLECTION" as ChecklistEntityType,
      entityId: values.id,
    };
  },
};

export type ContributionValues = {
  id: string;
  role?: string | null;
  personId?: string | null;
  organizationId?: string | null;
};

export const ContributionAdapter = {
  entityType: "CONTRIBUTION" as const,
  buildInitialValues(
    graph: any,
    contributionId: string,
  ): ContributionValues | null {
    const cont = (graph?.contributions ?? []).find(
      (c: any) => c.id === contributionId,
    );
    if (!cont) return null;
    return {
      id: cont.id,
      role: cont.role ?? null,
      personId: cont.personId ?? null,
      organizationId: cont.organizationId ?? null,
    };
  },
  applySave(graph: any, values: ContributionValues) {
    const list = graph?.contributions ?? [];
    const idx = list.findIndex((c: any) => c.id === values.id);
    if (idx === -1)
      return {
        updatedGraph: graph,
        affectedFieldPaths: [],
        entityType: "CONTRIBUTION" as ChecklistEntityType,
        entityId: values.id,
      };
    const before = list[idx];
    const next = { ...before, ...values };
    const nextList = list.slice();
    nextList[idx] = next;
    const updatedGraph = { ...graph, contributions: nextList };
    const affected: string[] = [];
    const relToFull = (rel: string) =>
      buildFieldPath("CONTRIBUTION", values.id, rel);
    if ((values.role ?? null) !== (before.role ?? null))
      affected.push(relToFull("role"));
    if ((values.personId ?? null) !== (before.personId ?? null))
      affected.push(relToFull("personId"));
    if ((values.organizationId ?? null) !== (before.organizationId ?? null))
      affected.push(relToFull("organizationId"));
    return {
      updatedGraph,
      affectedFieldPaths: affected,
      entityType: "CONTRIBUTION" as ChecklistEntityType,
      entityId: values.id,
    };
  },
};

export type PersonValues = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  birthYear?: number | null;
  deathYear?: number | null;
};

export const PersonAdapter = {
  entityType: "PERSON" as const,
  buildInitialValues(graph: any, personId: string): PersonValues | null {
    const p = (graph?.persons ?? []).find((x: any) => x.id === personId);
    if (!p) return null;
    return {
      id: p.id,
      firstName: p.firstName ?? "",
      lastName: p.lastName ?? "",
      birthYear: p.birthYear ?? null,
      deathYear: p.deathYear ?? null,
    };
  },
  applySave(graph: any, values: PersonValues) {
    const list = graph?.persons ?? [];
    const idx = list.findIndex((x: any) => x.id === values.id);
    if (idx === -1)
      return {
        updatedGraph: graph,
        affectedFieldPaths: [],
        entityType: "PERSON" as ChecklistEntityType,
        entityId: values.id,
      };
    const before = list[idx];
    const next = { ...before, ...values };
    const nextList = list.slice();
    nextList[idx] = next;
    const updatedGraph = { ...graph, persons: nextList };
    const affected: string[] = [];
    const relToFull = (rel: string) => buildFieldPath("PERSON", values.id, rel);
    if ((values.firstName ?? null) !== (before.firstName ?? null))
      affected.push(relToFull("firstName"));
    if ((values.lastName ?? null) !== (before.lastName ?? null))
      affected.push(relToFull("lastName"));
    if ((values.birthYear ?? null) !== (before.birthYear ?? null))
      affected.push(relToFull("birthYear"));
    if ((values.deathYear ?? null) !== (before.deathYear ?? null))
      affected.push(relToFull("deathYear"));
    return {
      updatedGraph,
      affectedFieldPaths: affected,
      entityType: "PERSON" as ChecklistEntityType,
      entityId: values.id,
    };
  },
};

export type OrganizationValues = {
  id: string;
  name?: string | null;
};

export const OrganizationAdapter = {
  entityType: "ORGANIZATION" as const,
  buildInitialValues(
    graph: any,
    organizationId: string,
  ): OrganizationValues | null {
    const o = (graph?.organizations ?? []).find(
      (x: any) => x.id === organizationId,
    );
    if (!o) return null;
    return { id: o.id, name: o.name ?? "" };
  },
  applySave(graph: any, values: OrganizationValues) {
    const list = graph?.organizations ?? [];
    const idx = list.findIndex((x: any) => x.id === values.id);
    if (idx === -1)
      return {
        updatedGraph: graph,
        affectedFieldPaths: [],
        entityType: "ORGANIZATION" as ChecklistEntityType,
        entityId: values.id,
      };
    const before = list[idx];
    const next = { ...before, ...values };
    const nextList = list.slice();
    nextList[idx] = next;
    const updatedGraph = { ...graph, organizations: nextList };
    const affected: string[] = [];
    const relToFull = (rel: string) =>
      buildFieldPath("ORGANIZATION", values.id, rel);
    if ((values.name ?? null) !== (before.name ?? null))
      affected.push(relToFull("name"));
    return {
      updatedGraph,
      affectedFieldPaths: affected,
      entityType: "ORGANIZATION" as ChecklistEntityType,
      entityId: values.id,
    };
  },
};

export type TempoIndicationValues = {
  id: string;
  text?: string | null;
};

export const TempoIndicationAdapter = {
  entityType: "TEMPO_INDICATION" as const,
  buildInitialValues(
    graph: any,
    tempoIndicationId: string,
  ): TempoIndicationValues | null {
    const ti = (graph?.tempoIndications ?? []).find(
      (x: any) => x.id === tempoIndicationId,
    );
    if (!ti) return null;
    return { id: ti.id, text: ti.text ?? "" };
  },
  applySave(graph: any, values: TempoIndicationValues) {
    const list = graph?.tempoIndications ?? [];
    const idx = list.findIndex((x: any) => x.id === values.id);
    if (idx === -1)
      return {
        updatedGraph: graph,
        affectedFieldPaths: [],
        entityType: "TEMPO_INDICATION" as ChecklistEntityType,
        entityId: values.id,
      };
    const before = list[idx];
    const next = { ...before, ...values };
    const nextList = list.slice();
    nextList[idx] = next;
    const updatedGraph = { ...graph, tempoIndications: nextList };
    const affected: string[] = [];
    const relToFull = (rel: string) =>
      buildFieldPath("TEMPO_INDICATION", values.id, rel);
    if ((values.text ?? null) !== (before.text ?? null))
      affected.push(relToFull("text"));
    return {
      updatedGraph,
      affectedFieldPaths: affected,
      entityType: "TEMPO_INDICATION" as ChecklistEntityType,
      entityId: values.id,
    };
  },
};

export type MetronomeMarkValues = {
  id: string;
  beatUnit?: string | null;
  bpm?: number | null;
  comment?: string | null;
  noMM?: boolean | null;
};

export const MetronomeMarkAdapter = {
  entityType: "METRONOME_MARK" as const,
  buildInitialValues(
    graph: any,
    metronomeMarkId: string,
  ): MetronomeMarkValues | null {
    const mm = (graph?.metronomeMarks ?? []).find(
      (x: any) => x.id === metronomeMarkId,
    );
    if (!mm) return null;
    return {
      id: mm.id,
      beatUnit: mm.beatUnit ?? null,
      bpm: mm.bpm ?? null,
      comment: mm.comment ?? null,
      noMM: mm.noMM ?? null,
    };
  },
  applySave(graph: any, values: MetronomeMarkValues) {
    const list = graph?.metronomeMarks ?? [];
    const idx = list.findIndex((x: any) => x.id === values.id);
    if (idx === -1)
      return {
        updatedGraph: graph,
        affectedFieldPaths: [],
        entityType: "METRONOME_MARK" as ChecklistEntityType,
        entityId: values.id,
      };
    const before = list[idx];
    const next = { ...before, ...values };
    const nextList = list.slice();
    nextList[idx] = next;
    const updatedGraph = { ...graph, metronomeMarks: nextList };
    const affected: string[] = [];
    const relToFull = (rel: string) =>
      buildFieldPath("METRONOME_MARK", values.id, rel);
    if ((values.beatUnit ?? null) !== (before.beatUnit ?? null))
      affected.push(relToFull("beatUnit"));
    if ((values.bpm ?? null) !== (before.bpm ?? null))
      affected.push(relToFull("bpm"));
    if ((values.comment ?? null) !== (before.comment ?? null))
      affected.push(relToFull("comment"));
    // noMM is not part of the required checklist schema; do not add to affectedFieldPaths
    return {
      updatedGraph,
      affectedFieldPaths: affected,
      entityType: "METRONOME_MARK" as ChecklistEntityType,
      entityId: values.id,
    };
  },
};

export type ReferenceValues = {
  id: string;
  type?: string | null;
  reference?: string | null;
};

export const ReferenceAdapter = {
  entityType: "REFERENCE" as const,
  buildInitialValues(graph: any, referenceId: string): ReferenceValues | null {
    const r = (graph?.references ?? []).find((x: any) => x.id === referenceId);
    if (!r) return null;
    return { id: r.id, type: r.type ?? null, reference: r.reference ?? "" };
  },
  applySave(graph: any, values: ReferenceValues) {
    const list = graph?.references ?? [];
    const idx = list.findIndex((x: any) => x.id === values.id);
    if (idx === -1)
      return {
        updatedGraph: graph,
        affectedFieldPaths: [],
        entityType: "REFERENCE" as ChecklistEntityType,
        entityId: values.id,
      };
    const before = list[idx];
    const next = { ...before, ...values };
    const nextList = list.slice();
    nextList[idx] = next;
    const updatedGraph = { ...graph, references: nextList };
    const affected: string[] = [];
    const relToFull = (rel: string) =>
      buildFieldPath("REFERENCE", values.id, rel);
    if ((values.type ?? null) !== (before.type ?? null))
      affected.push(relToFull("type"));
    if ((values.reference ?? null) !== (before.reference ?? null))
      affected.push(relToFull("reference"));
    return {
      updatedGraph,
      affectedFieldPaths: affected,
      entityType: "REFERENCE" as ChecklistEntityType,
      entityId: values.id,
    };
  },
};
