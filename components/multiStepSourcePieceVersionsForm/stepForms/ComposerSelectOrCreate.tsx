import React, { useEffect, useState } from "react";
import { Person } from "@prisma/client";
import {
  useFeedForm,
  updateFeedForm,
} from "@/components/context/feedFormContext";
import Loader from "@/components/Loader";
import ComposerSelectForm from "@/components/entities/composer/ComposerSelectForm";
import ComposerEditForm from "@/components/entities/composer/ComposerEditForm";
import { PersonInput, PersonState } from "@/types/editFormTypes";

const ComposerSelectOrCreate = () => {
  const [composers, setComposers] = useState<Person[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreation, setIsCreation] = useState(false);
  const { state, dispatch } = useFeedForm();
  console.log(
    `[SourceOnPieceVersionForm] state.editedSourceOnPieceVersions :`,
    state.editedSourceOnPieceVersions,
  );
  const selectedComposerId = state.editedSourceOnPieceVersions?.composerId;
  const newPersons = state.persons;
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
    console.log(`[onComposerCreated] composer :`, composer);
    updateFeedForm(dispatch, "persons", composer);
    updateFeedForm(dispatch, "editedSourceOnPieceVersions", {
      composerId: composer.id,
    });
  };

  const onComposerSelect = (composer: PersonInput) => {
    console.log(`[onComposerSelect] composer :`, composer);
    updateFeedForm(dispatch, "editedSourceOnPieceVersions", {
      value: {
        composerId: composer.id,
      },
    });
  };

  if (isLoading) return <Loader />;
  if (!composers)
    return <p>{`Oups, No data could be fetched. Can't continue...`}</p>;

  console.log(`[ComposerSelectOrCreate] composers :`, composers);

  return isCreation ? (
    <ComposerEditForm onComposerCreated={onComposerCreated} />
  ) : (
    <ComposerSelectForm
      composers={composers}
      value={selectedComposer}
      onComposerSelect={onComposerSelect}
    />
  );
};

export default ComposerSelectOrCreate;
