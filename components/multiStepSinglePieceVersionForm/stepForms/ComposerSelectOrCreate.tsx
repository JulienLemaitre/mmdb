import React, { useEffect, useState } from "react";
import Loader from "@/components/Loader";
import ComposerSelectForm from "@/components/entities/composer/ComposerSelectForm";
import ComposerEditForm from "@/components/entities/composer/ComposerEditForm";
import { PersonInput, PersonState } from "@/types/formTypes";
import { getNewEntities } from "@/components/context/feedFormContext";
import { FeedFormState } from "@/types/feedFormTypes";
import getAllComposers from "@/utils/getAllComposers";

type ComposerSelectOrCreateProps = {
  feedFormState: FeedFormState;
  onComposerCreated: (composer: PersonInput) => void;
  onComposerSelect: (composer: PersonInput) => void;
  selectedComposerId: number | null;
};

const ComposerSelectOrCreate = ({
  feedFormState,
  onComposerCreated,
  onComposerSelect,
  selectedComposerId,
}: ComposerSelectOrCreateProps) => {
  const [composers, setComposers] = useState<PersonState[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreation, setIsCreation] = useState(false);
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
    getAllComposers()
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
