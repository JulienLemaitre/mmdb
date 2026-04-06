import React, { useEffect } from "react";
import SinglePieceVersionSteps from "@/features/feed/multiStepSinglePieceVersionForm/SinglePieceVersionSteps";
import { getSinglePieceFormStepByRank } from "@/features/feed/multiStepSinglePieceVersionForm/stepsUtils";
import DebugBox from "@/ui/DebugBox";
import {
  updateSinglePieceVersionForm,
  useSinglePieceVersionForm,
} from "@/context/singlePieceVersionFormContext";
import {
  PersonInput,
  PersonState,
  PieceInput,
  PieceState,
  PieceVersionInput,
  PieceVersionState,
} from "@/types/formTypes";
import { updateFeedForm, useFeedForm } from "@/context/feedFormContext";
import getPieceStateFromInput from "@/utils/getPieceStateFromInput";
import getPieceVersionStateFromInput from "@/utils/getPieceVersionStateFromInput";
import getPersonStateFromPersonInput from "@/utils/getPersonStateFromPersonInput";
import SinglePieceVersionFormSummary from "@/features/feed/multiStepSinglePieceVersionForm/SinglePieceVersionFormSummary";
import { CollectionPieceVersionsFormState } from "@/types/collectionPieceVersionFormTypes";
import { SINGLE_PIECE_VERSION_FORM_LOCAL_STORAGE_KEY } from "@/utils/constants";
import { debug, prodLog } from "@/utils/debugLogger";
import { localStorageRemoveItem } from "@/utils/localStorage";

