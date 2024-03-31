"use client";

import { useEffect, useState } from "react";
import Loader from "@/components/Loader";
import {
  updateFeedForm,
  useFeedForm,
} from "@/components/context/feedFormContext";
import { getStepByRank } from "@/components/multiStepForm/constants";
import { ContributionStateWithoutId } from "@/types/editFormTypes";
import SourceContributionSelectForm from "@/components/entities/source-contributions/create/SourceContributionSelectForm";

export default function MMSourceContributions() {
  const [data, setData] = useState(null);
  const [isLoading, setLoading] = useState(true);

  const { dispatch, currentStepRank } = useFeedForm();
  const step = getStepByRank(currentStepRank);

  const onSubmit = (selectedContributions: ContributionStateWithoutId[]) => {
    updateFeedForm(dispatch, "mMSourceContributions", {
      selectedContributions,
      next: true,
    });
  };

  useEffect(() => {
    fetch("/api/getAll/personAndOrganization")
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      });
  }, []);

  if (isLoading) return <Loader />;
  if (!data)
    return <p>{`Oups, No data could be fetched. Can't continue...`}</p>;

  const { persons, organizations } = data;

  return (
    <SourceContributionSelectForm
      persons={persons}
      organizations={organizations}
      onSubmit={onSubmit}
      submitTitle={step.title}
    />
  );
}
