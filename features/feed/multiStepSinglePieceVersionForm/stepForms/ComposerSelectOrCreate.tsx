import React, { useEffect, useState } from "react";
import ComposerSelectContainer from "@/features/composer/form/ComposerSelectContainer";
import ComposerEditForm from "@/features/composer/form/ComposerEditForm";
import { PersonInput, PersonState } from "@/types/formTypes";
import { getNewEntities } from "@/context/feedFormContext";
import { FeedFormState } from "@/types/feedFormTypes";
import getAllComposers from "@/utils/getAllComposers";
import { LoaderCentered } from "@/ui/LoaderCentered";
import { SinglePieceVersionFormState } from "@/types/singlePieceVersionFormTypes";

type ComposerSelectOrCreateProps = {
  feedFormState: FeedFormState;
  singlePieceVersionFormState: SinglePieceVersionFormState;
  onComposerCreated: (composer: PersonInput) => void;
  onComposerSelect: (composer: PersonInput) => void;
  selectedComposerId: string | null;
  onInitComposerCreation: () => void;
  onCancelComposerCreation: () => void;
  hasComposerJustBeenCreated: boolean;
  isUpdateMode?: boolean;
};

const ComposerSelectOrCreate = ({
  feedFormState,
  singlePieceVersionFormState,
  onComposerCreated,
  onComposerSelect,
  selectedComposerId,
  onInitComposerCreation: onInitComposerCreationFn,
  onCancelComposerCreation,
  hasComposerJustBeenCreated,
  isUpdateMode,
}: ComposerSelectOrCreateProps) => {
  const [composers, setComposers] = useState<PersonState[] | null>(null);
  const [isLoading, setIsLoading] = useState(!hasComposerJustBeenCreated);

  const newPersons: PersonState[] = getNewEntities(feedFormState, "persons", {
    includeUnusedInFeedForm: true,
  });
  if (singlePieceVersionFormState.composer?.isNew) {
    newPersons.push(singlePieceVersionFormState.composer);
  }
  const newSelectedComposer = newPersons?.find(
    (person) => person.id === selectedComposerId,
  );
  const isNewComposerUpdate = isUpdateMode && !!newSelectedComposer;
  const [isCreation, setIsCreation] = useState(
    hasComposerJustBeenCreated || isNewComposerUpdate,
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
        console.log(`[fetch getAllComposers()] err :`, err);
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

  if (isLoading) return <LoaderCentered />;
  if (!composerFullList)
    return <p>{`Oups, No data could be fetched. Can't continue...`}</p>;

  return isCreation ? (
    <ComposerEditForm
      composer={newSelectedComposer}
      onCancel={onCancelComposerEdition}
      onSubmit={onComposerCreated}
    />
  ) : (
    <ComposerSelectContainer
      composers={composerFullList}
      value={selectedComposer}
      onComposerSelect={onComposerSelect}
      onInitComposerCreation={onInitComposerCreation}
    />
  );
};

export default ComposerSelectOrCreate;
