import React, { useEffect, useState } from "react";
import { Person } from "@prisma/client";
import Loader from "@/components/Loader";
import ComposerSelectForm from "@/components/entities/composer/ComposerSelectForm";
import ComposerEditForm from "@/components/entities/composer/ComposerEditForm";
import { PersonInput, PersonState } from "@/types/formTypes";
import {
  useSourceOnPieceVersionsForm,
  updateSourceOnPieceVersionsForm,
} from "@/components/context/SourceOnPieceVersionFormContext";
import {
  useFeedForm,
  updateFeedForm,
} from "@/components/context/feedFormContext";

const ComposerSelectOrCreate = () => {
  const [composers, setComposers] = useState<Person[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreation, setIsCreation] = useState(false);
  const { state, dispatch } = useSourceOnPieceVersionsForm();
  const { state: feedFormState } = useFeedForm();
  const selectedComposerId = state?.composerId;
  const newPersons = feedFormState.persons;
  const composerFullList = [...(composers || []), ...(newPersons || [])];
  const selectedComposer: PersonState | undefined = composerFullList.find(
    (composer) => composer.id === selectedComposerId,
  );

  useEffect(() => {
    fetch("/api/getAll/composer")
      .then((res) => res.json())
      .then((data) => {
        setComposers(data?.composers);
        setIsLoading(false);
      })
      .catch((err) => {
        console.log(`[fetch("/api/getAll/composer")] err :`, err);
        setIsLoading(false);
      });
  }, []);

  const onComposerCreated = (composer: PersonInput) => {
    updateFeedForm(dispatch, "persons", composer);
    updateSourceOnPieceVersionsForm(dispatch, "composerId", {
      value: {
        composerId: composer.id,
      },
      next: true,
    });
  };

  const onComposerSelect = (composer: PersonInput) => {
    updateSourceOnPieceVersionsForm(dispatch, "composerId", {
      value: {
        composerId: composer.id,
      },
      next: true,
    });
  };

  if (isLoading) return <Loader />;
  if (!composers)
    return <p>{`Oups, No data could be fetched. Can't continue...`}</p>;

  return isCreation ? (
    <ComposerEditForm onSubmit={onComposerCreated} />
  ) : (
    <ComposerSelectForm
      composers={composers}
      value={selectedComposer}
      onComposerSelect={onComposerSelect}
    />
  );
};

export default ComposerSelectOrCreate;
