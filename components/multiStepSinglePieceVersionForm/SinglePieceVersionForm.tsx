import SinglePieceVersionSteps from "@/components/multiStepSinglePieceVersionForm/SinglePieceVersionSteps";
import { getStepByRank } from "@/components/multiStepSinglePieceVersionForm/stepsUtils";
import React from "react";
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
import { v4 as uuidv4 } from "uuid";
import {
  getNewEntities,
  updateFeedForm,
  useFeedForm,
} from "@/components/context/feedFormContext";
import getPieceStateFromInput from "@/utils/getPieceStateFromInput";
import { updateSourceOnPieceVersionsForm } from "@/components/context/SourceOnPieceVersionFormContext";
import getPieceVersionStateFromInput from "@/utils/getPieceVersionStateFromInput";

type SourceOnPieceVersionFormProps = {
  onFormClose: () => void;
};

/**
 * This component will go throw the whole process of creating a sourceOnPieceVersion entity or a series of sourceOnPieceVersion entities.
 * If the composer, piece and pieceVersion pre-exist, they will just be selected. If not, the user will be able to create them.
 * @constructor
 */
const SinglePieceVersionForm = ({
  onFormClose,
}: SourceOnPieceVersionFormProps) => {
  const { dispatch: feedFormDispatch, state: feedFormState } = useFeedForm();
  const { dispatch, state, currentStepRank } = useSinglePieceVersionForm();
  const currentStep = getStepByRank({ state, rank: currentStepRank });
  const StepFormComponent = currentStep.Component;

  ////////////////// COMPOSER ////////////////////

  const onComposerCreated = (composer: PersonInput) => {
    const newComposer: PersonState = {
      ...composer,
      id: composer.id || uuidv4(),
      isNew: true,
    };
    updateFeedForm(feedFormDispatch, "persons", { array: [newComposer] });
    updateSinglePieceVersionForm(dispatch, "composer", {
      value: {
        id: newComposer.id,
      },
      next: true,
    });
  };

  const onComposerSelect = (composer: PersonInput) => {
    updateFeedForm(feedFormDispatch, "persons", { array: [composer] });
    updateSinglePieceVersionForm(dispatch, "composer", {
      value: {
        id: composer.id,
      },
      next: true,
    });
  };

  //////////////////// PIECE ////////////////////

  const selectedComposerId = state?.composer?.id;
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

    updateFeedForm(feedFormDispatch, "pieces", {
      array: [pieceState],
      ...(deleteIdArray.length ? { deleteIdArray } : {}),
    });
    updateSourceOnPieceVersionsForm(dispatch, "piece", {
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
    updateSourceOnPieceVersionsForm(dispatch, "piece", {
      value: {
        id: piece.id,
      },
      next: true,
    });
  };

  /////////////////// PIECE VERSION ////////////////////

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
      ...pieceVersionData,
      pieceId: selectedPieceId,
    });
    pieceVersionState.isNew = true;
    console.log("New pieceVersion to be stored in state", pieceVersionState);
    updateFeedForm(feedFormDispatch, "pieceVersions", {
      array: [pieceVersionState],
    });
    updateSourceOnPieceVersionsForm(dispatch, "pieceVersion", {
      value: pieceVersionState,
      next: true,
    });
  };

  const onPieceVersionSelect = (pieceVersion: PieceVersionInput) => {
    console.log(
      `[onPieceVersionSelect] onPieceVersionSelect :`,
      onPieceVersionSelect,
    );
    updateFeedForm(feedFormDispatch, "pieceVersions", {
      array: [pieceVersion],
    });
    updateSourceOnPieceVersionsForm(dispatch, "pieceVersion", {
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
    updateFeedForm(feedFormDispatch, "mMSourcePieceVersions", {
      array: [
        {
          pieceVersionId: state.pieceVersion?.id,
          rank: (feedFormState.mMSourcePieceVersions || []).length + 1,
        },
      ],
    });

    onFormClose();
  };

  return (
    <div>
      <SinglePieceVersionSteps />
      {StepFormComponent ? (
        <StepFormComponent
          onFormClose={onFormClose}
          state={state}
          onComposerSelect={onComposerSelect}
          onComposerCreated={onComposerCreated}
          onPieceCreated={onPieceCreated}
          onPieceSelect={onPieceSelect}
          deleteSelectedPieceIfNew={deleteSelectedPieceIfNew}
          onPieceVersionCreated={onPieceVersionCreated}
          onPieceVersionSelect={onPieceVersionSelect}
          onAddSourceOnPieceVersions={onAddSourceOnPieceVersions}
        />
      ) : (
        <div>Nothing to show...</div>
      )}
      <DebugBox stateObject={state} />
    </div>
  );
};

export default SinglePieceVersionForm;
