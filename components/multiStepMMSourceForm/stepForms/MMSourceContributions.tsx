import { useEffect, useState } from "react";
import Loader from "@/components/Loader";
import {
  updateFeedForm,
  useFeedForm,
} from "@/components/context/feedFormContext";
import { getStepByRank } from "@/components/multiStepMMSourceForm/stepsUtils";
import { ContributionStateWithoutId } from "@/types/formTypes";
import SourceContributionSelectForm from "@/components/entities/source-contributions/SourceContributionSelectForm";
import { URL_API_GETALL_PERSONS_AND_ORGANIZATIONS } from "@/utils/routes";

export default function MMSourceContributions() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const { dispatch, currentStepRank, state } = useFeedForm();
  const step = getStepByRank(currentStepRank);

  const onSubmit = (
    selectedContributions: ContributionStateWithoutId[],
    option: { goToNextStep: boolean },
  ) => {
    updateFeedForm(dispatch, "mMSourceContributions", {
      array: selectedContributions,
      next: !!option?.goToNextStep,
      replace: true,
    });
  };

  useEffect(() => {
    fetch(URL_API_GETALL_PERSONS_AND_ORGANIZATIONS)
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) return <Loader />;
  if (!data)
    return <p>{`Oups, No data could be fetched. Can't continue...`}</p>;
  const { persons, organizations } = data;
  const newPersonsInState =
    state?.persons?.filter((person) => person.isNew) || [];
  const newOrganizationsInState =
    state?.organizations?.filter((organization) => organization.isNew) || [];

  return (
    <SourceContributionSelectForm
      contributions={state.mMSourceContributions}
      persons={[...persons, ...newPersonsInState]}
      organizations={[...organizations, ...newOrganizationsInState]}
      onSubmit={onSubmit}
      title={step.title}
      submitTitle={step.title}
    />
  );
}
