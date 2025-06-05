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
import SinglePieceVersionFormSummary from "@/components/multiStepSinglePieceVersionForm/SinglePieceVersionFormSummary";
import { CollectionPieceVersionsFormState } from "@/types/collectionPieceVersionFormTypes";

type SinglePieceVersionFormProps = {
  onFormClose: () => void;
  onSubmit?: (payload: any) => void;
  initPayload?: any;
  isCollectionCreationMode?: boolean;
  composerId?: string;
  newPieceDefaultTitle?: string;
  collectionId?: string;
  collectionFormState?: CollectionPieceVersionsFormState;
  isEditMode?: boolean;
};

/**
 * This component will go throw the process of creating a single PieceVersion.
 * It is used in one of these two contexts:
 * - in the feedForm, when the user clicks on the "Add a single Piece" button.
 * - in the collectionPieceVersionsForm, when the user clicks on the "Add a single Piece" button.
 * Composer, piece and pieceVersion can be selected among existing values from the database, or created if it does not exist yet.
 */
const SinglePieceVersionFormContainer = ({
  onFormClose,
  onSubmit,
  isCollectionCreationMode,
  composerId,
  newPieceDefaultTitle,
  collectionId,
  collectionFormState,
  isEditMode,
}: SinglePieceVersionFormProps) => {
  const { dispatch: feedFormDispatch, state: feedFormState } = useFeedForm();
  const {
    dispatch,
    state: singlePieceVersionFormState,
    currentStepRank,
  } = useSinglePieceVersionForm();
  const currentStep = getStepByRank({
    state: singlePieceVersionFormState,
    rank: currentStepRank,
  });
  const StepFormComponent = currentStep.Component;

  // For Collection Form, we start by completing the "composer" step automatically and go to the second step = piece
  useEffect(() => {
    if (isCollectionCreationMode && composerId && currentStepRank === 0) {
      console.log(
        `[SinglePieceVersionForm in Collection] auto-complete the "composer" step and go to the next step = piece`,
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

  const selectedComposerId = singlePieceVersionFormState?.composer?.id;

  const onInitComposerCreation = () => {
    updateSinglePieceVersionForm(dispatch, "composer", {
      value: { id: null },
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
    updateSinglePieceVersionForm(dispatch, "composer", {
      value: { id: newComposer.id, isNew: true },
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

  const onCancelComposerCreation = () => {
    if (singlePieceVersionFormState.composer?.isNew) {
      // Case: coming back after having first submitted the new composer and cancel it. All in the same singlePieceVersionForm.
      // => The composer's data is in the feedFormState; we delete it there too.
      updateSinglePieceVersionForm(dispatch, "composer", {
        value: {
          id: null,
        },
      });
      updateFeedForm(feedFormDispatch, "persons", {
        deleteIdArray: [selectedComposerId],
      });
    }
  };

  //////////////////// PIECE ////////////////////

  const selectedPieceId = singlePieceVersionFormState?.piece?.id;

  const onInitPieceCreation = () => {
    updateSinglePieceVersionForm(dispatch, "piece", {
      value: { id: null },
    });
  };

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
      console.warn(
        "OUPS: No composerId in pieceData or form state to link to the piece",
      );
      // TODO: trigger a toast
      return;
    }

    const pieceState = getPieceStateFromInput({
      ...(selectedPieceId
        ? feedFormState.pieces?.find((piece) => piece.id === selectedPieceId)
        : {}),
      ...pieceData,
      composerId,
    });
    pieceState.isNew = true;

    let piecesArray = [pieceState];

    if (isCollectionCreationMode && collectionId && collectionFormState) {
      piecesArray = piecesArray.map((piece) => ({
        ...piece,
        collectionId,
        collectionRank:
          ((collectionFormState.mMSourcePieceVersions || []).length || 0) + 1,
      }));
    }
    console.log(`[with potential collection value] piecesArray :`, piecesArray);

    updateFeedForm(feedFormDispatch, "pieces", {
      array: piecesArray,
    });
    updateSinglePieceVersionForm(dispatch, "piece", {
      value: { id: pieceState.id, isNew: true },
      next: true,
    });
  };

  const onCancelPieceCreation = () => {
    if (singlePieceVersionFormState.piece?.isNew) {
      // Case: coming back after having first submitted the new piece and cancel it. All in the same singlePieceVersionForm.
      // => The piece's data is in the feedFormState; we delete it there too.
      updateSinglePieceVersionForm(dispatch, "piece", {
        value: {
          id: null,
        },
      });
      updateFeedForm(feedFormDispatch, "pieces", {
        deleteIdArray: [selectedPieceId],
      });
    }
  };

  const onPieceSelect = (piece: PieceInput) => {
    updateFeedForm(feedFormDispatch, "pieces", { array: [piece] });
    updateSinglePieceVersionForm(dispatch, "piece", {
      value: {
        id: piece.id,
      },
      next: true,
    });
  };

  /////////////////// PIECE VERSION ////////////////////

  const selectedPieceVersionId = singlePieceVersionFormState?.pieceVersion?.id;
  const newPieceVersions = getNewEntities(feedFormState, "pieceVersions");
  console.log(`[] newPieceVersions :`, newPieceVersions);
  // TODO: should we include new pieceVersions used only in the collection form state ?
  const isSelectedPieceVersionNew = newPieceVersions?.some(
    (pieceVersion) => pieceVersion.id === selectedPieceVersionId,
  );

  const onInitPieceVersionCreation = () => {
    updateSinglePieceVersionForm(dispatch, "pieceVersion", {
      value: { id: null },
    });
  };

  const onPieceVersionCreated = (data: PieceVersionInput) => {
    // Front input values validation is successful at this point.
    console.log("[onPieceVersionCreated] data", data);

    if (!selectedPieceId) {
      console.warn(
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
      value: { id: pieceVersionState.id, isNew: true },
      // value: pieceVersionState,
      next: true,
    });
  };

  const onCancelPieceVersionCreation = () => {
    if (singlePieceVersionFormState.pieceVersion?.isNew) {
      // Case: coming back after having first submitted the new pieceVersion and cancel it. All in the same singlePieceVersionForm.
      // => The pieceVersion's data is in the feedFormState; we delete it there too.
      updateSinglePieceVersionForm(dispatch, "pieceVersion", {
        value: {
          id: null,
        },
      });
      updateFeedForm(feedFormDispatch, "pieceVersions", {
        deleteIdArray: [selectedPieceVersionId],
      });
    }
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

  const onSubmitSourceOnPieceVersions = () => {
    if (!singlePieceVersionFormState.pieceVersion?.id) {
      console.log(
        `[onAddPieceVersionOnSource] ERROR: state.pieceVersion?.id SHOULD BE DEFINED`,
      );
      return;
    }

    // In case of update, we need to keep the existing rank of the mMSourceOnPieceVersion
    const mMSourcePieceVersionRank =
      singlePieceVersionFormState.formInfo.mMSourcePieceVersionRank;

    const payload = {
      idKey: "rank", // items with the same idKey value will be replaced by the payload corresponding items.
      array: [
        {
          pieceVersionId: singlePieceVersionFormState.pieceVersion?.id,
          rank:
            isEditMode && typeof mMSourcePieceVersionRank === "number"
              ? mMSourcePieceVersionRank
              : isCollectionCreationMode && collectionFormState
                ? (collectionFormState.mMSourcePieceVersions || []).length + 1 // Rank if added in a collection
                : (feedFormState.mMSourcePieceVersions || []).length + 1, // Rank if added as singlePiece in feedForm
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
      <div className="flex w-full gap-3 max-w-3xl">
        <div className="flex-1">
          <h2 className="mb-3 text-3xl font-bold">{`${isEditMode ? `Edit` : `Add`} a single Piece`}</h2>
          <SinglePieceVersionSteps
            isCollectionMode={isCollectionCreationMode}
          />
        </div>
        <div className="width-1/3 pt-2">
          <SinglePieceVersionFormSummary
            isCollectionMode={isCollectionCreationMode}
          />
        </div>
      </div>

      {StepFormComponent ? (
        <StepFormComponent
          onFormClose={onFormClose}
          isEditMode={isEditMode}
          feedFormState={feedFormState}
          singlePieceVersionFormState={singlePieceVersionFormState}
          // Composer
          selectedComposerId={singlePieceVersionFormState?.composer?.id}
          hasComposerJustBeenCreated={
            !!singlePieceVersionFormState?.composer?.isNew
          }
          onComposerSelect={onComposerSelect}
          onInitComposerCreation={onInitComposerCreation}
          onCancelComposerCreation={onCancelComposerCreation}
          onComposerCreated={onComposerCreated}
          // Piece
          selectedPieceId={singlePieceVersionFormState?.piece?.id}
          onPieceSelect={onPieceSelect}
          onInitPieceCreation={onInitPieceCreation}
          onCancelPieceCreation={onCancelPieceCreation}
          onPieceCreated={onPieceCreated}
          newPieceDefaultTitle={newPieceDefaultTitle}
          // PieceVersion
          selectedPieceVersionId={singlePieceVersionFormState?.pieceVersion?.id}
          onInitPieceVersionCreation={onInitPieceVersionCreation}
          onCancelPieceVersionCreation={onCancelPieceVersionCreation}
          onPieceVersionCreated={onPieceVersionCreated}
          onPieceVersionSelect={onPieceVersionSelect}
          // Summary
          onSubmitSourceOnPieceVersions={onSubmitSourceOnPieceVersions}
          isCollectionCreationMode={isCollectionCreationMode}
        />
      ) : (
        <div>Nothing to show...</div>
      )}

      <DebugBox
        title="Single Piece form state"
        stateObject={singlePieceVersionFormState}
        shouldExpandNode={(level) => level < 3}
      />
    </div>
  );
};

export default SinglePieceVersionFormContainer;
