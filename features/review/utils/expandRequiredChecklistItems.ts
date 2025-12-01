import {
  buildFieldPath,
  REVIEW_CHECKLIST_SCHEMA,
} from "@/features/review/reviewChecklistSchema";
import getPersonName from "@/utils/getPersonName";
import getItemValueDisplay from "@/features/review/utils/getItemValueDisplay";
import { SectionState } from "@/types/formTypes";
import { isCollectionCompleteInChecklistGraph } from "@/features/review/utils/isCollectionCompleteInChecklistGraph";
import {
  ChecklistEntityType,
  ChecklistField,
  ChecklistGraph,
  ExpandOptions,
  NodeLike,
  RequiredChecklistItem,
  RequiredPredicateCtx,
} from "@/types/reviewTypes";
import { debug } from "@/utils/debugLogger";

/**
 * JSDoc: Expands the full list of required checklist items from a ChecklistGraph.
 * This function traverses the nested graph structure and generates a flat list
 * of RequiredChecklistItem objects. Each item is enriched with a `lineage`
 * property, containing the IDs of its parent entities (e.g., pieceId, movementId),
 * which is essential for filtering and displaying the checklist in a sliced,
 * hierarchical UI.
 */
export function expandRequiredChecklistItems(
  graph: ChecklistGraph,
  options?: ExpandOptions,
): RequiredChecklistItem[] {
  const items: RequiredChecklistItem[] = [];

  // Central helper to add items for a group of entities.
  // It now accepts and attaches the `lineage` object.
  const addEntityGroup = (
    entityType: ChecklistEntityType,
    nodes: NodeLike[] | undefined,
    lineage: RequiredChecklistItem["lineage"] = {},
  ) => {
    if (!nodes || nodes.length === 0) return;
    const schema = REVIEW_CHECKLIST_SCHEMA[entityType];
    for (const n of nodes) {
      if (
        schema.doNotReviewTwice &&
        isGloballyReviewed(entityType, n.id, options)
      ) {
        continue;
      }

      // We don't include movements and sections in checklist items if its parent pieceVersion has already been reviewed
      if (["MOVEMENT", "SECTION"].includes(entityType)) {
        if (
          lineage.pieceVersionId &&
          isGloballyReviewed("PIECE_VERSION", lineage.pieceVersionId, options)
        ) {
          debug.warn(
            `Skipping ${entityType} ${n.id} as its parent pieceVersion has already been reviewed: ${lineage.pieceVersionId}`,
          );
          continue;
        } else {
          debug.info(`Including ${entityType} ${n.id} in checklist`);
        }
      }

      for (const field of schema.fields) {
        const ctx: RequiredPredicateCtx = {
          graph,
          entityType,
          entityId: n.id,
          fieldRelativePath: field.path,
        };
        if (!isRequiredField(field, ctx)) continue;

        // Get item value
        let value;
        switch (entityType) {
          case "CONTRIBUTION": {
            const contribution = graph.contributions.find((c) => c.id === n.id);
            if (!contribution) {
              debug.warn(`Contribution not found :`, {
                entityType,
                lineage,
                n,
              });
              continue;
            }
            if ("person" in contribution) {
              if (field.path !== "personId") {
                value = contribution[field.path];
              } else {
                const personId = contribution.person.id;
                const person = graph.persons?.find((p) => p.id === personId);
                value = person && getPersonName(person);
              }
            } else if ("organization" in contribution) {
              if (field.path !== "organizationId") {
                value = contribution[field.path];
              } else {
                const organizationId = contribution.organization.id;
                const organization = graph.organizations?.find(
                  (o) => o.id === organizationId,
                );
                value = organization?.name;
              }
            } else {
              debug.warn(`Unexpected contribution type :`, {
                entityType,
                lineage,
                n,
              });
            }
            break;
          }
          case "MM_SOURCE_ON_PIECE_VERSION": {
            const sourceOnPieceVersion = graph.sourceOnPieceVersions.find(
              (sopv) => sopv.joinId === n.id,
            );
            if (!sourceOnPieceVersion) {
              debug.warn(`SourceOnPieceVersion not found :`, {
                entityType,
                lineage,
                n,
              });
              continue;
            }
            value = sourceOnPieceVersion[field.path];
            break;
          }
          case "SECTION": {
            if (field.path === "tempoIndicationId") {
              const tempoIndicationId = (n as SectionState).tempoIndication?.id;
              const tempoIndication = graph.tempoIndications?.find(
                (ti) => ti.id === tempoIndicationId,
              );
              value = tempoIndication?.text;
            } else {
              value = n[field.path];
            }
            break;
          }
          case "PIECE": {
            if (field.path === "composerId") {
              const person = graph.persons?.find((p) => p.id === n[field.path]);
              if (!person) {
                debug.warn(`Person not found :`, {
                  entityType,
                  lineage,
                  n,
                });
                continue;
              } else {
                value = getPersonName(person);
              }
            } else if (
              ["collectionId", "collectionRank"].includes(field.path)
            ) {
              const collection = graph.collections?.find(
                (c) => c.id === n.collectionId,
              );
              if (!collection) {
                debug.warn(`Collection not found :`, {
                  entityType,
                  lineage,
                  n,
                });
                continue;
              } else {
                value =
                  field.path === "collectionId"
                    ? collection.title
                    : n[field.path];
              }
            } else {
              value = n[field.path];
            }
            break;
          }
          case "COLLECTION": {
            if (field.path === "composerId") {
              const person = graph.persons?.find((p) => p.id === n[field.path]);
              if (!person) {
                debug.warn(`Person not found :`, {
                  entityType,
                  lineage,
                  n,
                });
                continue;
              } else {
                value = getPersonName(person);
              }
            } else {
              value = n[field.path];
            }
            break;
          }
          default: {
            if (typeof n[field.path] === "undefined") {
              debug.warn(`undefined n[${field.path}] :`, {
                entityType,
                lineage,
                n,
              });
            }
            value = n[field.path];
            break;
          }
        }

        value = getItemValueDisplay({
          entityType,
          fieldPath: field.path,
          value,
        });

        try {
          items.push({
            entityType,
            entityId: n.id,
            field,
            fieldPath: buildFieldPath(entityType, n.id, field.path),
            label: field.label,
            value,
            lineage, // Attach the complete lineage to each item
          });
        } catch (e) {
          console.error(
            "[expandRequiredChecklistItems] Error computing field path",
            {
              entityType,
              field,
              n,
            },
          );
          throw new Error(
            `[expandRequiredChecklistItems] Error computing field path for entity ${entityType}, field ${JSON.stringify(field)} and node ${JSON.stringify(n)} : ${e instanceof Error ? e.message : e}`,
          );
        }
      }
    }
  };

  // --- 1. Source Level Entities ---
  // These have no parent lineage and belong to the "Summary" slice.
  addEntityGroup("MM_SOURCE", [graph.source as any]);
  if (graph.source.references) {
    addEntityGroup(
      "REFERENCE",
      graph.source.references as Array<{ id: string }>,
    );
  }
  if (graph.contributions) {
    addEntityGroup(
      "CONTRIBUTION",
      graph.contributions as Array<{ id: string }>,
    );
  }
  addEntityGroup(
    "MM_SOURCE_ON_PIECE_VERSION",
    graph.sourceOnPieceVersions.map((sopv) => ({ id: sopv.joinId })) as Array<{
      id: string;
    }>,
  );

  // --- 2. Top-Level Standalone Entities ---
  // These also have no parent lineage in this context.
  addEntityGroup("PERSON", graph.persons);
  addEntityGroup("ORGANIZATION", graph.organizations);
  addEntityGroup("PIECE", graph.pieces);

  // only add collections if they are entirely included in the source
  if (graph.collections) {
    for (const c of graph.collections) {
      if (
        isCollectionCompleteInChecklistGraph({
          collectionId: c.id,
          graph,
        })
      ) {
        addEntityGroup("COLLECTION", graph.collections);
      }
    }
  }

  // TODO: include tempo indications per se in the checklist ?
  // addEntityGroup("TEMPO_INDICATION", graph.tempoIndications);

  // --- 3. Piece Structure (Nested Traversal) ---
  // This loop builds the lineage context as it descends.
  if (graph.pieceVersions) {
    for (const pv of graph.pieceVersions) {
      const piece = graph.pieces?.find((p) => p.id === pv.pieceId);
      const pvLineage: RequiredChecklistItem["lineage"] = {
        collectionId: piece?.collectionId ?? undefined,
        pieceId: pv.pieceId ?? undefined,
        pieceVersionId: pv.id,
      };
      addEntityGroup("PIECE_VERSION", [pv as any], pvLineage);

      const movements = (pv as any).movements;
      if (movements) {
        for (const m of movements) {
          const movLineage = { ...pvLineage, movementId: m.id };
          addEntityGroup("MOVEMENT", [m as any], movLineage);

          const sections = (m as any).sections;
          if (sections) {
            addEntityGroup("SECTION", sections, movLineage);
          }
        }
      }
    }
  }

  // --- 4. Final Entities That Require Lineage Lookup ---
  if (graph.metronomeMarks) {
    for (const mm of graph.metronomeMarks) {
      if (!mm.sectionId) continue;
      let mmLineage: RequiredChecklistItem["lineage"] | undefined;
      for (const pv of graph.pieceVersions ?? []) {
        for (const m of (pv as any).movements ?? []) {
          if (m.sections?.some((s: any) => s.id === mm.sectionId)) {
            const piece = graph.pieces?.find((p) => p.id === pv.pieceId);
            mmLineage = {
              collectionId: piece?.collectionId ?? undefined,
              pieceId: pv.pieceId,
              pieceVersionId: pv.id,
              movementId: m.id,
              sectionId: mm.sectionId,
            };
            break;
          }
        }
        if (mmLineage) break;
      }
      addEntityGroup("METRONOME_MARK", [mm as any], mmLineage);
    }
  }

  return items;
}

function isRequiredField(
  field: ChecklistField,
  ctx: RequiredPredicateCtx,
): boolean {
  const req = field.meta?.required;
  if (req === undefined) return true;
  if (typeof req === "function") return !!req(ctx);
  return !!req;
}

function isGloballyReviewed(
  entityType: ChecklistEntityType,
  entityId: string | null | undefined,
  options?: ExpandOptions,
): boolean {
  if (!entityId) return false;
  const sets = options?.globallyReviewed;
  switch (entityType) {
    case "PERSON":
      return !!sets?.personIds?.has(entityId);
    case "ORGANIZATION":
      return !!sets?.organizationIds?.has(entityId);
    case "COLLECTION":
      return !!sets?.collectionIds?.has(entityId);
    case "PIECE":
      return !!sets?.pieceIds?.has(entityId);
    case "PIECE_VERSION":
      return !!sets?.pieceVersionIds?.has(entityId);
    default:
      return false;
  }
}
