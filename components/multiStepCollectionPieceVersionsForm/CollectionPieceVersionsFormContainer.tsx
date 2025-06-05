import {
  updateFeedForm,
  useFeedForm,
} from "@/components/context/feedFormContext";
import {
  updateCollectionPieceVersionsForm,
  useCollectionPieceVersionsForm,
} from "@/components/context/CollectionPieceVersionsFormContext";
import {
  CollectionInput,
  CollectionState,
  CollectionTitleInput,
  MMSourcePieceVersionsState,
  PersonInput,
  PersonState,
  PiecePieceVersion,
  PieceState,
  PieceVersionState,
} from "@/types/formTypes";
import { getStepByRank } from "@/components/multiStepCollectionPieceVersionsForm/stepsUtils";
import DebugBox from "@/components/DebugBox";
import { v4 as uuidv4 } from "uuid";
import CollectionPieceVersionsSteps from "@/components/multiStepCollectionPieceVersionsForm/CollectionPieceVersionsSteps";
import getPersonStateFromPersonInput from "@/utils/getPersonStateFromPersonInput";
import React, { useCallback } from "react";
import CollectionPieceVersionFormSummary from "@/components/multiStepSinglePieceVersionForm/CollectionPieceVersionFormSummary";

type CollectionPieceVersionFormProps = {
  onFormClose: () => void;
};

