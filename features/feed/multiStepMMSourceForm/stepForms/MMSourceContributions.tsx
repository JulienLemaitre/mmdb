import React, { useEffect, useState } from "react";
import { updateFeedForm, useFeedForm } from "@/context/feedFormContext";
import { getStepByRank } from "@/features/feed/multiStepMMSourceForm/stepsUtils";
import {
  ContributionStateWithoutId,
  OrganizationState,
  PersonState,
} from "@/types/formTypes";
import SourceContributionSelectForm from "@/features/sourceContribution/SourceContributionSelectForm";
import { URL_API_GETALL_PERSONS_AND_ORGANIZATIONS } from "@/utils/routes";
import { LoaderCentered } from "@/ui/LoaderCentered";
import DebugBox from "@/ui/DebugBox";

export default function MMSourceContributions() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [draftPersons, setDraftPersons] = useState<PersonState[]>([]);
  const [draftOrganizations, setDraftOrganizations] = useState<
    OrganizationState[]
  >([]);

  const { dispatch, currentStepRank, state } = useFeedForm();
  const step = getStepByRank(currentStepRank);

  const onSubmit = (
    selectedContributions: ContributionStateWithoutId[],
    option: { goToNextStep: boolean },
  ) => {
    if (draftPersons.length > 0) {
      updateFeedForm(dispatch, "persons", {
        array: draftPersons,
      });
    }
    if (draftOrganizations.length > 0) {
      updateFeedForm(dispatch, "organizations", {
        array: draftOrganizations,
      });
    }

    updateFeedForm(dispatch, "mMSourceContributions", {
      array: selectedContributions,
      next: !!option?.goToNextStep,
      reset: true,
    });
  };

  const onCreateDraftPerson = (person: PersonState) => {
    setDraftPersons((prev) => [...prev, person]);
  };

  const onCreateDraftOrganization = (organization: OrganizationState) => {
    setDraftOrganizations((prev) => [...prev, organization]);
  };

  useEffect(() => {
    fetch(URL_API_GETALL_PERSONS_AND_ORGANIZATIONS)
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) return <LoaderCentered />;
  if (!data)
    return <p>{`Oups, No data could be fetched. Can't continue...`}</p>;
  const { persons, organizations } = data;

  return (
    <>
      <SourceContributionSelectForm
        contributions={state.mMSourceContributions}
        persons={[...persons, ...draftPersons]}
        organizations={[...organizations, ...draftOrganizations]}
        onCreateDraftPerson={onCreateDraftPerson}
        onCreateDraftOrganization={onCreateDraftOrganization}
        onSubmit={onSubmit}
        title={step.title}
        submitTitle={step.title}
      />
      <DebugBox
        stateObject={{ draftPersons, draftOrganizations }}
        title="Contribution entities state"
        // shouldExpandNode={(level) => level < 3}
        expandAllNodes
      />
    </>
  );
}
