import Select from "@/ui/form/reactSelect/Select";
import {
  OptionInput,
} from "@/types/formTypes";
import React, { useState } from "react";
import { CONTRIBUTION_ROLE } from "@/prisma/client/enums";
import NewSourceContributionForm from "@/features/sourceContribution/NewSourceContributionForm";
import Label from "@/ui/Label";
import getRoleLabel from "@/utils/getRoleLabel";
import { reactSelectStyles } from "@/ui/form/reactSelect/reactSelectStyles";

type SourceContributionSelectProps = {
  sourceContributionOptions: OptionInput[];
  onAddPersonContribution: (personContribution: {
    personId: string;
    role: CONTRIBUTION_ROLE;
  }) => void;
  onAddOrganizationContribution: (organizationContribution: {
    organizationId: string;
    role: CONTRIBUTION_ROLE;
  }) => void;
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

  const onAddContribution = () => {
    if (selectedPersonId && role) {
      onAddPersonContribution({
        personId: selectedPersonId,
        role,
      });
    }
    if (selectedOrganizationId && role) {
      onAddOrganizationContribution({
        organizationId: selectedOrganizationId,
        role,
      });
    }
  };

  const onContributionCreated = (contribution: {
    role: CONTRIBUTION_ROLE;
    personId?: string;
    organizationId?: string;
  }) => {
    if (contribution.personId) {
      onAddPersonContribution({
        role: contribution.role,
        personId: contribution.personId,
      });
    }
    if (contribution.organizationId) {
      onAddOrganizationContribution({
        role: contribution.role,
        organizationId: contribution.organizationId,
      });
    }
  };

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
            styles={reactSelectStyles}
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
            styles={reactSelectStyles}
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
