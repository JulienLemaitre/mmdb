import React, { useState } from "react";
import {
  updateCollectionPieceVersionsForm,
  useCollectionPieceVersionsForm,
} from "@/components/context/CollectionPieceVersionsFormContext";
import {
  getEntityByIdOrKey,
  useFeedForm,
} from "@/components/context/feedFormContext";
import { SinglePieceVersionFormProvider } from "@/components/context/SinglePieceVersionFormContext";
import SinglePieceVersionFormContainer from "@/components/multiStepSinglePieceVersionForm/SinglePieceVersionFormContainer";
import TrashIcon from "@/components/svg/TrashIcon";
import PlusIcon from "@/components/svg/PlusIcon";
import {
  MMSourcePieceVersionsState,
  PieceState,
  PieceStateWithCollectionRank,
} from "@/types/formTypes";
import EditIcon from "@/components/svg/EditIcon";
import dynamic from "next/dynamic";
import { SinglePieceVersionFormState } from "@/types/singlePieceVersionFormTypes";
import CheckIcon from "@/components/svg/CheckIcon";

type CollectionPieceVersionsEditFormProps = {
  isUpdateMode: boolean;
  isPreexistingCollectionUpdate: boolean;
  onSubmitSourceOnPieceVersions: (
    piecePieceVersions: MMSourcePieceVersionsState[],
  ) => void;
};

const needConfirmationModalId = "need-confirmation-modal";
const NeedConfirmationModal = dynamic(
  () => import("@/components/NeedConfirmationModal"),
  { ssr: false },
);

