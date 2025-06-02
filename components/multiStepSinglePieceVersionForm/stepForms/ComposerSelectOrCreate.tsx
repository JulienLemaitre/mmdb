import React, { useEffect, useState } from "react";
import Loader from "@/components/Loader";
import ComposerSelectForm from "@/components/entities/composer/ComposerSelectForm";
import ComposerEditForm from "@/components/entities/composer/ComposerEditForm";
import { PersonInput, PersonState } from "@/types/formTypes";
import { getNewEntities } from "@/components/context/feedFormContext";
import { FeedFormState } from "@/types/feedFormTypes";
import getAllComposers from "@/utils/getAllComposers";
import { SinglePieceVersionFormState } from "@/components/context/SinglePieceVersionFormContext";

type ComposerSelectOrCreateProps = {
  feedFormState: FeedFormState;
  singlePieceVersionFormState: SinglePieceVersionFormState;
  onComposerCreated: (composer: PersonInput) => void;
  onComposerSelect: (composer: PersonInput) => void;
  selectedComposerId: string | null;
  onInitComposerCreation: () => void;
  onCancelComposerCreation: () => void;
};

const ComposerSelectOrCreate = ({
  feedFormState,
  singlePieceVersionFormState,
  onComposerCreated,
  onComposerSelect,
  selectedComposerId,
  onInitComposerCreation: onInitComposerCreationFn,
  onCancelComposerCreation,
}: ComposerSelectOrCreateProps) => {
  // Composer has just been created in the present form
  const hasComposerJustBeenCreated =
    !!singlePieceVersionFormState.composer?.isNew;
  const [composers, setComposers] = useState<PersonState[] | null>(null);
  const [isLoading, setIsLoading] = useState(!hasComposerJustBeenCreated);
  const [isCreation, setIsCreation] = useState(hasComposerJustBeenCreated);
  const newPersons = getNewEntities(feedFormState, "persons", {
    includeUnusedInFeedForm: true,
  });
  const newSelectedComposer = newPersons?.find(
    (person) => person.id === selectedComposerId,
  );

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
    if (!isLoading) return;

    getAllComposers()
      .then((data) => {
        setComposers(data?.composers);
        setIsLoading(false);
      })
      .catch((err) => {
        console.log(`[fetch(URL_API_GETALL_COMPOSERS)] err :`, err);
        setIsLoading(false);
      });
  }, [isLoading]);

  const onInitComposerCreation = () => {
    onInitComposerCreationFn();
    setIsCreation(true);
  };
  const onCancelComposerEdition = () => {
    if (hasComposerJustBeenCreated) {
      onCancelComposerCreation();
    }
    setIsLoading(true);
    setIsCreation(false);
  };

  if (isLoading) return <Loader />;
  if (!composerFullList)
    return <p>{`Oups, No data could be fetched. Can't continue...`}</p>;

  return isCreation ? (
    <ComposerEditForm
      composer={newSelectedComposer}
      onCancel={onCancelComposerEdition}
      onSubmit={onComposerCreated}
    />
  ) : (
    <ComposerSelectForm
      composers={composerFullList}
      value={selectedComposer}
      onComposerSelect={onComposerSelect}
      onInitComposerCreation={onInitComposerCreation}
    />
  );
};

export default ComposerSelectOrCreate;
