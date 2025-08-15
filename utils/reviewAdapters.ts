import { buildFieldPath, ChecklistEntityType } from "@/utils/ReviewChecklistSchema";

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
    if ((values.title ?? null) !== (before.title ?? null)) affected.push(relToFull("title"));
    if ((values.type ?? null) !== (before.type ?? null)) affected.push(relToFull("type"));
    if ((values.link ?? null) !== (before.link ?? null)) affected.push(relToFull("link"));
    if ((values.permalink ?? null) !== (before.permalink ?? null)) affected.push(relToFull("permalink"));
    if ((values.year ?? null) !== (before.year ?? null)) affected.push(relToFull("year"));
    if ((values.comment ?? null) !== (before.comment ?? null)) affected.push(relToFull("comment"));
    return { updatedGraph, affectedFieldPaths: affected, entityType: "MM_SOURCE", entityId: null };
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
    if (idx === -1) return { updatedGraph: graph, affectedFieldPaths: [], entityType: "PIECE", entityId: values.id };
    const before = graph.pieces[idx];
    const nextPiece = { ...before, ...values };
    const pieces = graph.pieces.slice();
    pieces[idx] = nextPiece;
    const updatedGraph = { ...graph, pieces };
    const affected: string[] = [];
    const relToFull = (rel: string) => buildFieldPath("PIECE", values.id, rel);
    if ((values.title ?? null) !== (before.title ?? null)) affected.push(relToFull("title"));
    if ((values.nickname ?? null) !== (before.nickname ?? null)) affected.push(relToFull("nickname"));
    if ((values.yearOfComposition ?? null) !== (before.yearOfComposition ?? null)) affected.push(relToFull("yearOfComposition"));
    return { updatedGraph, affectedFieldPaths: affected, entityType: "PIECE", entityId: values.id };
  },
};

export const PieceVersionAdapter = {
  entityType: "PIECE_VERSION" as const,
  buildInitialValues(graph: any, pieceVersionId: string): PieceVersionValues | null {
    const pv = (graph?.pieceVersions ?? []).find((v: any) => v.id === pieceVersionId);
    if (!pv) return null;
    return { id: pv.id, category: pv.category ?? "" };
  },
  applySave(graph: any, values: PieceVersionValues): ApplyResult {
    const idx = (graph?.pieceVersions ?? []).findIndex((v: any) => v.id === values.id);
    if (idx === -1) return { updatedGraph: graph, affectedFieldPaths: [], entityType: "PIECE_VERSION", entityId: values.id };
    const before = graph.pieceVersions[idx];
    const nextPv = { ...before, ...values };
    const list = graph.pieceVersions.slice();
    list[idx] = nextPv;
    const updatedGraph = { ...graph, pieceVersions: list };
    const affected: string[] = [];
    const relToFull = (rel: string) => buildFieldPath("PIECE_VERSION", values.id, rel);
    if ((values.category ?? null) !== (before.category ?? null)) affected.push(relToFull("category"));
    return { updatedGraph, affectedFieldPaths: affected, entityType: "PIECE_VERSION", entityId: values.id };
  },
};
