import { PersonState } from "@/types/formTypes";

export default function getPersonName(person: PersonState) {
  return `${person.firstName} ${person.lastName}`;
}
