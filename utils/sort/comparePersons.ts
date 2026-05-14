import { PersonState } from "@/types/formTypes";

export function comparePersons(a: PersonState, b: PersonState): number {
  if (a.lastName < b.lastName) return -1;
  if (a.lastName > b.lastName) return 1;
  if (a.firstName < b.firstName) return -1;
  if (a.firstName > b.firstName) return 1;
  return 0;
}
