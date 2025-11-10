import { FeedFormState } from "@/types/feedFormTypes";
import { ChecklistGraph } from "@/features/review/ReviewChecklistSchema";

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
