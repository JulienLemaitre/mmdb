import React, { useEffect } from "react";
import SinglePieceVersionSteps from "@/components/multiStepSinglePieceVersionForm/SinglePieceVersionSteps";
import { getStepByRank } from "@/components/multiStepSinglePieceVersionForm/stepsUtils";
import DebugBox from "@/components/DebugBox";
import {
  updateSinglePieceVersionForm,
  useSinglePieceVersionForm,
} from "@/components/context/SinglePieceVersionFormContext";
import {
  PersonInput,
  PersonState,
  PieceInput,
  PieceVersionInput,
} from "@/types/formTypes";
import {
  getNewEntities,
  updateFeedForm,
  useFeedForm,
} from "@/components/context/feedFormContext";
import getPieceStateFromInput from "@/utils/getPieceStateFromInput";
import getPieceVersionStateFromInput from "@/utils/getPieceVersionStateFromInput";
import getPersonStateFromPersonInput from "@/utils/getPersonStateFromPersonInput";

type SinglePieceVersionFormProps = {
  onFormClose: () => void;
  onSubmit?: (payload: any) => void;
  initPayload?: any;
  isCollectionCreationMode?: boolean;
  composerId?: string;
  newPieceDefaultTitle?: string;
  collectionId?: string;
  collectionFormState?: any;
};

/**
 * This component will go throw the process of creating a single PieceVersion that will be added to the feedForm.
 * If the composer, piece and pieceVersion pre-exist, they will just be selected. If not, the user will be able to create them.
 */
