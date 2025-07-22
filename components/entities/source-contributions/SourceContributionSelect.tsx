import Select from "@/components/ReactSelect/Select";
import {
  ContributionState,
  OptionInput,
  OrganizationState,
  PersonState,
} from "@/types/formTypes";
import React, { useCallback, useEffect, useState } from "react";
import { CONTRIBUTION_ROLE } from "@prisma/client";
import NewSourceContributionForm from "@/components/entities/source-contributions/NewSourceContributionForm";
import Label from "@/components/Label";
import getRoleLabel from "@/utils/getRoleLabel";
import { ReactSelectStyles } from "@/components/ReactSelect/ReactSelectStyles";

type SourceContributionSelectProps = {
  sourceContributionOptions: OptionInput[];
  onAddPersonContribution: (
    personContribution:
      | {
          personId: string;
          role: CONTRIBUTION_ROLE;
        }
      | {
          person: PersonState;
          role: CONTRIBUTION_ROLE;
        },
  ) => void;
  onAddOrganizationContribution: (
    organizationContribution:
      | {
          organizationId: string;
          role: CONTRIBUTION_ROLE;
        }
      | {
          organization: OrganizationState;
          role: CONTRIBUTION_ROLE;
        },
  ) => void;
  onCancel: () => void;
};
export default function SourceContributionSelect({
  sourceContributionOptions,
  onAddOrganizationContribution,
  onAddPersonContribution,
  onCancel,
}: Readonly<SourceContributionSelectProps>) {
  const contributionRoleOptions = Object.values(CONTRIBUTION_ROLE).map(
    (category) => ({
      value: category,
      label: getRoleLabel(category),
    }),
  );
  const [selectedPersonId, setSelectedPersonId] = useState<string>();
  const [selectedOrganizationId, setSelectedOrganizationId] =
    useState<string>();
  const [role, setRole] = useState<CONTRIBUTION_ROLE>();
  const [isContributionCreation, setIsContributionCreation] = useState(false);
  const [newPerson, setNewPerson] = useState<PersonState>();
  const [newOrganization, setNewOrganization] = useState<OrganizationState>();

  const onAddContribution = useCallback(() => {
    if (selectedPersonId && role) {
      onAddPersonContribution({
        personId: selectedPersonId,
        role,
      });
    }
    if (newPerson && role) {
      onAddPersonContribution({
        person: newPerson,
        role,
      });
    }
    if (selectedOrganizationId && role) {
      onAddOrganizationContribution({
        organizationId: selectedOrganizationId,
        role,
      });
    }
    if (newOrganization && role) {
      onAddOrganizationContribution({
        organization: newOrganization,
        role,
      });
    }
  }, [
    selectedPersonId,
    role,
    newPerson,
    selectedOrganizationId,
    newOrganization,
    onAddPersonContribution,
    onAddOrganizationContribution,
  ]);

  const onContributionCreated = (contribution: ContributionState) => {
    setRole(contribution.role);
    if ("person" in contribution) {
      setNewPerson(contribution.person);
    }
    if ("organization" in contribution) {
      setNewOrganization(contribution.organization);
    }
  };

  useEffect(() => {
    // Call onAddContribution when the required data is in state
    if (role && (newPerson || newOrganization)) {
      console.log("useEffect Call onAddContribution:", {
        role,
        newPerson,
        newOrganization,
      });
      onAddContribution();
    }
  }, [role, newOrganization, newPerson, onAddContribution]);

  const noOptionsMessage = () => (
    <div className="text-left">
      <div className="ml-4 mb-2">No person or organization found</div>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => {
          console.log("Create New Source Contribution");
          setIsContributionCreation(true);
        }}
      >
        Create New Source Contribution
      </button>
    </div>
  );

  return (
    <div className="border-accent border-1 rounded-md px-6 pt-4 pb-6">
      <h6 className="mb-4 text-lg font-normal text-accent">
        {`Add a source contribution`}
      </h6>
      {!isContributionCreation ? (
        <>
          <Label label={`Person or Organization`} />
          <Select
            className="react-select-container"
            classNamePrefix="react-select"
            getOptionValue={(option) =>
              option.label
                .replaceAll(" [person]", "")
                .replaceAll(" [organization]", "")
            }
            instanceId="source-contribution-select"
            isSearchable={true}
            name="sourceContribution"
            options={sourceContributionOptions}
            autoFocus
            onChange={(sourceContributionOption: OptionInput | null) => {
              if (!sourceContributionOption) return;
              if (sourceContributionOption.label.endsWith("[person]")) {
                setSelectedPersonId(sourceContributionOption.value);
                setSelectedOrganizationId(undefined);
              } else {
                setSelectedOrganizationId(sourceContributionOption.value);
                setSelectedPersonId(undefined);
              }
            }}
            noOptionsMessage={noOptionsMessage}
            styles={ReactSelectStyles}
          />
          <Label label={`Role`} isRequired />
          <Select
            className="react-select-container"
            classNamePrefix="react-select"
            instanceId="contribution-role"
            name="contributionRole"
            options={contributionRoleOptions}
            onChange={(
              contributionRoleOption: {
                value: CONTRIBUTION_ROLE;
                label: CONTRIBUTION_ROLE;
              } | null,
            ) => {
              if (!contributionRoleOption) return;
              setRole(contributionRoleOption.value);
            }}
            styles={ReactSelectStyles}
          />
        </>
      ) : (
        <NewSourceContributionForm
          onContributionCreated={onContributionCreated}
        />
      )}
      <div className="grid grid-cols-2 gap-4 items-center mt-6">
        <button className="btn btn-neutral" type="button" onClick={onCancel}>
          Cancel
        </button>
        <button
          className="btn btn-primary"
          disabled={!role || !(selectedOrganizationId ?? selectedPersonId)}
          onClick={onAddContribution}
        >
          Add this contribution
        </button>
      </div>
    </div>
  );
}
