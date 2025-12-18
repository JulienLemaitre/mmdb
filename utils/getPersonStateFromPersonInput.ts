import { PersonInput, PersonState } from "@/types/formTypes";
import { v4 as uuidv4 } from "uuid";

export default function getPersonStateFromPersonInput(
  personInput: PersonInput,
): PersonState {
  const personState: PersonState = {
    id: personInput.id || uuidv4(),
    firstName: personInput.firstName,
    lastName: personInput.lastName,
    birthYear: personInput.birthYear,
    deathYear: personInput.deathYear ? personInput.deathYear : null,
  };
  return personState;
}
