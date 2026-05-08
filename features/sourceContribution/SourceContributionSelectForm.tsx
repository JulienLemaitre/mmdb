import {
  ContributionStateWithoutId,
  OptionInput,
  OrganizationState,
  PersonState,
} from "@/types/formTypes";
import React, { useState } from "react";
import PlusIcon from "@/ui/svg/PlusIcon";
import SourceContributionSelect from "@/features/sourceContribution/SourceContributionSelect";
import { CONTRIBUTION_ROLE } from "@/prisma/client/enums";
import MMSourceFormStepNavigation from "@/features/feed/multiStepMMSourceForm/MMSourceFormStepNavigation";
import TrashIcon from "@/ui/svg/TrashIcon";
import getRoleLabel from "@/utils/getRoleLabel";
import _isEqual from "lodash/isEqual";
import DebugBox from "@/ui/DebugBox";

type SourceContributionSelectFormProps = {
  contributions?: ContributionStateWithoutId[];
  persons: PersonState[];
  organizations: OrganizationState[];
  onSubmit: (
    contributions: ContributionStateWithoutId[],
    option: { goToNextStep: boolean },
  ) => void;
  onAddDraftPerson: (person: PersonState) => void;
  onAddDraftOrganization: (organization: OrganizationState) => void;
  onResetDraftEntities: () => void;
  submitTitle?: string;
  title?: string;
};

export default function SourceContributionSelectForm({
  contributions,
  persons,
  organizations,
  onSubmit,
  onAddDraftOrganization,
  onAddDraftPerson,
  onResetDraftEntities,
  submitTitle,
  title,
}: SourceContributionSelectFormProps) {
  const [selectedContributions, setSelectedContributions] = useState<
    ContributionStateWithoutId[]
  >(contributions || []);

  const [isFormOpen, setIsFormOpen] = useState(false);

  const onAddPersonContribution = (personContribution: {
    personId: string;
    role: CONTRIBUTION_ROLE;
  }) => {
    setSelectedContributions((prevList) => [
      ...prevList,
      { personId: personContribution.personId, role: personContribution.role },
    ]);
    const person = persons.find((p) => p.id === personContribution.personId);
    if (person) {
      onAddDraftPerson(person);
    }
    setIsFormOpen(false);
  };
  const onAddOrganizationContribution = (organizationContribution: {
    organizationId: string;
    role: CONTRIBUTION_ROLE;
  }) => {
    setSelectedContributions((prevList) => [
      ...prevList,
      {
        organizationId: organizationContribution.organizationId,
        role: organizationContribution.role,
      },
    ]);
    const organization = organizations.find(
      (o) => o.id === organizationContribution.organizationId,
    );
    if (organization) {
      onAddDraftOrganization(organization);
    }
    setIsFormOpen(false);
  };

  const onRemoveContribution = (index: number) => {
    setSelectedContributions((prevList) =>
      prevList.filter((contribution, idx) => idx !== index),
    );
  };

  const onResetForm = () => {
    setSelectedContributions(contributions || []);
    setIsFormOpen(false);
    onResetDraftEntities();
  };

  const personOptions: OptionInput[] = persons.map((person: PersonState) => ({
    value: person.id,
    label: `${person.firstName} ${person.lastName} [person]`,
  }));
  const organizationOptions: OptionInput[] = organizations.map(
    (organization: OrganizationState) => ({
      value: organization.id,
      label: `${organization.name} [organization]`,
    }),
  );
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
            {`Metronome Mark Source`}
            <span className="block text-xl font-normal">Contributions</span>
          </>
        )}
      </h1>
      <ul className="my-4">
        {selectedContributions.map((contribution, index) => {
          let key: string;
          let displayName: string;
          let contributionType: "person" | "organization";
          if ("organizationId" in contribution) {
            const org = organizations.find(
              (o) => o.id === contribution.organizationId,
            );
            key = `${index}-${contribution.role}-${contribution.organizationId}`;
            displayName = org ? org.name : "Unknown Organization";
            contributionType = "organization";
          } else {
            const person = persons.find((p) => p.id === contribution.personId);
            key = `${index}-${contribution.role}-${contribution.personId}`;
            displayName = person
              ? `${person.firstName} ${person.lastName}`
              : "Unknown Person";
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
          onCreateDraftPerson={onAddDraftPerson}
          onCreateDraftOrganization={onAddDraftOrganization}
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
        onResetForm={onResetForm}
        isPresentFormDirty={isPresentFormDirty}
        isNextDisabled={!(selectedContributions.length > 0 && !isFormOpen)}
        submitTitle={submitTitle}
      />
      <DebugBox
        stateObject={selectedContributions}
        title="Contribution selection state"
        // shouldExpandNode={(level) => level < 3}
        expandAllNodes
      />
    </>
  );
}