type SinglePieceVersionFormProps = {
  onFormClose: () => void;
  onSubmit?: (payload: any, options?: { isUpdateMode?: boolean }) => void;
  isCollectionMode?: boolean;
  isCollectionUpdateMode?: boolean;
  composerId?: string;
  newPieceDefaultTitle?: string;
  collectionId?: string;
  collectionFormState?: CollectionPieceVersionsFormState;
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
  isCollectionMode,
  isCollectionUpdateMode,
  composerId,
  newPieceDefaultTitle,
  collectionId,
  collectionFormState,
}: SinglePieceVersionFormProps) => {
  const { dispatch: feedFormDispatch, state: feedFormState } = useFeedForm();
  const {
    dispatch,
    state: singlePieceVersionFormState,
    currentStepRank,
  } = useSinglePieceVersionForm();

  // Deduce isUpdateMode from context state
  const mMSourceOnPieceVersionRank =
    singlePieceVersionFormState.formInfo.mMSourceOnPieceVersionRank;
  const isUpdateMode = typeof mMSourceOnPieceVersionRank === "number";

  const currentStep = getSinglePieceFormStepByRank(currentStepRank);
  const StepFormComponent = currentStep.Component;

  const hasCollectionJustBeenCreated = !!(
    collectionId && collectionFormState?.collection?.isNew
  );
  const isPreexistingCollectionEdit =
    isCollectionMode && !hasCollectionJustBeenCreated;

  // For Collection Form, we to populate state and skip form steps
  useEffect(() => {
    // For collection creation AND update of a newly created collection, we dispatch composerId value and go to the next step: "piece"
    if (
      isCollectionMode &&
      !isPreexistingCollectionEdit &&
      composerId &&
      currentStepRank === 0
    ) {
      debug.info(
        `[SinglePieceVersionFormContainer in Collection] auto-complete the "composer" step and go to the next step = piece`,
      );
      updateSinglePieceVersionForm(dispatch, "composer", {
        value: {
          id: composerId,
        },
        next: true,
      });
    }

    // For edit and update of a pre-existing collection, we just go to step 2 = "pieceVersion"
    if (isPreexistingCollectionEdit && currentStepRank < 2) {
      debug.info(
        `[goToStep 2] isPreexistingCollectionEdit && currentStepRank < 2`,
      );
      updateSinglePieceVersionForm(dispatch, "goToStep", {
        stepRank: 2,
      });
    }
  }, [
    composerId,
    currentStepRank,
    dispatch,
    isCollectionMode,
    isCollectionUpdateMode,
    hasCollectionJustBeenCreated,
    isPreexistingCollectionEdit,
  ]);

  ////////////////// COMPOSER ////////////////////

  const selectedComposerId = singlePieceVersionFormState?.composer?.id;

  const onInitComposerCreation = () => {
    updateSinglePieceVersionForm(dispatch, "composer", {
      value: undefined,
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
    updateSinglePieceVersionForm(dispatch, "composer", {
      value: newComposer,
      next: true,
    });
  };

  const onComposerSelect = (composer: PersonState) => {
    updateSinglePieceVersionForm(dispatch, "composer", {
      value: composer,
      next: true,
    });
  };

  const onCancelComposerCreation = () => {
    if (singlePieceVersionFormState.composer?.isNew) {
      // Case: coming back after having first submitted the new composer and now canceling it. All in the same singlePieceVersionForm.
      updateSinglePieceVersionForm(dispatch, "composer", {
        value: undefined,
      });
    }
  };

  //////////////////// PIECE ////////////////////

  const selectedPieceId = singlePieceVersionFormState?.piece?.id;

  const onInitPieceCreation = () => {
    updateSinglePieceVersionForm(dispatch, "piece", {
      value: undefined,
    });
  };

  const onPieceCreated = async (data: PieceInput) => {
    // Front input values validation is successful at this point.
    debug.info("[onPieceCreated] data", data);

    const pieceData = data;

    const composerId = pieceData.composerId || selectedComposerId;
    if (!composerId) {
      prodLog.error(
        "[onPieceCreated] OUPS: No composerId in pieceData or form state to link to the piece",
      );
      return;
    }

    const previousValue = selectedPieceId
      ? feedFormState.pieces?.find((piece) => piece.id === selectedPieceId)
      : {};
    const finalValue = { ...previousValue, ...pieceData, composerId };

    // Remove null values from finalValue
    Object.keys(finalValue).forEach(
      // '== null' is true for undefined AND null values
      (key) => finalValue[key] == null && delete finalValue[key],
    );

    let pieceState = getPieceStateFromInput(finalValue);
    pieceState.isNew = true;

    if (isCollectionMode && collectionId && collectionFormState) {
      pieceState = {
        ...pieceState,
        collectionId,
        collectionRank:
          ((collectionFormState.mMSourceOnPieceVersions || []).length || 0) + 1,
      };
    }
    debug.info(
      `[onPieceCreated] pieceState (with potential collection value):`,
      pieceState,
    );

    updateSinglePieceVersionForm(dispatch, "piece", {
      value: pieceState,
      next: true,
    });
  };

  const onPieceSelect = (piece: PieceState) => {
    updateSinglePieceVersionForm(dispatch, "piece", {
      value: piece,
      next: true,
    });
  };

  const onCancelPieceCreation = () => {
    if (singlePieceVersionFormState.piece?.isNew) {
      // Case: coming back after having first submitted the new piece and now canceling it. All in the same singlePieceVersionForm.
      updateSinglePieceVersionForm(dispatch, "piece", {
        value: undefined,
      });
    }
  };

  /////////////////// PIECE VERSION ////////////////////

  const selectedPieceVersionId = singlePieceVersionFormState?.pieceVersion?.id;

  const onInitPieceVersionCreation = () => {
    updateSinglePieceVersionForm(dispatch, "pieceVersion", {
      value: undefined,
    });
  };

  const onPieceVersionCreated = (data: PieceVersionInput) => {
    // Front input values validation is successful at this point.
    debug.info("[onPieceVersionCreated] data", data);

    if (!selectedPieceId) {
      prodLog.warn(
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
      pieceVersionId: selectedPieceVersionId,
      pieceId: selectedPieceId,
    });
    pieceVersionState.isNew = true;
    debug.info("New pieceVersion to be stored in state", pieceVersionState);
    updateSinglePieceVersionForm(dispatch, "pieceVersion", {
      value: pieceVersionState,
      next: true,
    });
  };

  const onPieceVersionSelect = (pieceVersion: PieceVersionState) => {
    updateSinglePieceVersionForm(dispatch, "pieceVersion", {
      value: pieceVersion,
      next: true,
    });
  };

  const onCancelPieceVersionCreation = () => {
    if (singlePieceVersionFormState.pieceVersion?.isNew) {
      // Case: coming back after having first submitted the new pieceVersion and now canceling it. All in the same singlePieceVersionForm.
      updateSinglePieceVersionForm(dispatch, "pieceVersion", {
        value: undefined,
      });
    }

    updateSinglePieceVersionForm(dispatch, "goToPrevStep", {});
  };

  /////////////////// SUMMARY ////////////////////

  const onSubmitSourceOnPieceVersions = () => {
    if (!singlePieceVersionFormState.pieceVersion?.id) {
      debug.info(
        `[onAddPieceVersionOnSource] ERROR: state.pieceVersion?.id SHOULD BE DEFINED`,
      );
      return;
    }

    // In case of update, we need to keep the existing rank of the mMSourceOnPieceVersion
    const mMSourceOnPieceVersionRank =
      singlePieceVersionFormState.formInfo.mMSourceOnPieceVersionRank;

    const payload = {
      idKey: "rank", // items with the same idKey value will be replaced by the payload corresponding items.
      array: [
        {
          pieceVersionId: singlePieceVersionFormState.pieceVersion?.id,
          rank: isUpdateMode
            ? mMSourceOnPieceVersionRank
            : isCollectionMode && collectionFormState
              ? (collectionFormState.mMSourceOnPieceVersions || []).length + 1 // Rank if added in a collection
              : (feedFormState.mMSourceOnPieceVersions || []).length + 1, // Rank if added as singlePiece in feedForm
        },
      ],
    };
    // This is useful for submitting a pieceVersion to a collection form instead of the general feedForm
    if (typeof onSubmit === "function") {
      debug.info(`[SUBMIT] with provided onSubmit function`);
      onSubmit(payload, { isUpdateMode });
    } else {
      updateFeedForm(feedFormDispatch, "mMSourceOnPieceVersions", payload);
    }

    // Reset localStorage
    debug.info(
      `[localStorage REMOVE] ${SINGLE_PIECE_VERSION_FORM_LOCAL_STORAGE_KEY}`,
    );
    localStorageRemoveItem(SINGLE_PIECE_VERSION_FORM_LOCAL_STORAGE_KEY);

    onFormClose();
  };

  return (
    <div className="w-full max-w-3xl">
      <div className="flex gap-3">
        <div className="flex-1">
          <h2 className="mb-3 text-3xl font-bold">{`${isUpdateMode ? `Update` : `Add`} a ${isCollectionMode ? `piece ${isUpdateMode ? `of` : `to`} the collection` : `single piece`}`}</h2>
          <SinglePieceVersionSteps
            isCollectionMode={isCollectionMode}
            isPreexistingCollectionEdit={isPreexistingCollectionEdit}
          />
        </div>
        <div className="width-1/3 pt-2">
          <SinglePieceVersionFormSummary isCollectionMode={isCollectionMode} />
        </div>
      </div>

      {StepFormComponent ? (
        <StepFormComponent
          onFormClose={onFormClose}
          isCollectionMode={isCollectionMode}
          isUpdateMode={isUpdateMode}
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
          hasPieceJustBeenCreated={!!singlePieceVersionFormState?.piece?.isNew}
          onPieceSelect={onPieceSelect}
          onInitPieceCreation={onInitPieceCreation}
          onCancelPieceCreation={onCancelPieceCreation}
          onPieceCreated={onPieceCreated}
          newPieceDefaultTitle={newPieceDefaultTitle}
          // PieceVersion
          selectedPieceVersionId={singlePieceVersionFormState?.pieceVersion?.id}
          hasPieceVersionJustBeenCreated={
            !!singlePieceVersionFormState?.pieceVersion?.isNew
          }
          onInitPieceVersionCreation={onInitPieceVersionCreation}
          onCancelPieceVersionCreation={onCancelPieceVersionCreation}
          onPieceVersionCreated={onPieceVersionCreated}
          onPieceVersionSelect={onPieceVersionSelect}
          // Summary
          onSubmitSourceOnPieceVersions={onSubmitSourceOnPieceVersions}
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