const SinglePieceVersionForm = ({
  onFormClose,
  onSubmit,
  isCollectionCreationMode,
  composerId,
  newPieceDefaultTitle,
  collectionId,
  collectionFormState,
}: SinglePieceVersionFormProps) => {
  const { dispatch: feedFormDispatch, state: feedFormState } = useFeedForm();
  const { dispatch, state, currentStepRank } = useSinglePieceVersionForm();
  const currentStep = getStepByRank({ state, rank: currentStepRank });
  const StepFormComponent = currentStep.Component;

  // For Collection Form, we start by completing the "composer" step automatically and go to the second step = piece
  useEffect(() => {
    if (isCollectionCreationMode && composerId && currentStepRank === 0) {
      console.log(
        `[SinglePieceVersionForm] auto-complete the "composer" step and go to the next step = piece`,
      );
      updateSinglePieceVersionForm(dispatch, "composer", {
        value: {
          id: composerId,
        },
        next: true,
      });
    }
  }, [composerId, currentStepRank, dispatch, isCollectionCreationMode]);

  ////////////////// COMPOSER ////////////////////

  const onComposerCreated = (composer: PersonInput) => {
    const newComposer: PersonState = getPersonStateFromPersonInput(composer);
    newComposer.isNew = true;
    updateFeedForm(feedFormDispatch, "persons", { array: [newComposer] });
    updateSinglePieceVersionForm(dispatch, "composer", {
      value: { id: newComposer.id },
      next: true,
    });
  };

  const onComposerSelect = (composer: PersonInput) => {
    updateFeedForm(feedFormDispatch, "persons", { array: [composer] });
    updateSinglePieceVersionForm(dispatch, "composer", {
      value: { id: composer.id },
      next: true,
    });
  };
  const selectedComposerId = state?.composer?.id;

  //////////////////// PIECE ////////////////////

  const selectedPieceId = state?.piece?.id;
  const newPieces = getNewEntities(feedFormState, "pieces");
  const newSelectedPiece = newPieces?.find(
    (piece) => piece.id === selectedPieceId,
  );
  const isPieceSelectedNew = !!newSelectedPiece;
  const onPieceCreated = async (data: PieceInput) => {
    // Front input values validation is successful at this point.
    console.log("[onPieceCreated] data", data);

    const pieceData = data;
    // Remove null values from pieceData
    Object.keys(pieceData).forEach(
      // '== null' is true for undefined AND null values
      (key) => pieceData[key] == null && delete pieceData[key],
    );

    const composerId = pieceData.composerId || selectedComposerId;
    if (!composerId) {
      console.log(
        "OUPS: No composerId in pieceData or form state to link to the piece",
      );
      // TODO: trigger a toast
      return;
    }

    const pieceState = getPieceStateFromInput({
      ...pieceData,
      composerId,
    });
    pieceState.isNew = true;

    // If a piece is selected AND it is a newly created one present in the form state, we build a deletedIdArray with its id for it to be removed from state
    let deleteIdArray: string[] = [];
    if (selectedPieceId && isPieceSelectedNew) {
      deleteIdArray = [selectedPieceId];
    }
    console.log(`[] pieceState :`, pieceState);
    let piecesArray = [pieceState];

    if (isCollectionCreationMode && collectionId && collectionFormState) {
      piecesArray = piecesArray.map((piece) => ({
        ...piece,
        collectionId,
        collectionRank:
          (collectionFormState.mMSourcePieceVersions.length || 0) + 1,
      }));
    }
    console.log(`[with potential collection value] piecesArray :`, piecesArray);

    updateFeedForm(feedFormDispatch, "pieces", {
      array: piecesArray,
      ...(deleteIdArray.length ? { deleteIdArray } : {}),
    });
    updateSinglePieceVersionForm(dispatch, "piece", {
      value: { id: pieceState.id },
      next: true,
    });
  };

  const deleteSelectedPieceIfNew = () => {
    let deleteIdArray: string[] = [];
    if (selectedPieceId && isPieceSelectedNew) {
      deleteIdArray = [selectedPieceId];
    }
    if (deleteIdArray.length) {
      updateFeedForm(feedFormDispatch, "pieces", {
        deleteIdArray,
      });
    }
  };

  const onPieceSelect = (piece: PieceInput) => {
    // If a piece is selected AND it is a newly created one present in the form state, we build a deletedIdArray with its id for it to be removed from state
    deleteSelectedPieceIfNew();

    updateFeedForm(feedFormDispatch, "pieces", { array: [piece] });
    updateSinglePieceVersionForm(dispatch, "piece", {
      value: {
        id: piece.id,
      },
      next: true,
    });
  };

  /////////////////// PIECE VERSION ////////////////////

  const selectedPieceVersionId = state?.pieceVersion?.id;
  const newPieceVersions = getNewEntities(feedFormState, "pieceVersions");
  const newSelectedPieceVersion = newPieceVersions?.find(
    (pieceVersion) => pieceVersion.id === selectedPieceVersionId,
  );
  const isPieceVersionSelectedNew = !!newSelectedPieceVersion;

  const onPieceVersionCreated = (data: PieceVersionInput) => {
    // Front input values validation is successful at this point.
    console.log("[onPieceVersionCreated] data", data);

    if (!selectedPieceId) {
      console.log(
        `[onPieceVersionCreated] No selectedPieceId found - cannot create pieceVersion`,
      );
      return;
    }

    const pieceVersionData = data;
    // Remove null values from pieceVersionData
    Object.keys(pieceVersionData).forEach(
      // '== null' is true for undefined AND null values
      (key) => pieceVersionData[key] == null && delete pieceVersionData[key],
    );

    const pieceVersionState = getPieceVersionStateFromInput({
      pieceVersionInput: pieceVersionData,
      pieceId: selectedPieceId,
    });
    pieceVersionState.isNew = true;
    console.log("New pieceVersion to be stored in state", pieceVersionState);
    updateFeedForm(feedFormDispatch, "pieceVersions", {
      array: [pieceVersionState],
    });
    updateSinglePieceVersionForm(dispatch, "pieceVersion", {
      value: pieceVersionState,
      next: true,
    });
  };

  const deleteSelectedPieceVersionIfNew = () => {
    let deleteIdArray: string[] = [];
    if (selectedPieceVersionId && isPieceVersionSelectedNew) {
      deleteIdArray = [selectedPieceVersionId];
    }
    if (deleteIdArray.length) {
      updateFeedForm(feedFormDispatch, "pieceVersions", {
        deleteIdArray,
      });
    }
    // if (isCollectionCreationMode) {
    //   onFormClose();
    // }
  };

  const onPieceVersionSelect = (pieceVersion: PieceVersionInput) => {
    updateFeedForm(feedFormDispatch, "pieceVersions", {
      array: [pieceVersion],
    });
    updateSinglePieceVersionForm(dispatch, "pieceVersion", {
      value: {
        id: pieceVersion.id,
      },
      next: true,
    });
  };

  /////////////////// SUMMARY ////////////////////

  const onAddSourceOnPieceVersions = () => {
    if (!state.pieceVersion?.id) {
      console.log(
        `[onAddPieceVersionOnSource] ERROR: state.pieceVersion?.id SHOULD BE DEFINED`,
      );
      return;
    }

    const payload = {
      array: [
        {
          pieceVersionId: state.pieceVersion?.id,
          rank: (feedFormState.mMSourcePieceVersions || []).length + 1,
        },
      ],
    };
    // This is useful for submitting a pieceVersion to a collection form instead of the general feedForm
    if (typeof onSubmit === "function") {
      console.log(`[SUBMIT] with provided onSubmit function`);
      onSubmit(payload);
    } else {
      updateFeedForm(feedFormDispatch, "mMSourcePieceVersions", payload);
    }

    onFormClose();
  };

  return (
    <div>
      <SinglePieceVersionSteps isCollectionMode={isCollectionCreationMode} />
      {StepFormComponent ? (
        <StepFormComponent
          onFormClose={onFormClose}
          feedFormState={feedFormState}
          selectedComposerId={state?.composer?.id}
          selectedPieceId={state?.piece?.id}
          selectedPieceVersionId={state?.pieceVersion?.id}
          onComposerSelect={onComposerSelect}
          onComposerCreated={onComposerCreated}
          onPieceCreated={onPieceCreated}
          onPieceSelect={onPieceSelect}
          deleteSelectedPieceIfNew={deleteSelectedPieceIfNew}
          deleteSelectedPieceVersionIfNew={deleteSelectedPieceVersionIfNew}
          onPieceVersionCreated={onPieceVersionCreated}
          onPieceVersionSelect={onPieceVersionSelect}
          onAddSourceOnPieceVersions={onAddSourceOnPieceVersions}
          isCollectionCreationMode={isCollectionCreationMode}
          newPieceDefaultTitle={newPieceDefaultTitle}
        />
      ) : (
        <div>Nothing to show...</div>
      )}
      <DebugBox
        title="Single Piece form state"
        stateObject={state}
        shouldExpandNode={(level) => level < 3}
      />
    </div>
  );
};

export default SinglePieceVersionForm;
