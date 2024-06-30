import React, { useEffect, useState } from "react";
import { Person } from "@prisma/client";
import Loader from "@/components/Loader";
import ComposerSelectForm from "@/components/entities/composer/ComposerSelectForm";
import ComposerEditForm from "@/components/entities/composer/ComposerEditForm";
import { PersonState } from "@/types/formTypes";
import {
  useFeedForm,
  getNewEntities,
} from "@/components/context/feedFormContext";
import { URL_API_GETALL_COMPOSERS } from "@/utils/routes";

const ComposerSelectOrCreate = ({
  state,
  onComposerCreated,
  onComposerSelect,
}) => {
  const [composers, setComposers] = useState<Person[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreation, setIsCreation] = useState(false);
  const { state: feedFormState } = useFeedForm();
  const selectedComposerId = state?.composer?.id;
  const newPersons = getNewEntities(feedFormState, "persons");
  let composerFullList = [...(composers || []), ...(newPersons || [])];

  // If we have new composers, we need to sort the composerFullList
  if (newPersons?.length) {
    composerFullList = composerFullList.sort((a, b) => {
      if (a.lastName < b.lastName) return -1;
      if (a.lastName > b.lastName) return 1;
      if (a.firstName < b.firstName) return -1;
      if (a.firstName > b.firstName) return 1;
      return 0;
    });
  }

  const selectedComposer: PersonState | undefined = composerFullList.find(
    (composer) => composer.id === selectedComposerId,
  );

  useEffect(() => {
    fetch(URL_API_GETALL_COMPOSERS, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        setComposers(data?.composers);
        setIsLoading(false);
      })
      .catch((err) => {
        console.log(`[fetch(URL_API_GETALL_COMPOSERS)] err :`, err);
        setIsLoading(false);
      });
  }, []);

  const onComposerCreationClick = () => {
    setIsCreation(true);
  };

  if (isLoading) return <Loader />;
  if (!composerFullList)
    return <p>{`Oups, No data could be fetched. Can't continue...`}</p>;

  return isCreation ? (
    <ComposerEditForm onSubmit={onComposerCreated} />
  ) : (
    <ComposerSelectForm
      composers={composerFullList}
      value={selectedComposer}
      onComposerSelect={onComposerSelect}
      onComposerCreationClick={onComposerCreationClick}
    />
  );
};

export default ComposerSelectOrCreate;
