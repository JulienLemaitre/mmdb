import { REVIEW_CHECKLIST_SCHEMA, ChecklistEntityType, ChecklistField, ChecklistGraph, RequiredChecklistItem, buildFieldPath, buildSourceJoinRankPath } from "@/utils/ReviewChecklistSchema";

export type ChangedChecklistItem = {
  entityType: ChecklistEntityType;
  entityId?: string | null;
  fieldPath: string;
};

function norm(v: any) {
  return v === undefined ? null : v;
}

// Map ChecklistEntityType to graph property name (plural)
const GRAPH_PROP: Record<ChecklistEntityType, keyof ChecklistGraph | "_SINGLE" | "_JOINS"> = {
  MM_SOURCE: "_SINGLE",
  COLLECTION: "collections",
  PIECE: "pieces",
  PIECE_VERSION: "pieceVersions",
  MOVEMENT: "movements",
  SECTION: "sections",
  TEMPO_INDICATION: "tempoIndications",
  METRONOME_MARK: "metronomeMarks",
  REFERENCE: "references",
  CONTRIBUTION: "contributions",
  PERSON: "persons",
  ORGANIZATION: "organizations",
};

/**
 * Computes changed checklist field paths between a baseline graph and a working graph.
 * - Only compares fields that are part of the ReviewChecklistSchema.
 * - For MM_SOURCE, compares scalar fields listed in schema (ignores logical contents.order here).
 * - If sourceContents arrays exist, also emits per-join rank changed field paths (source.pieceVersions[joinId].rank).
 */
export function computeChangedChecklistFieldPaths(baseline: ChecklistGraph, working: ChecklistGraph): ChangedChecklistItem[] {
  const out: ChangedChecklistItem[] = [];

  const add = (entityType: ChecklistEntityType, entityId: string | null, relativeFieldPath: string) => {
    out.push({ entityType, entityId, fieldPath: buildFieldPath(entityType, entityId, relativeFieldPath) });
  };

  // MM_SOURCE scalar fields
  const srcSchema = REVIEW_CHECKLIST_SCHEMA.MM_SOURCE.fields;
  for (const field of srcSchema) {
    if (field.path === "contents.order") continue; // logical item handled via per-join below
    const b = norm((baseline.source as any)?.[field.path]);
    const w = norm((working.source as any)?.[field.path]);
    if (b !== w) add("MM_SOURCE", null, field.path);
  }

  // Per-join rank checks for ordering within source
  const baselineJoins = baseline.sourceContents ?? [];
  const workingJoins = working.sourceContents ?? [];
  if (baselineJoins.length || workingJoins.length) {
    const byIdB: Record<string, number | undefined> = {};
    for (const row of baselineJoins) if (row?.joinId) byIdB[row.joinId] = row.rank;
    const byIdW: Record<string, number | undefined> = {};
    for (const row of workingJoins) if (row?.joinId) byIdW[row.joinId] = row.rank;
    const allIds = new Set<string>([...Object.keys(byIdB), ...Object.keys(byIdW)]);
    for (const id of allIds) {
      const rb = norm(byIdB[id]);
      const rw = norm(byIdW[id]);
      if (rb !== rw) {
        out.push({ entityType: "MM_SOURCE", entityId: null, fieldPath: buildSourceJoinRankPath(String(id)) });
      }
    }
  }

  // Other entity arrays
  const TYPES: ChecklistEntityType[] = [
    "COLLECTION",
    "PIECE",
    "PIECE_VERSION",
    "MOVEMENT",
    "SECTION",
    "TEMPO_INDICATION",
    "METRONOME_MARK",
    "REFERENCE",
    "CONTRIBUTION",
    "PERSON",
    "ORGANIZATION",
  ];

  for (const t of TYPES) {
    const prop = GRAPH_PROP[t];
    if (prop === "_SINGLE" || prop === "_JOINS") continue;

    const baseList: Array<any> = ((baseline as any)[prop] ?? []) as any[];
    const workList: Array<any> = ((working as any)[prop] ?? []) as any[];
    const byIdB: Record<string, any> = Object.fromEntries(baseList.filter(Boolean).map((n) => [n.id, n]));
    const byIdW: Record<string, any> = Object.fromEntries(workList.filter(Boolean).map((n) => [n.id, n]));
    const allIds = new Set<string>([...Object.keys(byIdB), ...Object.keys(byIdW)]);
    const fields = REVIEW_CHECKLIST_SCHEMA[t].fields;

    for (const id of allIds) {
      const bNode = byIdB[id];
      const wNode = byIdW[id];
      if (!bNode || !wNode) {
        // CREATE/DELETE scenario; for client pre-check we can skip (server handles);
        // If desired, we could require checking all fields of new entity; out of scope here.
        continue;
      }
      for (const f of fields) {
        const b = norm(getNestedValue(bNode, f.path));
        const w = norm(getNestedValue(wNode, f.path));
        if (b !== w) {
          out.push({ entityType: t, entityId: id, fieldPath: buildFieldPath(t, id, f.path) });
        }
      }
    }
  }

  return out;
}

function getNestedValue(obj: any, path: string): any {
  if (!obj) return undefined;
  // We only support dot paths for scalar fields per schema
  const segs = path.split(".");
  let cur = obj;
  for (const s of segs) {
    if (cur == null) return undefined;
    cur = cur[s];
  }
  return cur;
}

/**
 * From the changed items list, produce encoded keys used by the checklist UI
 */
export function toEncodedKeys(changes: ChangedChecklistItem[]): string[] {
  return changes.map((c) => `${c.entityType}:${c.entityId ?? ""}:${c.fieldPath}`);
}
