import React, { useState } from "react";
import {
  updateCollectionPieceVersionsForm,
  useCollectionPieceVersionsForm,
} from "@/context/collectionPieceVersionsFormContext";
import { SinglePieceVersionFormProvider } from "@/context/singlePieceVersionFormContext";
import SinglePieceVersionFormContainer from "@/features/feed/multiStepSinglePieceVersionForm/SinglePieceVersionFormContainer";
import TrashIcon from "@/ui/svg/TrashIcon";
import PlusIcon from "@/ui/svg/PlusIcon";
import {
  MMSourceOnPieceVersionsState,
  PieceState,
  PieceStateWithCollectionRank,
  PieceVersionState,
  TempoIndicationState,
} from "@/types/formTypes";
import EditIcon from "@/ui/svg/EditIcon";
import dynamic from "next/dynamic";
import { SinglePieceVersionFormState } from "@/types/singlePieceVersionFormTypes";
import CheckIcon from "@/ui/svg/CheckIcon";
import ArrowDownIcon from "@/ui/svg/ArrowDownIcon";
import ArrowUpIcon from "@/ui/svg/ArrowUpIcon";
import {
  NEED_CONFIRMATION_MODAL_ID,
  SINGLE_PIECE_VERSION_FORM_LOCAL_STORAGE_KEY,
} from "@/utils/constants";
import { localStorageRemoveItem } from "@/utils/localStorage";

type CollectionPieceVersionsEditFormProps = {
  isUpdateMode: boolean;
  isPreexistingCollectionUpdate: boolean;
  onSubmitSourceOnPieceVersions: (
    piecePieceVersions: MMSourceOnPieceVersionsState[],
  ) => void;
};

const NeedConfirmationModal = dynamic(
  () => import("@/ui/modal/NeedConfirmationModal"),
  { ssr: false },
);