function CollectionPieceVersionsEditForm({
  onSubmitSourceOnPieceVersions,
  isUpdateMode,
  isPreexistingCollectionUpdate,
}: CollectionPieceVersionsEditFormProps) {
  const { state: feedFormState } = useFeedForm();
  const { state, dispatch } = useCollectionPieceVersionsForm();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [updateInitState, setUpdateInitState] =
    useState<SinglePieceVersionFormState | null>(null);
  const isSinglePieceUpdateMode = !!updateInitState;
  const collectionPieceVersions = state.mMSourcePieceVersions || [];
  const newPieceDefaultTitle = `${state?.collection?.title} No.${(state.mMSourcePieceVersions || []).length + 1}`;
  const composerId = state?.collection?.composerId;
  const { pieceIdsNeedingVersions } = state.formInfo;
  console.log(`[] pieceIdsNeedingVersions :`, pieceIdsNeedingVersions);
  const piecesNeedingVersion = pieceIdsNeedingVersions?.reduce<PieceState[]>(
    (list, pieceId) => {
      const piece = feedFormState.pieces?.find(
        (p) => p.id === pieceId && p.collectionRank,
      );
      if (!piece) {
        console.warn(
          `[CollectionPieceVersionsEditForm] piece not found for pieceIdNeedingVersion: ${pieceId}`,
        );
      }
      return piece ? [...list, piece] : list;
    },
    [],
  ) as PieceStateWithCollectionRank[] | undefined;
  console.log(`[] piecesNeedingVersion :`, piecesNeedingVersion);
  const isExistingCollectionAddingProcess = !!piecesNeedingVersion;
  const areAllNeededPieceVersionSet =
    isExistingCollectionAddingProcess &&
    piecesNeedingVersion?.every((piece) =>
      collectionPieceVersions.some((cpv) =>
        feedFormState.pieceVersions?.some(
          (pv) => pv.id === cpv.pieceVersionId && pv.pieceId === piece.id,
        ),
      ),
    );
  console.log(`[] areAllNeededPieceVersionSet :`, areAllNeededPieceVersionSet);

  // For needConfirmation modal
  const [pieceVersionToDiscardId, setPieceVersionToDiscardId] = useState<
    string | null
  >();
  const isConfirmationModalOpened = !!pieceVersionToDiscardId;

  const onFormClose = () => {
    setUpdateInitState(null);
    setIsFormOpen(false);
  };

  const onEditCollectionPieceVersion = (
    collectionPieceVersion:
      | MMSourcePieceVersionsState
      | PieceStateWithCollectionRank,
  ) => {
    let pieceVersion, piece, rank;

    if ("pieceVersionId" in collectionPieceVersion) {
      const { pieceVersionId, rank: cpvRank } = collectionPieceVersion;
      pieceVersion = getEntityByIdOrKey(
        feedFormState,
        "pieceVersions",
        pieceVersionId,
      );
      piece = getEntityByIdOrKey(feedFormState, "pieces", pieceVersion.pieceId);
      rank = cpvRank;
    }

    if ("collectionRank" in collectionPieceVersion) {
      const { collectionRank } = collectionPieceVersion;
      piece = collectionPieceVersion;
      rank = collectionRank;
      pieceVersion = undefined;
    }

    // Build singlePieceVersionFormState
    const composer = getEntityByIdOrKey(
      feedFormState,
      "persons",
      piece.composerId,
    );

    const singlePieceVersionFormEditState: SinglePieceVersionFormState = {
      formInfo: {
        currentStepRank: 0,
        mMSourcePieceVersionRank: rank,
      },
      composer: {
        id: composer.id,
      },
      piece: {
        id: piece.id,
      },
      ...(pieceVersion
        ? {
            pieceVersion: {
              id: pieceVersion.id,
            },
          }
        : {}),
    };
    setUpdateInitState(singlePieceVersionFormEditState);
    setIsFormOpen(true);
  };

  const onDeletePieceVersionInit = (pieceVersionId: string) => {
    setPieceVersionToDiscardId(pieceVersionId);
  };

  const onDeletePieceVersion = (pieceVersionId) => {
    updateCollectionPieceVersionsForm(dispatch, "mMSourcePieceVersions", {
      deleteIdArray: [pieceVersionId],
      idKey: "pieceVersionId",
    });
    setPieceVersionToDiscardId(null);
  };

  const onMovePiece = (pieceVersionId: string, direction: "up" | "down") => {
    // Get the mMSourcePieceVersion for this piece version
    const mMSourcePieceVersion = (state.mMSourcePieceVersions || []).find(
      (spv) => spv.pieceVersionId === pieceVersionId,
    );

    if (!mMSourcePieceVersion) {
      console.log(`[onMovePiece] Piece version not found: ${pieceVersionId}`);
      return;
    }

    // Check boundaries based on direction
    if (direction === "up") {
      if (mMSourcePieceVersion.rank <= 1) {
        console.log(`[onMovePiece] Piece is already at the top`);
        return;
      }
    } else {
      if (
        mMSourcePieceVersion.rank >= (state.mMSourcePieceVersions || []).length
      ) {
        console.log(`[onMovePiece] Piece is already at the bottom`);
        return;
      }
    }

    // Move the piece
    updateCollectionPieceVersionsForm(dispatch, "mMSourcePieceVersions", {
      movePiece: {
        pieceVersionId,
        direction,
      },
    });
  };

  const onSubmit = () => {
    // Transfer from collection form to feed form
    onSubmitSourceOnPieceVersions(collectionPieceVersions);
    setIsFormOpen(false);
  };
  const onSinglePieceSubmit = (payload: any) => {
    console.log(`[onSinglePieceSubmit] payload :`, payload);

    // idKey = "rank is used to replace value in place when updating
    // For normal piece addition, we delete the idKey provided to avoid replacing the first piece forever
    if (!isSinglePieceUpdateMode) {
      delete payload.idKey;
    }

    updateCollectionPieceVersionsForm(
      dispatch,
      "mMSourcePieceVersions",
      payload,
    );
  };

  return (
    <>
      {isFormOpen ? (
        <>
          <SinglePieceVersionFormProvider initialState={updateInitState}>
            <SinglePieceVersionFormContainer
              onFormClose={onFormClose}
              onSubmit={onSinglePieceSubmit}
              isCollectionMode={true}
              isCollectionUpdateMode={isUpdateMode}
              collectionId={state.collection?.id}
              collectionFormState={state}
              newPieceDefaultTitle={newPieceDefaultTitle}
              composerId={composerId}
              isUpdateMode={isSinglePieceUpdateMode}
            />
          </SinglePieceVersionFormProvider>
          <div className="grid grid-cols-2 gap-4 items-center mt-6 w-full max-w-2xl">
            <button
              className="btn btn-accent"
              type="button"
              onClick={() => onFormClose()}
            >
              <TrashIcon className="w-5 h-5" />
              {`Discard${isSinglePieceUpdateMode ? ` updating ` : ""} this piece`}
            </button>
          </div>
        </>
      ) : (
        <>
          {isExistingCollectionAddingProcess && (
            <>
              <ul className="my-4 max-w-[65ch] space-y-4">
                {piecesNeedingVersion
                  .sort((a, b) =>
                    a.collectionRank > b.collectionRank ? 1 : -1,
                  )
                  .map((piece, index) => {
                    const isPieceVersionSet = collectionPieceVersions.some(
                      (cpv) =>
                        feedFormState.pieceVersions?.some(
                          (pv) =>
                            pv.id === cpv.pieceVersionId &&
                            pv.pieceId === piece.id,
                        ),
                    );
                    return (
                      <li key={`${index}-${piece.id}-${piece.collectionRank}`}>
                        <div className="px-4 py-3 border border-base-300 rounded-lg hover:border-base-400 hover:shadow-xs hover:bg-primary/5 transition-all duration-150">
                          <div className="flex gap-4 items-center justify-between">
                            <div className="grow flex gap-2 items-center justify-between">
                              <h4 className="text-base font-bold text-secondary">
                                {`${index + 1} - ${piece.title}`}
                              </h4>
                              {isPieceVersionSet ? (
                                <span className="text-success">
                                  <CheckIcon className="w-7 h-7" />
                                </span>
                              ) : null}
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <button
                                type="button"
                                className="btn btn-sm btn-neutral hover:btn-accent"
                                onClick={() =>
                                  onEditCollectionPieceVersion(piece)
                                }
                              >
                                <EditIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
              </ul>
              {areAllNeededPieceVersionSet && (
                <div className="flex gap-4 items-center mt-6">
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={onSubmit}
                  >
                    {`Submit (all pieces set)`}
                  </button>
                </div>
              )}
            </>
          )}
          {!isExistingCollectionAddingProcess && (
            <>
              <ul className="my-4 max-w-[65ch] space-y-4">
                {collectionPieceVersions.map(
                  (collectionPieceVersion, index) => {
                    const pieceVersion = getEntityByIdOrKey(
                      feedFormState,
                      "pieceVersions",
                      collectionPieceVersion.pieceVersionId,
                    );
                    const piece = getEntityByIdOrKey(
                      feedFormState,
                      "pieces",
                      pieceVersion.pieceId,
                    );

                    return (
                      <li
                        key={`${index}-${collectionPieceVersion.pieceVersionId}-${collectionPieceVersion.rank}`}
                      >
                        <div className="px-4 py-3 border border-base-300 rounded-lg hover:border-base-400 hover:shadow-xs hover:bg-primary/5 transition-all duration-150">
                          <div className="flex gap-4 items-center justify-between">
                            <div className="grow">
                              <h4 className="text-base font-bold text-secondary">
                                {`${index + 1} - ${piece.title}`}
                              </h4>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <button
                                type="button"
                                className="btn btn-sm btn-neutral hover:btn-accent"
                                onClick={() =>
                                  onEditCollectionPieceVersion(
                                    collectionPieceVersion,
                                  )
                                }
                              >
                                <EditIcon className="w-4 h-4" />
                              </button>
                              {!isPreexistingCollectionUpdate && (
                                <>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-neutral hover:btn-error"
                                    onClick={() =>
                                      onDeletePieceVersionInit(
                                        collectionPieceVersion.pieceVersionId,
                                      )
                                    }
                                  >
                                    <TrashIcon className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-neutral"
                                    onClick={() =>
                                      onMovePiece(
                                        collectionPieceVersion.pieceVersionId,
                                        "up",
                                      )
                                    }
                                    disabled={index === 0}
                                  >
                                    ↑
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-neutral"
                                    onClick={() =>
                                      onMovePiece(
                                        collectionPieceVersion.pieceVersionId,
                                        "down",
                                      )
                                    }
                                    disabled={
                                      index ===
                                      collectionPieceVersions.length - 1
                                    }
                                  >
                                    ↓
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  },
                )}
              </ul>

              {!isPreexistingCollectionUpdate && (
                <div className="flex gap-4 items-center mt-6">
                  <button
                    className="btn btn-accent"
                    type="button"
                    onClick={() => setIsFormOpen(true)}
                  >
                    <PlusIcon className="w-5 h-5" />
                    Add a single piece
                  </button>
                </div>
              )}

              {collectionPieceVersions.length > 1 && (
                <div className="flex gap-4 items-center mt-6">
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={onSubmit}
                  >
                    {`Submit (all pieces ${isUpdateMode ? "updated" : "added"})`}
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
      <NeedConfirmationModal
        modalId={needConfirmationModalId}
        onConfirm={() => onDeletePieceVersion(pieceVersionToDiscardId)}
        onCancel={() => setPieceVersionToDiscardId(null)}
        description={`Delete a piece version from the collection`}
        isOpened={isConfirmationModalOpened}
      />
    </>
  );
}

export default CollectionPieceVersionsEditForm;
