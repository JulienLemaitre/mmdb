"use client";

import { useEffect, useState } from "react";
import Loader from "@/components/Loader";
import {
  updateFeedForm,
  useFeedForm,
} from "@/components/context/feedFormContext";
import { getStepByRank } from "@/components/multiStepMMSourceForm/stepsUtils";
import { ContributionStateWithoutId } from "@/types/formTypes";
import SourceContributionSelectForm from "@/components/entities/source-contributions/create/SourceContributionSelectForm";

export default function MMSourceContributions() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const { dispatch, currentStepRank, state } = useFeedForm();
  const step = getStepByRank(currentStepRank);

  const onSubmit = (selectedContributions: ContributionStateWithoutId[]) => {
    updateFeedForm(dispatch, "mMSourceContributions", {
      array: selectedContributions,
      next: true,
    });
  };

  useEffect(() => {
    fetch("/api/getAll/personAndOrganization")
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

  return (
    <SourceContributionSelectForm
      contributions={state.mMSourceContributions}
      persons={persons}
      organizations={organizations}
      onSubmit={onSubmit}
      title={step.title}
      submitTitle={step.title}
    />
  );
}
