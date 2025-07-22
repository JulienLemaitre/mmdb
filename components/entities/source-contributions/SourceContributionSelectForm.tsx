import {
  ContributionStateWithoutId,
  OptionInput,
  OrganizationState,
  PersonState,
} from "@/types/formTypes";
import { useState } from "react";
import PlusIcon from "@/components/svg/PlusIcon";
import SourceContributionSelect from "@/components/entities/source-contributions/SourceContributionSelect";
import { CONTRIBUTION_ROLE } from "@prisma/client";
import MMSourceFormStepNavigation from "@/components/multiStepMMSourceForm/MMSourceFormStepNavigation";
import TrashIcon from "@/components/svg/TrashIcon";
import getRoleLabel from "@/utils/getRoleLabel";
import _isEqual from "lodash/isEqual";

type SourceContributionSelectFormProps = {
  contributions?: ContributionStateWithoutId[];
  persons: PersonState[];
  organizations: OrganizationState[];
  onSubmit: (
    contributions: ContributionStateWithoutId[],
    option: { goToNextStep: boolean },
  ) => void;
  submitTitle?: string;
  title?: string;
};

export default function SourceContributionSelectForm({
  contributions,
  persons,
  organizations,
  onSubmit,
  submitTitle,
  title,
}: SourceContributionSelectFormProps) {
  const [selectedContributions, setSelectedContributions] = useState<
    ContributionStateWithoutId[]
  >(contributions || []);

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
    const { role } = personContribution;
    let person: PersonState;

    // Case of selection of existing person
    if ("personId" in personContribution) {
      const foundPerson = [...persons, ...createdPersons].find(
        (person) => person.id === personContribution.personId,
      );
      if (foundPerson) {
        person = foundPerson;
      } else {
        console.warn(
          `[SourceContributionSelectForm] onAddPersonContribution person NOT FOUND`,
        );
        return;
      }
    }

    // Case of creation of a new person
    if ("person" in personContribution) {
      person = personContribution.person;
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
      const foundOrganization = [
        ...organizations,
        ...createdOrganizations,
      ].find(
        (organization) =>
          organization.id === organizationContribution.organizationId,
      );
      if (foundOrganization) {
        organization = foundOrganization;
      } else {
        console.warn(
          `[SourceContributionSelectForm] onAddPersonContribution organization NOT FOUND`,
        );
        return;
      }
    }

    // Case of creation of a new organization
    if ("organization" in organizationContribution) {
      organization = organizationContribution.organization;
      setCreatedOrganizations((prevList) => [...prevList, organization]);
    }

    setSelectedContributions((prevList) => [
      ...prevList,
      { organization, role },
    ]);
    setIsFormOpen(false);
  };

  const onRemoveContribution = (index: number) => {
    setSelectedContributions((prevList) =>
      prevList.filter((contribution, idx) => idx !== index),
    );
  };

  const personOptions: OptionInput[] = [...persons, ...createdPersons]
    .reduce((list: PersonState[], currentPerson: PersonState) => {
      if (list.some((person) => person.id === currentPerson.id)) {
        return list;
      }
      return [...list, currentPerson];
    }, [])
    .map((person: PersonState) => ({
      value: person.id,
      label: `${person.firstName} ${person.lastName} [person]`,
    }));
  const organizationOptions: OptionInput[] = [
    ...organizations,
    ...createdOrganizations,
  ]
    .reduce((list: OrganizationState[], currentOrg: OrganizationState) => {
      if (list.some((org) => org.id === currentOrg.id)) {
        return list;
      }
      return [...list, currentOrg];
    }, [])
    .map((organization: OrganizationState) => ({
      value: organization.id,
      label: `${organization.name} [organization]`,
    }));
  const sourceContributionOptions = [
    ...personOptions,
    ...organizationOptions,
  ].sort((a, b) => (a.label > b.label ? 1 : -1));

  const isPresentFormDirty = !_isEqual(
    selectedContributions,
    contributions || [],
  );

  return (
    <>
      <h1 className="mb-4 text-4xl font-bold">
        {title ?? (
          <>
            Metronome Mark Source
            <span className="block text-xl font-normal">Contributions</span>
          </>
        )}
      </h1>
      <ul className="my-4">
        {selectedContributions.map((contribution, index) => {
          let key: string;
          let displayName: string;
          let contributionType: "person" | "organization";
          if ("organization" in contribution) {
            // TypeScript now knows that contribution is OrganizationState in this block
            key = `${index}-${contribution.role}-${contribution.organization.id}`;
            displayName = contribution.organization.name;
            contributionType = "organization";
          } else {
            // TypeScript now knows that contribution is PersonState in this block
            key = `${index}-${contribution.role}-${contribution.person.id}`;
            displayName = `${contribution.person.firstName} ${contribution.person.lastName}`;
            contributionType = "person";
          }

          return (
            <li key={key} className="mt-6">
              <div className="flex w-full justify-between gap-3 items-end">
                <div>
                  <h4 className="text-lg font-bold text-secondary">{`${
                    index + 1
                  }. ${getRoleLabel(contribution.role)}`}</h4>
                  <div className="flex gap-3 items-center">
                    <div>{displayName}</div>
                    <div
                      className={`badge badge-outline ${contributionType === "person" ? "badge-primary" : "badge-secondary"}`}
                    >
                      {contributionType === "person"
                        ? "Person"
                        : `Organization`}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-error"
                  onClick={() => onRemoveContribution(index)}
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {isFormOpen ? (
        <SourceContributionSelect
          sourceContributionOptions={sourceContributionOptions}
          onCancel={() => setIsFormOpen(false)}
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

      <MMSourceFormStepNavigation
        onSave={() => onSubmit(selectedContributions, { goToNextStep: false })}
        onSaveAndGoToNextStep={() =>
          onSubmit(selectedContributions, { goToNextStep: true })
        }
        onResetForm={() => setSelectedContributions(contributions || [])}
        isPresentFormDirty={isPresentFormDirty}
        isNextDisabled={!(selectedContributions.length > 0 && !isFormOpen)}
        submitTitle={submitTitle}
      />
    </>
  );
}