function CollectionPieceVersionsEditForm({
  onSubmitSourceOnPieceVersions,
  isUpdateMode,
  isPreexistingCollectionUpdate,
}: CollectionPieceVersionsEditFormProps) {
  const { state, dispatch } = useCollectionPieceVersionsForm();
  const isSinglePieceVersionFormOpen =
    !!state.formInfo?.isSinglePieceVersionFormOpen;
  const [updateInitState, setUpdateInitState] =
    useState<SinglePieceVersionFormState | null>(null);

  const isSinglePieceUpdateMode = isUpdateMode;
  const collectionPieceVersions = state.mMSourceOnPieceVersions || [];
  const newPieceDefaultTitle = `${state?.collection?.title} No.${(state.mMSourceOnPieceVersions || []).length + 1}`;
  const composerId = state?.collection?.composerId;

  const getPieceVersionById = (pieceVersionId: string) =>
    state.pieceVersions?.find((pv) => pv.id === pieceVersionId);

  const getPieceById = (pieceId: string) =>
    state.pieces?.find((p) => p.id === pieceId);

  const getComposerById = (personId: string) =>
    state.persons?.find((person) => person.id === personId);

  const { pieceIdsNeedingVersions } = state.formInfo;
  const piecesNeedingVersion = pieceIdsNeedingVersions?.reduce<PieceState[]>(
    (list, pieceId) => {
      const piece = getPieceById(pieceId);
      if (!piece) {
        console.warn(
          `[CollectionPieceVersionsEditForm] piece not found for pieceIdNeedingVersion: ${pieceId}`,
        );
      }
      return piece?.collectionRank ? [...list, piece] : list;
    },
    [],
  ) as PieceStateWithCollectionRank[] | undefined;
  const isExistingCollectionAddingProcess =
    !!piecesNeedingVersion && piecesNeedingVersion.length > 0;
  const areAllNeededPieceVersionSet =
    isExistingCollectionAddingProcess &&
    piecesNeedingVersion?.every((piece) =>
      collectionPieceVersions.some(
        (cpv) => getPieceVersionById(cpv.pieceVersionId)?.pieceId === piece.id,
      ),
    );

  // For needConfirmation modal
  const [pieceVersionToDiscardId, setPieceVersionToDiscardId] = useState<
    string | null
  >();
  const isConfirmationModalOpened = !!pieceVersionToDiscardId;

  const onSinglePieceVersionFormOpen = () => {
    updateCollectionPieceVersionsForm(dispatch, "formInfo", {
      value: {
        isSinglePieceVersionFormOpen: true,
      },
    });
  };
  const onSinglePieceVersionFormClose = () => {
    setUpdateInitState(null);
    updateCollectionPieceVersionsForm(dispatch, "formInfo", {
      value: {
        isSinglePieceVersionFormOpen: false,
      },
    });
    localStorageRemoveItem(SINGLE_PIECE_VERSION_FORM_LOCAL_STORAGE_KEY);
  };

  const onEditCollectionPieceVersion = (
    collectionPieceVersion:
      | MMSourceOnPieceVersionsState
      | PieceStateWithCollectionRank,
  ) => {
    let pieceVersion, piece, rank;

    if ("pieceVersionId" in collectionPieceVersion) {
      // MMSourceOnPieceVersionsState
      const { pieceVersionId, rank: cpvRank } = collectionPieceVersion;
      pieceVersion = getPieceVersionById(pieceVersionId);
      piece = pieceVersion ? getPieceById(pieceVersion.pieceId) : undefined;
      rank = cpvRank;
    }

    if ("collectionRank" in collectionPieceVersion) {
      // PieceStateWithCollectionRank
      const { collectionRank } = collectionPieceVersion;
      piece = collectionPieceVersion;
      rank = collectionRank;
      pieceVersion = undefined;
    }

    if (!piece) {
      console.warn(
        `[CollectionPieceVersionsEditForm] onEditCollectionPieceVersion - piece not found`,
      );
      return;
    }

    // Build singlePieceVersionFormState
    const composer = getComposerById(piece.composerId);

    const singlePieceVersionFormEditState: SinglePieceVersionFormState = {
      formInfo: {
        currentStepRank: 0,
        mMSourceOnPieceVersionRank: rank,
      },
      composer,
      piece,
      pieceVersion,
    };
    setUpdateInitState(singlePieceVersionFormEditState);
    onSinglePieceVersionFormOpen();
  };

  const onDeletePieceVersionInit = (pieceVersionId: string) => {
    setPieceVersionToDiscardId(pieceVersionId);
  };

  const onDeletePieceVersion = (pieceVersionId) => {
    updateCollectionPieceVersionsForm(dispatch, "mMSourceOnPieceVersions", {
      deleteIdArray: [pieceVersionId],
      idKey: "pieceVersionId",
    });
    setPieceVersionToDiscardId(null);
  };

  const onMovePiece = (pieceVersionId: string, direction: "up" | "down") => {
    // Get the mMSourceOnPieceVersion for this piece version
    const mMSourceOnPieceVersion = (state.mMSourceOnPieceVersions || []).find(
      (spv) => spv.pieceVersionId === pieceVersionId,
    );

    if (!mMSourceOnPieceVersion) {
      console.log(`[onMovePiece] Piece version not found: ${pieceVersionId}`);
      return;
    }

    // Check boundaries based on direction
    if (direction === "up") {
      if (mMSourceOnPieceVersion.rank <= 1) {
        console.log(`[onMovePiece] Piece is already at the top`);
        return;
      }
    } else if (
      mMSourceOnPieceVersion.rank >=
      (state.mMSourceOnPieceVersions || []).length
    ) {
      console.log(`[onMovePiece] Piece is already at the bottom`);
      return;
    }

    // Move the piece
    updateCollectionPieceVersionsForm(dispatch, "mMSourceOnPieceVersions", {
      movePiece: {
        pieceVersionId,
        direction,
      },
    });
  };

  const onSubmit = () => {
    // Transfer from collection form to feed form
    onSubmitSourceOnPieceVersions(collectionPieceVersions);
    onSinglePieceVersionFormClose();
  };
  const onSinglePieceSubmit = (
    singlePieceVersionFormState: SinglePieceVersionFormState,
    options?: { isUpdateMode?: boolean },
  ) => {
    const { composer, piece, pieceVersion } = singlePieceVersionFormState;

    if (!piece || !pieceVersion) {
      console.error(
        `[CollectionPieceVersionsEditForm] onSinglePieceSubmit - missing piece or pieceVersion`,
        { piece, pieceVersion },
      );
      return;
    }

    // In case of update, we need to keep the existing rank of the mMSourceOnPieceVersion
    const mMSourceOnPieceVersionRank =
      singlePieceVersionFormState.formInfo.mMSourceOnPieceVersionRank;

    let finalRank: number;
    if (
      options?.isUpdateMode &&
      typeof mMSourceOnPieceVersionRank === "number"
    ) {
      finalRank = mMSourceOnPieceVersionRank;
    } else {
      finalRank = (state.mMSourceOnPieceVersions || []).length + 1; // Rank if added in a collection
    }

    if (composer) {
      updateCollectionPieceVersionsForm(dispatch, "persons", {
        array: [composer],
      });
    }

    const collectionAwarePiece: PieceState = {
      ...piece,
      ...(state.collection?.id ? { collectionId: state.collection.id } : {}),
      collectionRank: finalRank,
    };

    const collectionAwarePieceVersion: PieceVersionState = {
      ...pieceVersion,
      pieceId: collectionAwarePiece.id,
    };

    updateCollectionPieceVersionsForm(dispatch, "pieces", {
      array: [collectionAwarePiece],
    });

    updateCollectionPieceVersionsForm(dispatch, "pieceVersions", {
      array: [collectionAwarePieceVersion],
    });

    const tempoIndicationMap = new Map<string, TempoIndicationState>();
    collectionAwarePieceVersion.movements.forEach((movement) => {
      movement.sections.forEach((section) => {
        const tempoIndication = section.tempoIndication;
        if (tempoIndication?.id) {
          tempoIndicationMap.set(tempoIndication.id, tempoIndication);
        }
      });
    });

    const tempoIndications = Array.from(tempoIndicationMap.values());
    if (tempoIndications.length > 0) {
      updateCollectionPieceVersionsForm(dispatch, "tempoIndications", {
        array: tempoIndications,
      });
    }

    const payload: any = {
      idKey: "rank", // items with the same idKey value will be replaced by the payload corresponding items.
      array: [
        {
          pieceVersionId: collectionAwarePieceVersion.id,
          rank: finalRank,
        },
      ],
    };
    console.log(`[onSinglePieceSubmit] payload :`, payload);

    // idKey = "rank" is used to replace value in place when updating
    // For normal piece addition, we delete the idKey provided to avoid replacing the first piece forever
    if (!options?.isUpdateMode) {
      delete payload.idKey;
    }

    updateCollectionPieceVersionsForm(
      dispatch,
      "mMSourceOnPieceVersions",
      payload,
    );
  };

  return (
    <>
      {isSinglePieceVersionFormOpen ? (
        <>
          <SinglePieceVersionFormProvider initialState={updateInitState}>
            <SinglePieceVersionFormContainer
              onFormClose={onSinglePieceVersionFormClose}
              onSubmit={onSinglePieceSubmit}
              isCollectionMode={true}
              isCollectionUpdateMode={isUpdateMode}
              collectionId={state.collection?.id}
              collectionFormState={state}
              newPieceDefaultTitle={newPieceDefaultTitle}
              composerId={composerId}
            />
          </SinglePieceVersionFormProvider>
          <div className="grid grid-cols-2 gap-4 items-center mt-6 w-full max-w-2xl">
            <button
              className="btn btn-warning"
              type="button"
              onClick={onSinglePieceVersionFormClose}
            >
              <TrashIcon className="w-4 h-4" />
              {`Discard${isSinglePieceUpdateMode ? ` updating ` : ""} this piece`}
            </button>
          </div>
        </>
      ) : (
        <>
          {isExistingCollectionAddingProcess && (
            <>
              <ul className="my-4 space-y-4">
                {piecesNeedingVersion
                  .toSorted((a, b) =>
                    a.collectionRank > b.collectionRank ? 1 : -1,
                  )
                  .map((piece, index) => {
                    const isPieceVersionSet = collectionPieceVersions.some(
                      (cpv) =>
                        getPieceVersionById(cpv.pieceVersionId)?.pieceId ===
                        piece.id,
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
              <div className="flex gap-4 items-center mt-6">
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={onSubmit}
                  disabled={!areAllNeededPieceVersionSet}
                >
                  {`Submit (${areAllNeededPieceVersionSet ? "all pieces set" : "some pieces not set"})`}
                </button>
              </div>
            </>
          )}
          {!isExistingCollectionAddingProcess && (
            <>
              <ul className="my-4 space-y-4">
                {collectionPieceVersions.map(
                  (collectionPieceVersion, index) => {
                    const pieceVersion = getPieceVersionById(
                      collectionPieceVersion.pieceVersionId,
                    );
                    const piece = pieceVersion
                      ? getPieceById(pieceVersion.pieceId)
                      : undefined;

                    if (!pieceVersion || !piece) {
                      console.warn(
                        `[CollectionPieceVersionsEditForm] Cannot render piece row: missing pieceVersion or piece for pieceVersionId ${collectionPieceVersion.pieceVersionId}`,
                      );
                      return null;
                    }

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
                                    <ArrowUpIcon className="w-4 h-4" />
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
                                    <ArrowDownIcon className="w-4 h-4" />
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
                    onClick={onSinglePieceVersionFormOpen}
                  >
                    <PlusIcon className="w-4 h-4" />
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
        modalId={NEED_CONFIRMATION_MODAL_ID}
        onConfirm={() => onDeletePieceVersion(pieceVersionToDiscardId)}
        onCancel={() => setPieceVersionToDiscardId(null)}
        description={`Delete a piece version from the collection`}
        isOpened={isConfirmationModalOpened}
      />
    </>
  );
}

export default CollectionPieceVersionsEditForm;
