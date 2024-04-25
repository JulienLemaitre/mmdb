"use client";
import {
  ContributionStateWithoutId,
  OptionInput,
  OrganizationState,
  PersonState,
} from "@/types/formTypes";
import {
  updateEditForm,
  useEditForm,
} from "@/components/context/editFormContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import PlusIcon from "@/components/svg/PlusIcon";
import SourceContributionSelect from "@/components/entities/source-contributions/SourceContributionSelect";
import { CONTRIBUTION_ROLE } from "@prisma/client";
import { URL_CREATE_METRONOME_MARKS } from "@/utils/routes";

type SourceContributionSelectFormProps = {
  persons: PersonState[];
  organizations: OrganizationState[];
};

export default function SourceContributionSelectForm({
  persons,
  organizations,
}: SourceContributionSelectFormProps) {
  const { dispatch } = useEditForm();
  const router = useRouter();

  const [selectedContributions, setSelectedContributions] = useState<
    ContributionStateWithoutId[]
  >([]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [createdPersons, setCreatedPersons] = useState<PersonState[]>([]);
  const [createdOrganizations, setCreatedOrganizations] = useState<
    OrganizationState[]
  >([]);

  const onAddPersonContribution = (
    personContribution:
      | {
          personId: string;
          role: CONTRIBUTION_ROLE;
        }
      | {
          person: PersonState;
          role: CONTRIBUTION_ROLE;
        },
  ) => {
    console.log(
      `[onAddPersonContribution] personContribution :`,
      personContribution,
    );
    const { role } = personContribution;
    let person: PersonState;
    // Case of selection of existing person
    if ("personId" in personContribution) {
      const foundPerson = persons.find(
        (person) => person.id === personContribution.personId,
      );
      console.log(
        `[SourceContributionSelectForm] onAddPersonContribution SELECT:`,
        foundPerson,
      );
      if (foundPerson) {
        person = foundPerson;
      } else {
        console.log(
          `[SourceContributionSelectForm] onAddPersonContribution person NOT FOUND`,
        );
        return;
      }
    }
    // Case of creation of a new person
    if ("person" in personContribution) {
      person = personContribution.person;
      console.log(
        `[SourceContributionSelectForm] onAddPersonContribution NEW:`,
        person,
      );
      setCreatedPersons((prevList) => [...prevList, person]);
    }
    setSelectedContributions((prevList) => [...prevList, { person, role }]);
    setIsFormOpen(false);
  };
  const onAddOrganizationContribution = (
    organizationContribution:
      | {
          organizationId: string;
          role: CONTRIBUTION_ROLE;
        }
      | {
          organization: OrganizationState;
          role: CONTRIBUTION_ROLE;
        },
  ) => {
    const { role } = organizationContribution;
    let organization: OrganizationState;
    // Case of selection of existing organization
    if ("organizationId" in organizationContribution) {
      const foundOrganization = organizations.find(
        (organization) =>
          organization.id === organizationContribution.organizationId,
      );
      console.log(
        `[SourceContributionSelectForm] onAddOrganizationContribution SELECT:`,
        foundOrganization,
      );
      if (foundOrganization) {
        organization = foundOrganization;
      } else {
        console.log(
          `[SourceContributionSelectForm] onAddPersonContribution organization NOT FOUND`,
        );
        return;
      }
    }
    // Case of creation of a new organization
    if ("organization" in organizationContribution) {
      organization = organizationContribution.organization;
      console.log(
        `[SourceContributionSelectForm] onAddOrganizationContribution NEW:`,
        organization,
      );
      setCreatedOrganizations((prevList) => [...prevList, organization]);
    }

    setSelectedContributions((prevList) => [
      ...prevList,
      { organization, role },
    ]);
    setIsFormOpen(false);
  };
  const onSubmit = () => {
    updateEditForm(dispatch, "sourceContributions", selectedContributions);
    router.push(URL_CREATE_METRONOME_MARKS);
  };

  const personOptions: OptionInput[] = [...persons, ...createdPersons].map(
    (person: PersonState) => ({
      value: person.id,
      label: `${person.firstName} ${person.lastName} [person]`,
    }),
  );
  const organizationOptions: OptionInput[] = [
    ...organizations,
    ...createdOrganizations,
  ].map((organization: OrganizationState) => ({
    value: organization.id,
    label: `${organization.name} [organization]`,
  }));
  const sourceContributionOptions = [
    ...personOptions,
    ...organizationOptions,
  ].sort((a, b) => (a.label > b.label ? 1 : -1));

  return (
    <>
      <ul className="my-4">
        {selectedContributions.map((contribution, index) => {
          if ("organization" in contribution) {
            // TypeScript now knows that contribution is OrganizationState in this block
            return (
              <li
                key={`${index}-${contribution.role}-${contribution.organization.id}`}
              >
                <h4 className="mt-6 text-lg font-bold text-secondary">{`Contribution ${
                  index + 1
                }`}</h4>
                <div className="flex gap-3 items-center">
                  <div className="font-bold">{`${contribution.role}:`}</div>
                  <div>{contribution.organization.name}</div>
                  <div className="badge badge-primary">{`Organization`}</div>
                </div>
              </li>
            );
          } else {
            // TypeScript now knows that contribution is PersonState in this block
            return (
              <li
                key={`${index}-${contribution.role}-${contribution.person.id}`}
              >
                <h4 className="mt-6 text-lg font-bold text-secondary">{`Contribution ${
                  index + 1
                }`}</h4>
                <div className="flex gap-3 items-center">
                  <div className="font-bold">{`${contribution.role}:`}</div>
                  <div>
                    {contribution.person.firstName}{" "}
                    {contribution.person.lastName}
                  </div>
                  <div className="badge badge-secondary">{`Person`}</div>
                </div>
              </li>
            );
          }
        })}
      </ul>

      {isFormOpen ? (
        <SourceContributionSelect
          sourceContributionOptions={sourceContributionOptions}
          onAddPersonContribution={onAddPersonContribution}
          onAddOrganizationContribution={onAddOrganizationContribution}
        />
      ) : (
        <div>
          <button
            type="button"
            className="btn btn-accent"
            onClick={() => setIsFormOpen(true)}
          >
            <PlusIcon className="w-5 h-5" />
            Add a source contribution
          </button>
        </div>
      )}

      <div>
        <button
          className="btn btn-primary mt-4"
          onClick={onSubmit}
          {...(selectedContributions.length > 0 && !isFormOpen
            ? { disabled: false }
            : { disabled: true })}
        >
          {`Submit Source Contribution${
            selectedContributions.length > 1 ? "s" : ""
          }`}
        </button>
      </div>
    </>
  );
}
