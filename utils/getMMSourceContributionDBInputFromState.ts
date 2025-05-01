import {
  assertsContributionHasPersonOrOrganization,
  ContributionState,
} from "@/types/formTypes";
import { Prisma } from ".prisma/client";

export default function getMMSourceContributionDBInputFromState(
  contribution: ContributionState,
): Prisma.ContributionCreateWithoutMMSourceInput {
  assertsContributionHasPersonOrOrganization(contribution);
  const { id, role } = contribution;
  if ("person" in contribution) {
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
