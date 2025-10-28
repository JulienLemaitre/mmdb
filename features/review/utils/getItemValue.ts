import {
  ChecklistGraph,
  ENTITY_PREFIX,
  RequiredChecklistItem,
} from "@/features/review/ReviewChecklistSchema";
import getPersonName from "@/utils/getPersonName";

export function getItemValue({
  item,
  graph,
}: {
  item: RequiredChecklistItem;
  graph: ChecklistGraph;
}) {
  if (item.entityType === "MM_SOURCE" && "path" in item.field) {
    return graph.source[item.field.path];
  }
  const graphPropName = `${ENTITY_PREFIX[item.entityType]}s`;

  if (graph[graphPropName] && "path" in item.field) {
    const entity = graph[graphPropName]?.find((e) => e.id === item.entityId);
    console.log(`[] entity :`, entity);
    console.log(
      `[] graphPropName :`,
      graphPropName,
      `entity[item.field.path]`,
      entity[item.field.path],
    );

    if (graphPropName === "contributions") {
      if ("personId" === item.field.path) {
        return entity.person ? getPersonName(entity.person) : null;
      }
      if ("organizationId" === item.field.path) {
        return entity?.organization ? entity.organization.name : null;
      }
    }

    return entity[item.field.path];
  }

  if ("path" in item.field) {
    return findEntityValueInGraphById({ item, graph });
  } else {
    console.log(`[getItemValue] No path in item.field :`, item.field);
    console.log({
      item,
      graphPropName,
      "ENTITY_PREFIX[item.entityType]": ENTITY_PREFIX[item.entityType],
    });
  }
}

function findEntityValueInGraphById({
  item,
  graph,
}: {
  item: RequiredChecklistItem;
  graph: ChecklistGraph;
}) {
  const fieldPath = "path" in item.field ? item.field.path : item.fieldPath;
  if (item.entityType === "PIECE")
    return graph.pieces?.find((p) => p.id === item.entityId)?.[fieldPath];
  if (item.entityType === "PIECE_VERSION")
    return graph.pieceVersions?.find((pv) => pv.id === item.entityId)?.[
      fieldPath
    ];
  if (item.entityType === "MOVEMENT") {
    for (const pv of graph.pieceVersions ?? []) {
      for (const mv of pv.movements ?? []) {
        if (item.entityId === mv.id) return mv[fieldPath];
      }
    }
  }
  if (item.entityType === "SECTION") {
    for (const pv of graph.pieceVersions ?? []) {
      for (const mv of pv.movements ?? []) {
        for (const sec of mv.sections ?? []) {
          if (sec.id === item.entityId) {
            if (fieldPath === "tempoIndicationId") {
              return sec.tempoIndication.text;
            }

            // if (fieldPath === "metronomeMarkId") {}
            //   const mm = graph.metronomeMarks?.find(
            //     (mm) => mm.sectionId === sec.id,
            //   );
            // }

            return sec[fieldPath];
          }
        }
      }
    }
  }
  if (item.entityType === "METRONOME_MARK")
    return graph.metronomeMarks?.find((mm) => mm.id === item.entityId)?.[
      fieldPath
    ];
  if (item.entityType === "TEMPO_INDICATION")
    return graph.tempoIndications?.find((ti) => ti.id === item.entityId)?.[
      fieldPath
    ];
  if (item.entityType === "REFERENCE")
    return graph.source?.references?.find((ref) => ref.id === item.entityId)?.[
      fieldPath
    ];

  console.log(
    `[findEntityInGraphById] Nothing found for item`,
    JSON.stringify(item),
  );
}
