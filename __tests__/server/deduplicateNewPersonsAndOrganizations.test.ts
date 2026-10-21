import { FeedFormState } from "@/types/feedFormTypes";

const mockPersonFindMany = jest.fn();
const mockOrganizationFindMany = jest.fn();

jest.mock("@/utils/server/db", () => ({
  get db() {
    return {
      person: { findMany: (...args: any[]) => mockPersonFindMany(...args) },
      organization: {
        findMany: (...args: any[]) => mockOrganizationFindMany(...args),
      },
    };
  },
}));

import { deduplicateNewPersonsAndOrganizations } from "@/utils/server/deduplicateNewPersonsAndOrganizations";

describe("deduplicateNewPersonsAndOrganizations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("reuses existing people and organizations and updates their state references", async () => {
    mockPersonFindMany.mockResolvedValue([
      {
        id: "person-existing",
        firstName: "Élodie",
        lastName: "Durand",
        birthYear: 1800,
        deathYear: 1870,
      },
    ]);
    mockOrganizationFindMany.mockResolvedValue([
      { id: "organization-existing", name: "Musée des Beaux-Arts" },
    ]);

    const existingPersonInState = {
      id: "person-existing",
      firstName: "Élodie",
      lastName: "Durand",
      birthYear: 1801,
      deathYear: 1870,
    };
    const existingOrganizationInState = {
      id: "organization-existing",
      name: "MUSÉE des Beaux-Arts",
    };
    const state: FeedFormState = {
      persons: [
        {
          id: "person-composer-new",
          firstName: "ELODIE",
          lastName: "DURAND",
          birthYear: 1800,
          deathYear: 1870,
          isNew: true,
        },
        existingPersonInState,
        {
          id: "person-contributor-new",
          firstName: "Élodie",
          lastName: "DURAND",
          birthYear: 1800,
          deathYear: 1870,
          isNew: true,
        },
        {
          id: "person-unmatched-new",
          firstName: "New",
          lastName: "Person",
          birthYear: 1900,
          deathYear: null,
          isNew: true,
        },
      ],
      organizations: [
        {
          id: "organization-new",
          name: "MUSEE des Beaux-Arts",
          isNew: true,
        },
        existingOrganizationInState,
        {
          id: "organization-unmatched-new",
          name: "New Orchestra",
          isNew: true,
        },
      ],
      collections: [
        {
          id: "collection-1",
          composerId: "person-composer-new",
          title: "Collection",
          pieceCount: 0,
          isNew: true,
        },
      ],
      pieces: [
        {
          id: "piece-1",
          title: "Piece",
          composerId: "person-composer-new",
          isNew: true,
        },
      ],
      mMSourceContributions: [
        {
          id: "contribution-person",
          role: "EDITOR" as any,
          personId: "person-contributor-new",
        },
        {
          id: "contribution-organization",
          role: "EDITOR" as any,
          organizationId: "organization-new",
        },
      ],
    };

    const result = await deduplicateNewPersonsAndOrganizations(state);

    expect(result.persons).toEqual([existingPersonInState, state.persons![3]]);
    expect(result.organizations).toEqual([
      existingOrganizationInState,
      state.organizations![2],
    ]);
    expect(result.collections?.[0].composerId).toBe("person-existing");
    expect(result.pieces?.[0].composerId).toBe("person-existing");
    expect(result.mMSourceContributions).toEqual([
      {
        id: "contribution-person",
        role: "EDITOR",
        personId: "person-existing",
      },
      {
        id: "contribution-organization",
        role: "EDITOR",
        organizationId: "organization-existing",
      },
    ]);
    expect(mockPersonFindMany).toHaveBeenCalledWith({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        birthYear: true,
        deathYear: true,
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    expect(mockOrganizationFindMany).toHaveBeenCalledWith({
      select: { id: true, name: true },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
  });

  it("does not query the database when no new people or organizations are present", async () => {
    const state: FeedFormState = {
      persons: [
        {
          id: "person-existing",
          firstName: "Élodie",
          lastName: "Durand",
          birthYear: 1800,
          deathYear: 1870,
        },
      ],
      organizations: [{ id: "organization-existing", name: "Museum" }],
    };

    await expect(deduplicateNewPersonsAndOrganizations(state)).resolves.toBe(
      state,
    );
    expect(mockPersonFindMany).not.toHaveBeenCalled();
    expect(mockOrganizationFindMany).not.toHaveBeenCalled();
  });

  it("preserves new flags and edits when a state entity already has its database ID", async () => {
    mockPersonFindMany.mockResolvedValue([
      {
        id: "person-existing",
        firstName: "Élodie",
        lastName: "Durand",
        birthYear: 1800,
        deathYear: 1870,
      },
    ]);
    mockOrganizationFindMany.mockResolvedValue([
      { id: "organization-existing", name: "Museum" },
    ]);
    const state: FeedFormState = {
      persons: [
        {
          id: "person-existing",
          firstName: "ELODIE",
          lastName: "Durand",
          birthYear: 1800,
          deathYear: 1870,
          isNew: true,
        },
      ],
      organizations: [
        { id: "organization-existing", name: "Museum Updated", isNew: true },
      ],
    };

    await expect(deduplicateNewPersonsAndOrganizations(state)).resolves.toBe(
      state,
    );
    expect(state.persons?.[0]).toMatchObject({
      firstName: "ELODIE",
      isNew: true,
    });
    expect(state.organizations?.[0]).toMatchObject({
      name: "Museum Updated",
      isNew: true,
    });
  });
});
