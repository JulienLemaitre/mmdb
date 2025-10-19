import {
  REVIEW_CHECKLIST_SCHEMA,
  ChecklistEntityType,
  ChecklistGraph,
  buildFieldPath,
  buildSourceJoinRankPath,
  ENTITY_PREFIX,
} from "@/utils/ReviewChecklistSchema";

export type ChangedChecklistItem = {
  entityType: ChecklistEntityType;
  entityId?: string | null;
  fieldPath: string;
};

function norm(v: any) {
  if (v === undefined || v === "") return null;
  return v;
}

function getNestedValue(obj: any, path: string): any {
  if (!obj) return undefined;
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
}

/**
 * JSDoc: Computes a list of all fields that have changed between a baseline
 * and a working version of a ChecklistGraph.
 *
 * This function recursively traverses both graphs in parallel, comparing
 * entities and their fields as defined in the `REVIEW_CHECKLIST_SCHEMA`.
 * It correctly handles nested structures (like movements and sections within
 * piece versions) and identifies changes in value, as well as the creation
 * or deletion of entire entities.
 *
 * @param baseline - The original ChecklistGraph, typically from the server.
 * @param working - The potentially modified ChecklistGraph from the user's session.
 * @returns An array of `ChangedChecklistItem` objects, one for each detected change.
 */
export function computeChangedChecklistFieldPaths(
  baseline: ChecklistGraph,
  working: ChecklistGraph,
): ChangedChecklistItem[] {
  const out: ChangedChecklistItem[] = [];

  const compareNodes = (
    entityType: ChecklistEntityType,
    bNode: any,
    wNode: any,
  ) => {
    const fields = REVIEW_CHECKLIST_SCHEMA[entityType].fields;
    for (const f of fields) {
      const bValue = norm(getNestedValue(bNode, f.path));
      const wValue = norm(getNestedValue(wNode, f.path));
      if (bValue !== wValue) {
        out.push({
          entityType,
          entityId: bNode?.id ?? wNode?.id,
          fieldPath: buildFieldPath(entityType, bNode?.id ?? wNode?.id, f.path),
        });
      }
    }
  };

  const diffEntityArray = (
    entityType: ChecklistEntityType,
    bList: any[] | undefined,
    wList: any[] | undefined,
  ) => {
    const baseMap = new Map((bList ?? []).map((n) => [n.id, n]));
    const workMap = new Map((wList ?? []).map((n) => [n.id, n]));
    const allIds = new Set([...baseMap.keys(), ...workMap.keys()]);

    for (const id of allIds) {
      const bNode = baseMap.get(id);
      const wNode = workMap.get(id);

      if (bNode && wNode) {
        // UPDATE: Compare fields and recurse if necessary
        compareNodes(entityType, bNode, wNode);

        if (entityType === "PIECE_VERSION") {
          diffEntityArray("MOVEMENT", bNode.movements, wNode.movements);
        } else if (entityType === "MOVEMENT") {
          diffEntityArray("SECTION", bNode.sections, wNode.sections);
        }
      } else {
        // CREATE / DELETE: Mark all fields as changed
        const node = bNode ?? wNode;
        const schema = REVIEW_CHECKLIST_SCHEMA[entityType];
        for (const field of schema.fields) {
          out.push({
            entityType,
            entityId: node.id,
            fieldPath: buildFieldPath(entityType, node.id, field.path),
          });
        }

        // Also handle children of created/deleted entities
        if (entityType === "PIECE_VERSION") {
          diffEntityArray("MOVEMENT", bNode?.movements, wNode?.movements);
        } else if (entityType === "MOVEMENT") {
          diffEntityArray("SECTION", bNode?.sections, wNode?.sections);
        }
      }
    }
  };

  // 1. Diff MM_SOURCE (singleton)
  if (baseline.source || working.source) {
    compareNodes("MM_SOURCE", baseline.source, working.source);
  }

  // 2. Diff top-level arrays
  const topLevelTypes: ChecklistEntityType[] = [
    "PERSON",
    "ORGANIZATION",
    "COLLECTION",
    "PIECE",
    "TEMPO_INDICATION",
    "REFERENCE",
    "CONTRIBUTION",
    "METRONOME_MARK",
  ];

  for (const type of topLevelTypes) {
    const prop = ENTITY_PREFIX[type];
    const bList =
      (baseline as any)[`${prop}s`] ??
      (baseline.source as any)[`${prop}s`] ??
      [];
    const wList =
      (working as any)[`${prop}s`] ?? (working.source as any)[`${prop}s`] ?? [];
    diffEntityArray(type, bList, wList);
  }

  // 3. Diff PieceVersions (which will recurse into movements/sections)
  diffEntityArray(
    "PIECE_VERSION",
    baseline.pieceVersions,
    working.pieceVersions,
  );

  // 4. Diff sourceContents (ranks)
  const bRanks = new Map(
    (baseline.sourceContents ?? []).map((j) => [j.joinId, j.rank]),
  );
  const wRanks = new Map(
    (working.sourceContents ?? []).map((j) => [j.joinId, j.rank]),
  );
  const allJoinIds = new Set([...bRanks.keys(), ...wRanks.keys()]);
  for (const joinId of allJoinIds) {
    if (norm(bRanks.get(joinId)) !== norm(wRanks.get(joinId))) {
      out.push({
        entityType: "MM_SOURCE",
        entityId: null,
        fieldPath: buildSourceJoinRankPath(String(joinId)),
      });
    }
  }

  return out;
}

/**
 * DEPRECATED: This function is no longer needed as `fieldPath` is now the unique key.
 * From the changed items list, produce encoded keys used by the checklist UI
 */
export function toEncodedKeys(changes: ChangedChecklistItem[]): string[] {
  // This function body is now incorrect and should not be used.
  // Returning fieldPath directly is the new pattern.
  return changes.map((c) => c.fieldPath);
}
