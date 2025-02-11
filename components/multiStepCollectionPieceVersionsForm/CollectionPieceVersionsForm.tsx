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
  // PieceVersionInput,
  PieceVersionState,
} from "@/types/formTypes";
// import getCollectionStateFromInput from "@/utils/getCollectionStateFromInput";
import { getStepByRank } from "@/components/multiStepCollectionPieceVersionsForm/stepsUtils";
import DebugBox from "@/components/DebugBox";
import { v4 as uuidv4 } from "uuid";
import CollectionPieceVersionsSteps from "@/components/multiStepCollectionPieceVersionsForm/CollectionPieceVersionsSteps";
import getPersonStateFromPersonInput from "@/utils/getPersonStateFromPersonInput";
import { useCallback } from "react";

type CollectionPieceVersionFormProps = {
  onFormClose: () => void;
  onSubmit?: (payload: any) => void;
};

function CollectionPieceVersionsForm({
  onFormClose,
  onSubmit,
}: CollectionPieceVersionFormProps) {
  const { dispatch: feedFormDispatch, state: feedFormState } = useFeedForm();
  const { dispatch, state, currentStepRank } = useCollectionPieceVersionsForm();
  const currentStep = getStepByRank({ state, rank: currentStepRank });
  const StepFormComponent = currentStep.Component;

  ////////////////// COMPOSER ////////////////////

  const onComposerCreated = (composer: PersonInput) => {
    const newComposer: PersonState = getPersonStateFromPersonInput(composer);
    newComposer.isNew = true;
    updateFeedForm(feedFormDispatch, "persons", { array: [newComposer] });
    updateCollectionPieceVersionsForm(dispatch, "collection", {
      value: { composerId: newComposer.id },
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
  const selectedComposerId = state?.collection?.composerId;

  ////////////////// COLLECTION ////////////////////

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
  const selectedCollectionId = state?.collection?.id;

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

    const payloadArray = sourceOnPieceVersions.map((sopv, index) => ({
      pieceVersionId: sopv.pieceVersionId,
      rank: (feedFormState.mMSourcePieceVersions || []).length + index + 1,
    }));

    console.log(`[onAddSourceOnPieceVersions] payloadArray :`, payloadArray);

    updateFeedForm(feedFormDispatch, "mMSourcePieceVersions", {
      array: payloadArray,
    });
    onFormClose();
  };

  return (
    <div>
      <CollectionPieceVersionsSteps />
      {StepFormComponent ? (
        <StepFormComponent
          onFormClose={onFormClose}
          feedFormState={feedFormState}
          selectedComposerId={selectedComposerId}
          selectedCollectionId={selectedCollectionId}
          onSubmit={onSubmit}
          onComposerSelect={onComposerSelect}
          onComposerCreated={onComposerCreated}
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
        stateObject={state}
        shouldExpandNode={(level) => level < 3}
      />
    </div>
  );
}

export default CollectionPieceVersionsForm;