function CollectionPieceVersionsFormContainer({
  onFormClose,
}: CollectionPieceVersionFormProps) {
  const { dispatch: feedFormDispatch, state: feedFormState } = useFeedForm();
  const {
    dispatch,
    state: collectionPieceVersionFormState,
    currentStepRank,
  } = useCollectionPieceVersionsForm();
  const currentStep = getStepByRank({
    state: collectionPieceVersionFormState,
    rank: currentStepRank,
  });
  const StepFormComponent = currentStep.Component;

  ////////////////// COMPOSER ////////////////////

  const selectedComposerId =
    collectionPieceVersionFormState?.collection?.composerId;

  const onInitComposerCreation = () => {
    updateCollectionPieceVersionsForm(dispatch, "collection", {
      value: { composerId: null },
    });
  };

  const onComposerCreated = (composer: PersonInput) => {
    const newComposer: PersonState = getPersonStateFromPersonInput({
      ...(selectedComposerId
        ? feedFormState.persons?.find((p) => p.id === selectedComposerId)
        : {}),
      ...composer,
    });
    newComposer.isNew = true;
    updateFeedForm(feedFormDispatch, "persons", { array: [newComposer] });
    updateCollectionPieceVersionsForm(dispatch, "collection", {
      value: { composerId: newComposer.id, isComposerNew: true },
      next: true,
    });
  };
  const onComposerSelect = (composer: PersonInput) => {
    updateFeedForm(feedFormDispatch, "persons", { array: [composer] });
    updateCollectionPieceVersionsForm(dispatch, "collection", {
      value: { composerId: composer.id },
      next: true,
    });
  };

  const onCancelComposerCreation = () => {
    if (collectionPieceVersionFormState.collection?.isComposerNew) {
      // Case: coming back after having first submitted the new composer and cancel it. All in the same collectionPieceVersionsForm.
      // => The composer's data is in the feedFormState; we delete it there too.
      updateCollectionPieceVersionsForm(dispatch, "collection", {
        value: {
          composerId: null,
        },
      });
      updateFeedForm(feedFormDispatch, "persons", {
        deleteIdArray: [selectedComposerId],
      });
    }
  };

  ////////////////// COLLECTION ////////////////////

  const selectedCollectionId = collectionPieceVersionFormState?.collection?.id;

  const onInitCollectionCreation = () => {
    updateCollectionPieceVersionsForm(dispatch, "collection", {
      value: {
        id: null,
      },
    });
  };
  const onCancelCollectionCreation = () => {
    if (collectionPieceVersionFormState.collection?.isNew) {
      // Case: coming back after having first submitted the new collection and cancel it. All in the same collectionPieceVersionsForm.
      // => The collection's data is in the feedFormState; we delete it there too.
      updateCollectionPieceVersionsForm(dispatch, "collection", {
        value: {
          id: null,
        },
      });
      updateFeedForm(feedFormDispatch, "collections", {
        deleteIdArray: [selectedCollectionId],
      });
    }
  };
  const onCollectionCreated = (collection: CollectionTitleInput) => {
    if (!selectedComposerId) {
      console.error("[ERROR] No composer selected for collection creation.");
      return;
    }
    const newCollection: CollectionState = {
      ...collection,
      composerId: selectedComposerId,
      id: collection.id || uuidv4(),
      isNew: true,
    };
    updateFeedForm(feedFormDispatch, "collections", { array: [newCollection] });
    updateCollectionPieceVersionsForm(dispatch, "collection", {
      value: {
        id: newCollection.id,
        composerId: newCollection.composerId,
        title: newCollection.title,
        isNew: true,
      },
      next: true,
    });
  };
  const onCollectionSelect = (collection: CollectionInput) => {
    updateFeedForm(feedFormDispatch, "collections", { array: [collection] });
    updateCollectionPieceVersionsForm(dispatch, "collection", {
      value: {
        id: collection.id,
        composerId: collection.composerId,
        title: collection.title,
      },
      next: true,
    });
  };

  /////////////////// PIECE //////////////////////////////

  const onAddPieces = useCallback(
    (pieces: PieceState[]) => {
      updateFeedForm(feedFormDispatch, "pieces", {
        array: pieces,
      });
    },
    [feedFormDispatch],
  );

  /////////////////// PIECE VERSION //////////////////////////////

  const onAddPieceVersion = (pieceVersion: PieceVersionState) => {
    const payload = { array: [pieceVersion] };
    updateFeedForm(feedFormDispatch, "pieceVersions", payload);
  };

  ////////////////// SUBMIT ////////////////////

  const onSubmitPiecePieceVersions = (
    piecePieceVersions: PiecePieceVersion[],
  ) => {
    // Check if all the pieceVersions are in feedFormState
    if (
      !piecePieceVersions.every((ppv) =>
        feedFormState.pieceVersions?.some((pv) => pv.id === ppv.pieceVersionId),
      )
    ) {
      console.error(
        "[ERROR] At least one pieceVersion in piecePieceVersions does not exist in feedFormState.",
      );
      return;
    }

    const payloadArray = piecePieceVersions.map((ppv, index) => ({
      pieceVersionId: ppv.pieceVersionId,
      rank: (feedFormState.mMSourcePieceVersions || []).length + index + 1,
    }));

    console.log(`[onAddSourceOnPieceVersions] payloadArray :`, payloadArray);

    updateFeedForm(feedFormDispatch, "mMSourcePieceVersions", {
      array: payloadArray,
    });
    onFormClose();
  };

  const onSubmitSourceOnPieceVersions = (
    sourceOnPieceVersions: MMSourcePieceVersionsState[],
  ) => {
    // Check if all the pieceVersions are in feedFormState
    if (
      !sourceOnPieceVersions.every((sopv) =>
        feedFormState.pieceVersions?.some(
          (pv) => pv.id === sopv.pieceVersionId,
        ),
      )
    ) {
      console.error(
        "[ERROR] At least one pieceVersion in piecePieceVersions does not exist in feedFormState.",
      );
      return;
    }

    const payloadArray = sourceOnPieceVersions
      .toSorted((a, b) => (a.rank > b.rank ? 1 : -1))
      .map((sopv) => ({
        pieceVersionId: sopv.pieceVersionId,
        rank: (feedFormState.mMSourcePieceVersions || []).length + sopv.rank,
      }));

    console.log(`[onAddSourceOnPieceVersions] payloadArray :`, payloadArray);

    updateFeedForm(feedFormDispatch, "mMSourcePieceVersions", {
      array: payloadArray,
    });
    onFormClose();
  };

  return (
    <div>
      <div className="flex w-full gap-3 max-w-3xl">
        <div className="flex-1">
          <h2 className="mb-3 text-2xl font-bold">{`Add a complete collection`}</h2>
          <CollectionPieceVersionsSteps />
        </div>
        <div className="width-1/3 pt-2">
          <CollectionPieceVersionFormSummary />
        </div>
      </div>

      {StepFormComponent ? (
        <StepFormComponent
          onFormClose={onFormClose}
          feedFormState={feedFormState}
          // Composer
          selectedComposerId={selectedComposerId}
          hasComposerJustBeenCreated={
            !!collectionPieceVersionFormState.collection?.isComposerNew
          }
          onComposerSelect={onComposerSelect}
          onInitComposerCreation={onInitComposerCreation}
          onCancelComposerCreation={onCancelComposerCreation}
          onComposerCreated={onComposerCreated}
          // Collection
          selectedCollectionId={selectedCollectionId}
          hasCollectionJustBeenCreated={
            !!collectionPieceVersionFormState.collection?.isNew
          }
          onInitCollectionCreation={onInitCollectionCreation}
          onCancelCollectionCreation={onCancelCollectionCreation}
          onCollectionSelect={onCollectionSelect}
          onCollectionCreated={onCollectionCreated}
          onAddPieces={onAddPieces}
          onAddPieceVersion={onAddPieceVersion}
          onSubmitPiecePieceVersions={onSubmitPiecePieceVersions}
          onSubmitSourceOnPieceVersions={onSubmitSourceOnPieceVersions}
        />
      ) : (
        <div>Nothing to show...</div>
      )}
      <DebugBox
        title="Collection form state"
        stateObject={collectionPieceVersionFormState}
        shouldExpandNode={(level) => level < 3}
      />
    </div>
  );
}

export default CollectionPieceVersionsFormContainer;
