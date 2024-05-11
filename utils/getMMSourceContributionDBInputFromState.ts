import {
  assertsContributionHasPersonOrOrganization,
  ContributionState,
} from "@/types/formTypes";
import { Prisma } from ".prisma/client";
import { PersistableFeedFormState } from "@/components/context/feedFormContext";

export default function getMMSourceContributionDBInputFromState(
  contribution: ContributionState,
  state: PersistableFeedFormState,
  creatorId: string,
): Prisma.ContributionCreateWithoutMMSourceInput {
  assertsContributionHasPersonOrOrganization(contribution);
  const { id, role } = contribution;
  if ("person" in contribution) {
    const newPerson = state.persons.find(
      (person) => person.id === contribution.person.id && person.isNew,
    );

    // Existing person
    if (!newPerson) {
      return {
        id,
        role,
        person: {
          connect: {
            id: contribution.person.id,
          },
        },
      };
    }

    // New person
    return {
      id,
      role,
      person: {
        create: {
          id: newPerson.id,
          firstName: newPerson.firstName,
          lastName: newPerson.lastName,
          birthYear: newPerson.birthYear,
          deathYear: newPerson.deathYear,
          creator: {
            connect: {
              id: creatorId,
            },
          },
        },
      },
    };
  }

  // if ("organization" in contribution) {
  const newOrganization = state.organizations.find(
    (organization) =>
      organization.id === contribution.organization.id && organization.isNew,
  );

  // Existing organization
  if (!newOrganization) {
    return {
      id,
      role,
      organization: {
        connect: {
          id: contribution.organization.id,
        },
      },
    };
  }

  // New organization
  return {
    id,
    role,
    organization: {
      create: {
        id: newOrganization.id,
        name: newOrganization.name,
        creator: {
          connect: {
            id: creatorId,
          },
        },
      },
    },
  };
  // }
}
