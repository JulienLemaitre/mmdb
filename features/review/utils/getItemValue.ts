import {
  ChecklistGraph,
  ENTITY_PREFIX,
  RequiredChecklistItem,
} from "@/features/review/ReviewChecklistSchema";

export function getItemValue({
  item,
  graph,
}: {
  item: RequiredChecklistItem;
  graph: ChecklistGraph;
}) {
  // TODO: Need to work for every entityType
  console.log({
    item: item,
    "ENTITY_PREFIX[item.entityType]": ENTITY_PREFIX[item.entityType],
    ...("path" in item.field && {
      "item.field.path": item.field.path,
      "graph.source[item.field.path]": graph.source[item.field.path],
    }),
  });
  // let value: any;
  if (item.entityType === "MM_SOURCE" && "path" in item.field) {
    return graph.source[item.field.path];
  }
  const graphPropName = `${ENTITY_PREFIX[item.entityType]}s`;
  if (graph[graphPropName] && "path" in item.field) {
    const entity = graph[graphPropName]?.find((e) => e.id === item.entityId);
    return entity[item.field.path];
  }
  if (item.entityType !== "MM_SOURCE") {
    return item.entityId
      ? graph[`${ENTITY_PREFIX[item.entityType]}s`]?.find(
          (e) => e.id === item.entityId,
        )
      : undefined;
  }
}
