import { OrganizationState, PersonState } from "@/types/formTypes";
import { FeedFormState } from "@/types/feedFormTypes";
import { normalizeForSearch } from "@/utils/normalizeForSearch";
import { db } from "@/utils/server/db";

function getPersonKey(person: Pick<PersonState, "firstName" | "lastName">) {
  return JSON.stringify([
    normalizeForSearch(person.firstName),
    normalizeForSearch(person.lastName),
  ]);
}

/**
 * Reuses persisted people and organizations when newly entered names differ
 * only by case or accents, then rewrites every state reference to those IDs.
 */
export async function deduplicateNewPersonsAndOrganizations(
  state: FeedFormState,
): Promise<FeedFormState> {
  const newPersons = (state.persons ?? []).filter((person) => person.isNew);
  const newOrganizations = (state.organizations ?? []).filter(
    (organization) => organization.isNew,
  );

  if (newPersons.length === 0 && newOrganizations.length === 0) return state;

  const [existingPersons, existingOrganizations] = await Promise.all([
    newPersons.length > 0
      ? db.person.findMany({
          select: {
            id: true,
            firstName: true,
            lastName: true,
            birthYear: true,
            deathYear: true,
          },
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        })
      : Promise.resolve([]),
    newOrganizations.length > 0
      ? db.organization.findMany({
          select: { id: true, name: true },
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        })
      : Promise.resolve([]),
  ]);

  const existingPersonByKey = new Map<string, PersonState>();
  const existingPersonIds = new Set<string>();
  for (const person of existingPersons) {
    existingPersonIds.add(person.id);
    const key = getPersonKey(person);
    if (!existingPersonByKey.has(key)) existingPersonByKey.set(key, person);
  }

  const existingOrganizationByName = new Map<string, OrganizationState>();
  const existingOrganizationIds = new Set<string>();
  for (const organization of existingOrganizations) {
    existingOrganizationIds.add(organization.id);
    const key = normalizeForSearch(organization.name);
    if (!existingOrganizationByName.has(key)) {
      existingOrganizationByName.set(key, organization);
    }
  }

  const personStateById = new Map(
    (state.persons ?? []).map((person) => [person.id, person]),
  );
  const organizationStateById = new Map(
    (state.organizations ?? []).map((organization) => [
      organization.id,
      organization,
    ]),
  );

  const personResolutionById = new Map<string, PersonState>();
  const firstNewPersonByKey = new Map<string, PersonState>();
  for (const person of newPersons) {
    if (existingPersonIds.has(person.id)) continue;

    const key = getPersonKey(person);
    const existingPerson = existingPersonByKey.get(key);
    if (existingPerson) {
      personResolutionById.set(
        person.id,
        personStateById.get(existingPerson.id) ?? existingPerson,
      );
      continue;
    }

    const firstNewPerson = firstNewPersonByKey.get(key);
    if (firstNewPerson) personResolutionById.set(person.id, firstNewPerson);
    else firstNewPersonByKey.set(key, person);
  }

  const organizationResolutionById = new Map<string, OrganizationState>();
  const firstNewOrganizationByName = new Map<string, OrganizationState>();
  for (const organization of newOrganizations) {
    if (existingOrganizationIds.has(organization.id)) continue;

    const key = normalizeForSearch(organization.name);
    const existingOrganization = existingOrganizationByName.get(key);
    if (existingOrganization) {
      organizationResolutionById.set(
        organization.id,
        organizationStateById.get(existingOrganization.id) ??
          existingOrganization,
      );
      continue;
    }

    const firstNewOrganization = firstNewOrganizationByName.get(key);
    if (firstNewOrganization) {
      organizationResolutionById.set(organization.id, firstNewOrganization);
    } else {
      firstNewOrganizationByName.set(key, organization);
    }
  }

  if (
    personResolutionById.size === 0 &&
    organizationResolutionById.size === 0
  ) {
    return state;
  }

  const personsById = new Map<string, PersonState>();
  for (const person of state.persons ?? []) {
    const resolvedPerson = personResolutionById.get(person.id) ?? person;
    if (!personsById.has(resolvedPerson.id)) {
      personsById.set(resolvedPerson.id, resolvedPerson);
    }
  }

  const organizationsById = new Map<string, OrganizationState>();
  for (const organization of state.organizations ?? []) {
    const resolvedOrganization =
      organizationResolutionById.get(organization.id) ?? organization;
    if (!organizationsById.has(resolvedOrganization.id)) {
      organizationsById.set(resolvedOrganization.id, resolvedOrganization);
    }
  }

  const resolvePersonId = (id: string) =>
    personResolutionById.get(id)?.id ?? id;
  const resolveOrganizationId = (id: string) =>
    organizationResolutionById.get(id)?.id ?? id;

  return {
    ...state,
    persons: Array.from(personsById.values()),
    organizations: Array.from(organizationsById.values()),
    collections: state.collections?.map((collection) => ({
      ...collection,
      composerId: resolvePersonId(collection.composerId),
    })),
    pieces: state.pieces?.map((piece) => ({
      ...piece,
      composerId: resolvePersonId(piece.composerId),
    })),
    mMSourceContributions: state.mMSourceContributions?.map((contribution) => {
      if ("personId" in contribution) {
        return {
          ...contribution,
          personId: resolvePersonId(contribution.personId),
        };
      }
      return {
        ...contribution,
        organizationId: resolveOrganizationId(contribution.organizationId),
      };
    }),
  };
}
