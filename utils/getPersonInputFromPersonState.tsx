import { PersonInput, PersonState } from "@/types/formTypes";

export default function getPersonInputFromPersonState(
  personState: PersonState,
): PersonInput {
  const personInput: PersonInput = {
    id: personState.id,
    firstName: personState.firstName,
    lastName: personState.lastName,
    birthYear: personState.birthYear.toString(),
    ...(personState.deathYear
      ? { deathYear: personState.deathYear.toString() }
      : {}),
  };
  return personInput;
}
