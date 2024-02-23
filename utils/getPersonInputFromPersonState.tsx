import { PersonInput, PersonState } from "@/types/editFormTypes";

export default function getPersonInputFromPersonState(
  personState: PersonState,
): PersonInput {
  const personInput: PersonInput = {
    id: personState.id,
    firstName: personState.firstName,
    lastName: personState.lastName,
    birthYear: personState.birthYear,
    deathYear: personState.deathYear,
  };
  return personInput;
}
