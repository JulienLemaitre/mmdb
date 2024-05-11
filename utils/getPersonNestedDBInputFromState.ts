import { PersistableFeedFormState } from "@/components/context/feedFormContext";
import { Prisma } from "@prisma/client";

export default function getPersonNestedDBInputFromState(
  personId: string,
  state: PersistableFeedFormState,
  creatorId: string,
): Prisma.PersonCreateNestedOneWithoutContributionsInput {
  const newPerson = state.persons.find(
    (person) => person.id === personId && person.isNew,
  );

  if (!newPerson) {
    return {
      connect: {
        id: personId,
      },
    };
  }

  return {
    create: {
      id: newPerson.id,
      firstName: newPerson.firstName,
      lastName: newPerson.lastName,
      birthYear: newPerson.birthYear,
      creator: {
        connect: {
          id: creatorId,
        },
      },
    },
  };
}
