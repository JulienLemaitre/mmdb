import { updateFeedForm, useFeedForm } from "@/context/feedFormContext";
import {
  updateCollectionPieceVersionsForm,
  useCollectionPieceVersionsForm,
} from "@/context/collectionPieceVersionsFormContext";
import {
  CollectionInput,
  CollectionState,
  CollectionTitleInput,
  MMSourceOnPieceVersionsState,
  PersonInput,
  PersonState,
  PiecePieceVersion,
  PieceState,
  PieceVersionState,
} from "@/types/formTypes";
import { getStepByRank } from "@/features/feed/multiStepCollectionPieceVersionsForm/stepsUtils";
import DebugBox from "@/ui/DebugBox";
import { v4 as uuidv4 } from "uuid";
import CollectionPieceVersionsSteps from "@/features/feed/multiStepCollectionPieceVersionsForm/CollectionPieceVersionsSteps";
import getPersonStateFromPersonInput from "@/utils/getPersonStateFromPersonInput";
import React, { useCallback, useEffect } from "react";
import CollectionPieceVersionFormSummary from "@/features/feed/multiStepSinglePieceVersionForm/CollectionPieceVersionFormSummary";
import { COLLECTION_PIECE_VERSION_FORM_LOCAL_STORAGE_KEY } from "@/utils/constants";
import { URL_API_GETALL_COLLECTION_PIECES } from "@/utils/routes";

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
  const isUpdateMode =
    !!collectionPieceVersionFormState.formInfo
      .collectionFirstMMSourceOnPieceVersionRank;

  const selectedComposerId =
    collectionPieceVersionFormState?.collection?.composerId;
  const selectedCollectionId = collectionPieceVersionFormState?.collection?.id;
  const hasCollectionJustBeenCreated =
    !!collectionPieceVersionFormState.collection?.isNew;
  const hasComposerJustBeenCreated =
    !!collectionPieceVersionFormState.collection?.isComposerNew;

  // When updating a collection that has not just been created, we start by completing the "composer" and "collection" steps automatically and go to the third step = pieceVersions
  useEffect(() => {
    if (
      isUpdateMode &&
      !hasCollectionJustBeenCreated &&
      selectedComposerId &&
      selectedCollectionId
    ) {
      console.log(
        `[goToStep 2] updating a collection that has not just been created`,
      );
      updateCollectionPieceVersionsForm(dispatch, "goToStep", {
        stepRank: 2,
      });
    }
  }, [
    selectedComposerId,
    selectedCollectionId,
    dispatch,
    hasCollectionJustBeenCreated,
    isUpdateMode,
  ]);

  ////////////////// COMPOSER ////////////////////

  const onInitComposerCreation = () => {
    updateCollectionPieceVersionsForm(dispatch, "collection", {
      value: { composerId: null },
      reset: true,
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
      reset: true,
      next: true,
    });
  };
  const onComposerSelect = (composer: PersonInput) => {
    // If a composer was being created, we delete it from the feedForm state
    if (collectionPieceVersionFormState.collection?.isComposerNew) {
      updateFeedForm(feedFormDispatch, "persons", {
        deleteIdArray: [collectionPieceVersionFormState.collection.composerId],
      });
    }
    // Same if a collection was being created
    if (collectionPieceVersionFormState.collection?.isNew) {
      updateFeedForm(feedFormDispatch, "collections", {
        deleteIdArray: [collectionPieceVersionFormState.collection?.id],
      });
    }

    updateFeedForm(feedFormDispatch, "persons", { array: [composer] });
    updateCollectionPieceVersionsForm(dispatch, "collection", {
      value: { composerId: composer.id },
      reset: true,
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
        reset: true,
      });
      updateFeedForm(feedFormDispatch, "persons", {
        deleteIdArray: [selectedComposerId],
      });
    }
  };

  ////////////////// COLLECTION ////////////////////

  const onInitCollectionCreation = () => {
    updateCollectionPieceVersionsForm(dispatch, "collection", {
      value: {
        composerId: selectedComposerId,
        ...(hasComposerJustBeenCreated ? { isComposerNew: true } : {}),
        id: null,
      },
      reset: true,
    });
  };
  const onCancelCollectionCreation = () => {
    if (collectionPieceVersionFormState.collection?.isNew) {
      // Case: coming back after having first submitted the new collection and cancel it. All in the same collectionPieceVersionsForm.
      // => The collection's data is in the feedFormState; we delete it there too.
      updateCollectionPieceVersionsForm(dispatch, "collection", {
        value: {
          composerId: selectedComposerId,
          ...(hasComposerJustBeenCreated ? { isComposerNew: true } : {}),
          id: null,
        },
        reset: true,
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
        ...(hasComposerJustBeenCreated ? { isComposerNew: true } : {}),
        title: newCollection.title,
        isNew: true,
      },
      reset: true,
      next: true,
    });
  };
  const onCollectionSelect = async (collection: CollectionInput) => {
    // If a new collection was being created, remove it from feedFormState
    if (collectionPieceVersionFormState.collection?.isNew) {
      updateFeedForm(feedFormDispatch, "collections", {
        deleteIdArray: [collectionPieceVersionFormState.collection?.id],
      });
    }

    const pieces: PieceState[] = await fetch(
      `${URL_API_GETALL_COLLECTION_PIECES}?collectionId=${collection.id}`,
    )
      .then((res) => res.json())
      .then((data) => data.pieces)
      .catch((err) => {
        console.error(
          `[fetch(/api/getAll/collectionPieces?collectionId=${selectedCollectionId})] err :`,
          err.message,
        );
      });
    updateFeedForm(feedFormDispatch, "pieces", {
      array: pieces,
    });
    updateFeedForm(feedFormDispatch, "collections", { array: [collection] });
    updateCollectionPieceVersionsForm(dispatch, "collection", {
      value: {
        id: collection.id,
        composerId: collection.composerId,
        title: collection.title,
      },
      reset: true,
      next: true,
    });
    updateCollectionPieceVersionsForm(dispatch, "formInfo", {
      value: { pieceIdsNeedingVersions: pieces.map((p) => p.id) },
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

    // Reset localStorage
    console.log(
      `[localStorage REMOVE] ${COLLECTION_PIECE_VERSION_FORM_LOCAL_STORAGE_KEY}`,
    );
    localStorage.removeItem(COLLECTION_PIECE_VERSION_FORM_LOCAL_STORAGE_KEY);

    onFormClose();
  };

  const onSubmitSourceOnPieceVersions = (
    sourceOnPieceVersions: MMSourceOnPieceVersionsState[],
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

    const isCollectionUpdate =
      typeof collectionPieceVersionFormState.formInfo
        .collectionFirstMMSourceOnPieceVersionRank === "number";
    const lastRankBefore =
      (typeof collectionPieceVersionFormState.formInfo
        .collectionFirstMMSourceOnPieceVersionRank === "number"
        ? collectionPieceVersionFormState.formInfo
            .collectionFirstMMSourceOnPieceVersionRank // First sourceOnPieceVersion.rank in case of update
        : (feedFormState.mMSourcePieceVersions || []).length) - 1;
    const payloadArray = sourceOnPieceVersions
      .toSorted((a, b) => (a.rank > b.rank ? 1 : -1))
      .map((sopv) => ({
        pieceVersionId: sopv.pieceVersionId,
        rank: lastRankBefore + sopv.rank,
      }));

    console.log(`[onSubmitSourceOnPieceVersions] payloadArray :`, payloadArray);

    updateFeedForm(feedFormDispatch, "mMSourcePieceVersions", {
      array: payloadArray,
      isCollectionUpdate,
    });

    // Change the corresponding piece.collectionRank if it has changed
    const piecePayloadArray = (feedFormState.pieces || []).reduce<PieceState[]>(
      (array: PieceState[], p: PieceState) => {
        const correspondingSourceOnPieceVersion = sourceOnPieceVersions.find(
          (sourceOnPieceVersion) =>
            (feedFormState.pieceVersions || []).some(
              (pv) =>
                sourceOnPieceVersion.pieceVersionId === pv.id &&
                pv.pieceId === p.id,
            ),
        );
        if (
          correspondingSourceOnPieceVersion &&
          p.collectionRank !== correspondingSourceOnPieceVersion.rank
        ) {
          console.log(
            `[] Change piece ${p.title} collectionRank from ${p.collectionRank} to ${correspondingSourceOnPieceVersion.rank}`,
          );
          return [
            ...array,
            {
              ...p,
              collectionRank: correspondingSourceOnPieceVersion.rank,
            },
          ];
        }

        return array;
      },
      [],
    );
    console.log(`[] piecePayloadArray :`, piecePayloadArray);
    updateFeedForm(feedFormDispatch, "pieces", {
      array: piecePayloadArray,
    });

    // Reset localStorage
    console.log(
      `[localStorage REMOVE] ${COLLECTION_PIECE_VERSION_FORM_LOCAL_STORAGE_KEY}`,
    );
    localStorage.removeItem(COLLECTION_PIECE_VERSION_FORM_LOCAL_STORAGE_KEY);

    onFormClose();
  };

  return (
    <div className="w-full max-w-3xl">
      <div className="flex gap-3">
        <div className="flex-1">
          <h2 className="mb-3 text-3xl font-bold">{`${isUpdateMode ? "Update" : "Add"} a complete collection`}</h2>
          <CollectionPieceVersionsSteps
            isUpdateMode={isUpdateMode}
            hasCollectionJustBeenCreated={hasCollectionJustBeenCreated}
          />
        </div>
        <div className="width-1/3 pt-2">
          <CollectionPieceVersionFormSummary />
        </div>
      </div>

      {StepFormComponent ? (
        <StepFormComponent
          onFormClose={onFormClose}
          feedFormState={feedFormState}
          collectionPieceVersionFormState={collectionPieceVersionFormState}
          isUpdateMode={isUpdateMode}
          // Composer
          selectedComposerId={selectedComposerId}
          hasComposerJustBeenCreated={hasComposerJustBeenCreated}
          onComposerSelect={onComposerSelect}
          onInitComposerCreation={onInitComposerCreation}
          onCancelComposerCreation={onCancelComposerCreation}
          onComposerCreated={onComposerCreated}
          // Collection
          selectedCollectionId={selectedCollectionId}
          hasCollectionJustBeenCreated={hasCollectionJustBeenCreated}
          onInitCollectionCreation={onInitCollectionCreation}
          onCancelCollectionCreation={onCancelCollectionCreation}
          onCollectionSelect={onCollectionSelect}
          onCollectionCreated={onCollectionCreated}
          // Piece and PieceVersion
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
