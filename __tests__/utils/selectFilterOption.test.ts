import {
  filterContributionOption,
  filterPersonOption,
} from "@/utils/selectFilterOption";

describe("select option search", () => {
  it("matches composers by first name, last name, and full name regardless of case or accents", () => {
    const option = {
      label: "Élodie Durand",
      value: "person-1",
      data: {
        person: {
          firstName: "Élodie",
          lastName: "Durand",
        },
      },
    };

    expect(filterPersonOption(option, "ELODIE")).toBe(true);
    expect(filterPersonOption(option, "DURAND")).toBe(true);
    expect(filterPersonOption(option, "elodie durand")).toBe(true);
    expect(filterPersonOption(option, "Beethoven")).toBe(false);
  });

  it("matches person contributions regardless of case or accents", () => {
    const option = {
      label: "Élodie Durand [person]",
      value: "person-1",
      data: {
        label: "Élodie Durand [person]",
        person: {
          firstName: "Élodie",
          lastName: "Durand",
        },
      },
    };

    expect(filterContributionOption(option, "elodie")).toBe(true);
    expect(filterContributionOption(option, "DURAND")).toBe(true);
  });

  it("matches organization contributions regardless of case or accents", () => {
    const option = {
      label: "Musée des Beaux-Arts [organization]",
      value: "organization-1",
      data: {
        label: "Musée des Beaux-Arts [organization]",
        organization: { name: "Musée des Beaux-Arts" },
      },
    };

    expect(filterContributionOption(option, "MUSEE")).toBe(true);
    expect(filterContributionOption(option, "BEAUX")).toBe(true);
    expect(filterContributionOption(option, "Orchestre")).toBe(false);
  });
});
