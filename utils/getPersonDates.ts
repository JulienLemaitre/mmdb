import { PersonState } from "@/types/formTypes";

export function getPersonDates(person: PersonState) {
  return `${person.birthYear}-${person.deathYear || "present"}`;
}
