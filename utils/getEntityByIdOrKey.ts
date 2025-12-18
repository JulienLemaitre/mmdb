import { FeedFormState } from "@/types/feedFormTypes";

import { ChecklistGraph } from "@/types/reviewTypes";

export function getEntityByIdOrKey(
  state: FeedFormState | ChecklistGraph,
  entityName: string,
  id: string,
  key = "id",
) {
  if (Array.isArray(state?.[entityName])) {
    return state[entityName].find((entity) => entity[key] === id);
  }
}
