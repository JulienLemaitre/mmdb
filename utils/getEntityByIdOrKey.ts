import { FeedFormState } from "@/types/feedFormTypes";

export function getEntityByIdOrKey(
  state: FeedFormState,
  entityName: string,
  id: string,
  key = "id",
) {
  if (Array.isArray((state as any)?.[entityName])) {
    return (state as any)[entityName].find((entity: any) => entity[key] === id);
  }
}
