import {
  REVIEW_DIFF_FIELDS_SCHEMA,
  buildFieldPath,
  buildSourceJoinRankPath,
  ENTITY_PREFIX,
} from "@/features/review/reviewDiffFieldsSchema";
import { ReviewEntityType, ChangedField } from "@/types/reviewTypes";
import { FeedFormState } from "@/types/feedFormTypes";

export type { ChangedField };

export function norm(v: any) {
  if (v === undefined || v === "") return null;
  return v;
}

function getNestedValue(obj: any, path: string): any {
  if (!obj) return undefined;
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
}

/**
 * Computes a list of all fields that have changed between a baseline
 * and a working version of a FeedFormState.
 *
 * @param baseline - The original FeedFormState from the server.
 * @param working - The potentially modified FeedFormState from the user's session.
 * @returns An array of ChangedField objects, one for each detected change.
 */
export function computeChangedFieldPaths(
  baseline: FeedFormState | null | undefined,
  working: FeedFormState | null | undefined,
): ChangedField[] {
  const out: ChangedField[] = [];
  const base = baseline ?? {};
  const work = working ?? {};

  const compareNodes = (
    entityType: ReviewEntityType,
    bNode: any,
    wNode: any,
  ) => {
    const fields = REVIEW_DIFF_FIELDS_SCHEMA[entityType].fields;
    for (const f of fields) {
      const bValue = norm(getNestedValue(bNode, f.path));
      const wValue = norm(getNestedValue(wNode, f.path));
      if (bValue !== wValue) {
        try {
          out.push({
            entityType,
            entityId: bNode?.id ?? wNode?.id ?? null,
            fieldPath: buildFieldPath(
              entityType,
              bNode?.id ?? wNode?.id,
              f.path,
            ),
          });
        } catch (e) {
          console.error("Error computing field path", {
            entityType,
            f,
            bNode,
            wNode,
          });
          throw new Error(
            `[computeChangedFieldPaths] Error computing field path for entity ${entityType}, field ${JSON.stringify(f)}, bNode ${JSON.stringify(bNode)}, wNode ${JSON.stringify(wNode)} : ${e instanceof Error ? e.message : e}`,
          );
        }
      }
    }
  };

  const diffEntityArray = (
    entityType: ReviewEntityType,
    bList: any[] | undefined,
    wList: any[] | undefined,
  ) => {
    const getEntityKey = (node: any, index: number, prefix: string) => {
      if (node && typeof node.id === "string" && node.id.trim() !== "") {
        return node.id;
      }
      return `__missing_id_${prefix}_${index}`;
    };

    const baseMap = new Map(
      (bList ?? []).map((n, idx) => [getEntityKey(n, idx, "base"), n]),
    );
    const workMap = new Map(
      (wList ?? []).map((n, idx) => [getEntityKey(n, idx, "work"), n]),
    );
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
        const schema = REVIEW_DIFF_FIELDS_SCHEMA[entityType];
        for (const field of schema.fields) {
          try {
            out.push({
              entityType,
              entityId: node?.id ?? null,
              fieldPath: buildFieldPath(entityType, node?.id, field.path),
            });
          } catch (e) {
            console.error("Error computing CREATE / DELETE field path", {
              entityType,
              field,
              node,
            });
            throw new Error(
              `[computeChangedFieldPaths] Error computing CREATE / DELETE field path for entity ${entityType}, field ${JSON.stringify(field)}, node ${JSON.stringify(node)} : ${e instanceof Error ? e.message : e}`,
            );
          }
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
  if (base.mMSourceDescription || work.mMSourceDescription) {
    compareNodes(
      "MM_SOURCE",
      base.mMSourceDescription,
      work.mMSourceDescription,
    );
  }

  // 2. Diff nested references on source
  diffEntityArray(
    "REFERENCE",
    base.mMSourceDescription?.references,
    work.mMSourceDescription?.references,
  );

  // 3. Diff contributions
  diffEntityArray(
    "CONTRIBUTION",
    base.mMSourceContributions,
    work.mMSourceContributions,
  );

  // 4. Diff top-level entity arrays
  const topLevelTypes: Array<
    | "PERSON"
    | "ORGANIZATION"
    | "COLLECTION"
    | "PIECE"
    | "TEMPO_INDICATION"
    | "METRONOME_MARK"
  > = [
    "PERSON",
    "ORGANIZATION",
    "COLLECTION",
    "PIECE",
    "TEMPO_INDICATION",
    "METRONOME_MARK",
  ];

  for (const type of topLevelTypes) {
    const prop = ENTITY_PREFIX[type];
    const bList = (base as any)[`${prop}s`];
    const wList = (work as any)[`${prop}s`];
    diffEntityArray(type, bList, wList);
  }

  // 5. Diff PieceVersions (recursing into movements and sections)
  diffEntityArray("PIECE_VERSION", base.pieceVersions, work.pieceVersions);

  // 6. Diff mMSourceOnPieceVersions (detects rank changes, additions, removals, substitutions of pieceVersionId)
  const bRanks = new Map(
    (base.mMSourceOnPieceVersions ?? []).map((j) => [j.pieceVersionId, j.rank]),
  );
  const wRanks = new Map(
    (work.mMSourceOnPieceVersions ?? []).map((j) => [j.pieceVersionId, j.rank]),
  );
  const allPvIds = new Set([...bRanks.keys(), ...wRanks.keys()]);
  const sourceId =
    base.mMSourceDescription?.id ?? work.mMSourceDescription?.id ?? null;

  for (const pvId of allPvIds) {
    if (norm(bRanks.get(pvId)) !== norm(wRanks.get(pvId))) {
      out.push({
        entityType: "MM_SOURCE",
        entityId: sourceId,
        fieldPath: buildSourceJoinRankPath(String(pvId)),
      });
    }
  }

  return out;
}
