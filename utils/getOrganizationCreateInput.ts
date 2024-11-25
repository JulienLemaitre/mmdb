// Prepare the data for persistence in DB of new Organizations
import { PersistableFeedFormState } from "@/components/context/feedFormContext";
import { Prisma } from "@prisma/client";

export default function getOrganizationCreateInput(
  state: PersistableFeedFormState,
  creatorId: string,
): Prisma.OrganizationCreateManyInput[] {
  // Find all the new organization to persist in db.
  const newOrganizations = state.organizations.filter((organization) => {
    if (!organization.isNew) {
      console.log(
        `[getOrganizationCreateInput] organization found without isNew = true : ${organization.id}`,
      );
      return false;
    }

    const contribution = state.mMSourceContributions.find(
      // @ts-ignore
      (c) => c?.organization?.id === organization.id,
    );
    if (!contribution) {
      console.log(
        `[getOrganizationCreateInput] No contribution pointing to the new organization ${organization.id}`,
      );
      return false;
    }

    if (contribution) {
      return true;
    }
  });
  console.log(
    `[getComposerCreateInput] newOrganizations`,
    JSON.stringify(newOrganizations, null, 2),
  );

  const organizationsInput: Prisma.OrganizationCreateManyInput[] =
    newOrganizations.map((newOrganization) => ({
      id: newOrganization.id,
      name: newOrganization.name,
      creatorId,
    }));

  return organizationsInput;
}
