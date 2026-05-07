import {
  assertsContributionHasPersonOrOrganization,
  ContributionState,
} from "@/types/formTypes";
import { Prisma } from "@/prisma/client";

export default function getMMSourceContributionDBInputFromState(
  contribution: ContributionState,
): Prisma.ContributionCreateWithoutMMSourceInput {
  assertsContributionHasPersonOrOrganization(contribution);
  const { id, role } = contribution;
  if ("personId" in contribution && contribution.personId) {
    return {
      id,
      role,
      person: {
        connect: {
          id: contribution.personId,
        },
      },
    };
  }

  if ("organizationId" in contribution && contribution.organizationId) {
    return {
      id,
      role,
      organization: {
        connect: {
          id: contribution.organizationId,
        },
      },
    };
  }

  throw new Error(`Invalid contribution: ${JSON.stringify(contribution)}`);
}
