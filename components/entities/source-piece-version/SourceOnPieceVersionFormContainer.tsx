import { useState } from "react";
import {
  MMSourcePieceVersionsState,
  SourceOnPieceVersionsFormType,
} from "@/types/formTypes";
import PlusIcon from "@/components/svg/PlusIcon";
import MMSourceFormStepNavigation from "@/components/multiStepMMSourceForm/MMSourceFormStepNavigation";
import SinglePieceVersionFormContainer from "@/components/multiStepSinglePieceVersionForm/SinglePieceVersionFormContainer";
import {
  getEntityByIdOrKey,
  updateFeedForm,
  useFeedForm,
} from "@/components/context/feedFormContext";
import TrashIcon from "@/components/svg/TrashIcon";
import QuestionMarkCircleIcon from "@/components/svg/QuestionMarkCircleIcon";
import {
  SinglePieceVersionFormProvider,
  SinglePieceVersionFormState,
} from "@/components/context/SinglePieceVersionFormContext";
import { CollectionPieceVersionsFormProvider } from "@/components/context/CollectionPieceVersionsFormContext";
import getPersonName from "@/components/entities/person/utils/getPersonName";
import CollectionPieceVersionsFormContainer from "@/components/multiStepCollectionPieceVersionsForm/CollectionPieceVersionsFormContainer";
import EditIcon from "@/components/svg/EditIcon";
import dynamic from "next/dynamic";
import { CollectionPieceVersionsFormState } from "@/types/collectionPieceVersionFormTypes";

type SourcePieceVersionSelectFormProps = {
  mMSourcePieceVersions?: MMSourcePieceVersionsState[];
  onSubmit: (option: { goToNextStep: boolean }) => void;
  submitTitle?: string;
  title?: string;
};

const needConfirmationModalId = "need-confirmation-modal";
const NeedConfirmationModal = dynamic(
  () => import("@/components/NeedConfirmationModal"),
  { ssr: false },
);

const SourceOnPieceVersionFormContainer = ({
  mMSourcePieceVersions = [],
  onSubmit,
  submitTitle,
  title,
}: SourcePieceVersionSelectFormProps) => {
  const { state: feedFormState, dispatch: feedFormDispatch } = useFeedForm();
  const [formType, setFormType] =
    useState<SourceOnPieceVersionsFormType>("none");
  const [
    singlePieceVersionUpdateInitState,
    setSinglePieceVersionUpdateInitState,
  ] = useState<SinglePieceVersionFormState | null>(null);
  const [
    collectionPieceVersionUpdateInitState,
    setCollectionPieceVersionUpdateInitState,
  ] = useState<CollectionPieceVersionsFormState | null>(null);
  const isUpdateMode = !!(
    singlePieceVersionUpdateInitState || collectionPieceVersionUpdateInitState
  );
  const isFormOpen = !!feedFormState.formInfo?.isSourceOnPieceVersionformOpen;
  const isIntro =
    feedFormState?.mMSourcePieceVersions?.length === 0 && !isFormOpen;

  // For needConfirmation modal
  const [pieceVersionToDiscardId, setPieceVersionToDiscardId] = useState<
    string | null
  >();
  const [collectionToDiscardId, setCollectionToDiscardId] = useState<
    string | null
  >();
  const isConfirmationModalOpened =
    !!pieceVersionToDiscardId || !!collectionToDiscardId;

  const onFormOpen = (formType: "single" | "collection") => {
    setFormType(formType);
    updateFeedForm(feedFormDispatch, "formInfo", {
      value: { isSourceOnPieceVersionformOpen: true },
    });
  };

  const onFormClose = () => {
    // reset sourceOnPieceVersionForm and singlePieceVersionUpdateInitState
    setFormType("none");
    setSinglePieceVersionUpdateInitState(null);
    setCollectionPieceVersionUpdateInitState(null);

    // Close sourceOnPieceVersions form
    updateFeedForm(feedFormDispatch, "formInfo", {
      value: { isSourceOnPieceVersionformOpen: false },
    });
  };

  const onEditMMSourcePieceVersion = (
    mmSourceOnPieceVersion: MMSourcePieceVersionsState,
  ) => {
    const { pieceVersionId, rank } = mmSourceOnPieceVersion;

    // Build singlePieceVersionFormState
    const pieceVersion = getEntityByIdOrKey(
      feedFormState,
      "pieceVersions",
      pieceVersionId,
    );
    const piece = getEntityByIdOrKey(
      feedFormState,
      "pieces",
      pieceVersion.pieceId,
    );
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
      pieceVersion: {
        id: pieceVersion.id,
      },
    };
    setSinglePieceVersionUpdateInitState(singlePieceVersionFormEditState);
    onFormOpen("single");
  };
  const onDeletePieceVersionInit = (pieceVersionId: string) => {
    setPieceVersionToDiscardId(pieceVersionId);
  };
  const onDeletePieceVersion = (pieceVersionId) => {
    updateFeedForm(feedFormDispatch, "mMSourcePieceVersions", {
      deleteIdArray: [pieceVersionId],
      idKey: "pieceVersionId",
    });
    setPieceVersionToDiscardId(null);
  };

  const onEditCollection = (collectionId: string) => {
    const collectionPieceVersionList = feedFormState.pieceVersions?.filter(
      (pv) =>
        feedFormState.pieces?.some(
          (p) => p.id === pv.pieceId && p.collectionId === collectionId,
        ),
    );
    const collectionMMSourcePieceVersionList =
      feedFormState.mMSourcePieceVersions?.filter((mMSourcePieceVersions) =>
        collectionPieceVersionList?.some(
          (pv) => pv.id === mMSourcePieceVersions.pieceVersionId,
        ),
      );
    const collectionFirstMMSourceOnPieceVersionRank =
      collectionMMSourcePieceVersionList?.[0]?.rank;
    if (!collectionFirstMMSourceOnPieceVersionRank) {
      console.log(
        `[onEditCollection] No piece version rank found for collection ${collectionId}`,
      );
      return;
    }

    const collection = feedFormState.collections?.find(
      ({ id }) => id === collectionId,
    );
    if (!collection) {
      console.log(`[onEditCollection] Collection not found`);
      return;
    }

    const collectionPieceVersionFormEditState: CollectionPieceVersionsFormState =
      {
        formInfo: {
          currentStepRank: 0,
          collectionFirstMMSourceOnPieceVersionRank,
        },
        collection: {
          id: collectionId,
          composerId: collection.composerId,
          ...(collection.title && { title: collection.title }),
        },
        mMSourcePieceVersions: collectionMMSourcePieceVersionList.map(
          (spv, index) => ({ ...spv, rank: index + 1 }),
        ),
      };
    setCollectionPieceVersionUpdateInitState(
      collectionPieceVersionFormEditState,
    );
    onFormOpen("collection");
  };
  const onDeleteCollectionInit = (collectionId: string) => {
    setCollectionToDiscardId(collectionId);
  };
  const onDeleteCollection = (collectionId) => {
    // mMSourcePieceVersions to be deleted are selected by their pieceVersionId
    const pieceVersionIdListToDelete = (feedFormState.pieceVersions || [])
      .filter((pv) =>
        feedFormState.pieces?.some(
          (p) => p.id === pv.pieceId && p.collectionId === collectionId,
        ),
      )
      .map((pv) => pv.id);

    updateFeedForm(feedFormDispatch, "mMSourcePieceVersions", {
      deleteIdArray: pieceVersionIdListToDelete,
      idKey: "pieceVersionId",
    });
    setCollectionToDiscardId(null);
  };

  const onMoveCollection = (collectionId: string, direction: "up" | "down") => {
    // Get all piece versions in this collection
    const collectionPieceVersionIds = (feedFormState.pieceVersions || [])
      .filter((pv) =>
        feedFormState.pieces?.some(
          (p) => p.id === pv.pieceId && p.collectionId === collectionId,
        ),
      )
      .map((pv) => pv.id);

    // Get all mMSourcePieceVersions for this collection
    const collectionMMSourcePieceVersions = (
      feedFormState.mMSourcePieceVersions || []
    ).filter((spv) => collectionPieceVersionIds.includes(spv.pieceVersionId));

    if (collectionMMSourcePieceVersions.length === 0) {
      console.log(
        `[onMoveCollection] No piece versions found for collection ${collectionId}`,
      );
      return;
    }

    // Check boundaries based on direction
    if (direction === "up") {
      const firstRank = Math.min(
        ...collectionMMSourcePieceVersions.map((spv) => spv.rank),
      );

      if (firstRank <= 1) {
        console.log(`[onMoveCollection] Collection is already at the top`);
        return;
      }
    } else {
      const lastRank = Math.max(
        ...collectionMMSourcePieceVersions.map((spv) => spv.rank),
      );

      if (lastRank >= (feedFormState.mMSourcePieceVersions || []).length) {
        console.log(`[onMoveCollection] Collection is already at the bottom`);
        return;
      }
    }

    // Move the collection
    updateFeedForm(feedFormDispatch, "mMSourcePieceVersions", {
      moveCollection: {
        collectionId,
        direction,
      },
    });
  };

  const onMovePiece = (pieceVersionId: string, direction: "up" | "down") => {
    // Get the mMSourcePieceVersion for this piece version
    const mMSourcePieceVersion = (
      feedFormState.mMSourcePieceVersions || []
    ).find((spv) => spv.pieceVersionId === pieceVersionId);

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
        mMSourcePieceVersion.rank >=
        (feedFormState.mMSourcePieceVersions || []).length
      ) {
        console.log(`[onMovePiece] Piece is already at the bottom`);
        return;
      }
    }

    // Move the piece
    updateFeedForm(feedFormDispatch, "mMSourcePieceVersions", {
      movePiece: {
        pieceVersionId,
        direction,
      },
    });
  };

  return (
    <>
      {isIntro ? (
        <div className="w-full prose">
          <h1>{title}</h1>
          <p>
            {`In this section you will describe, in order, the pieces that are part of your MM Source.`}
          </p>
          <p>
            If your source contains a complete <i>collection</i> of pieces, like
            a complete opus, choose the corresponding option below and you will
            be guided to describe this collection and its pieces.
          </p>
          <p>
            You can access the help section at any time clicking in the{" "}
            <label
              htmlFor="my-drawer-4"
              className="drawer-button btn btn-link h-auto min-h-fit px-0 align-bottom"
            >
              <QuestionMarkCircleIcon className="w-7 h-7" />
            </label>{" "}
            button here or in the header.
          </p>
        </div>
      ) : null}
      {isFormOpen && (
        <>
          <h1 className="mb-4 text-4xl font-bold">{title}</h1>
          {formType === "single" && (
            <SinglePieceVersionFormProvider
              initialState={singlePieceVersionUpdateInitState}
            >
              <SinglePieceVersionFormContainer
                onFormClose={onFormClose}
                isUpdateMode={isUpdateMode}
              />
            </SinglePieceVersionFormProvider>
          )}
          {formType === "collection" && (
            <CollectionPieceVersionsFormProvider
              initialState={collectionPieceVersionUpdateInitState}
            >
              <CollectionPieceVersionsFormContainer
                onFormClose={onFormClose}
                isUpdateMode={isUpdateMode}
              />
            </CollectionPieceVersionsFormProvider>
          )}
          <div className="grid grid-cols-2 gap-4 items-center mt-6 w-full max-w-2xl">
            <button
              className="btn btn-accent"
              type="button"
              onClick={() => onFormClose()}
            >
              <TrashIcon className="w-5 h-5" />
              {`${isUpdateMode ? `Cancel updating ` : "Discard"} this ${formType === "single" ? "piece" : "whole collection"}`}
            </button>
          </div>
        </>
      )}
      {!isFormOpen && (
        <>
          {!isIntro && <h1 className="mb-4 text-4xl font-bold">{title}</h1>}
          <ul className="my-4 max-w-[65ch] space-y-4">
            {processMMSourcePieceVersionsForDisplay(
              mMSourcePieceVersions,
              feedFormState,
            ).map((group, groupIndex) => {
              if (group.type === "collection") {
                // Get composer from the first piece (since all pieces in collection have same composer)
                const composer = group.items[0]?.composer;

                return (
                  <li key={`collection-${group.collection.id}-${groupIndex}`}>
                    {/* Collection Container with unified border */}
                    <div className="border-l-2 border-l-primary rounded-lg overflow-hidden border border-base-300 hover:shadow-sm hover:bg-primary/5 transition-all duration-150">
                      {/* Collection Header */}
                      <div className="px-4 py-3 bg-primary/10 border-b border-primary/20">
                        <div className="flex gap-4 items-center justify-between">
                          <div>
                            <h3 className="text-base font-bold text-primary mb-1">
                              {group.collection.title}
                              <span className="text-base font-normal">
                                {composer && ` - ${getPersonName(composer)}`}
                              </span>
                            </h3>
                            <div className="text-sm text-primary/70 font-medium">
                              Collection • {group.items.length} piece
                              {group.items.length > 1 ? "s" : ""}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-ghost hover:bg-accent hover:text-neutral"
                              onClick={() => {
                                onEditCollection(group.collection.id);
                              }}
                            >
                              <EditIcon className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-ghost hover:bg-error hover:text-neutral"
                              onClick={() => {
                                onDeleteCollectionInit(group.collection.id);
                              }}
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-ghost disabled:bg-transparent"
                              onClick={() => {
                                onMoveCollection(group.collection.id, "up");
                              }}
                              disabled={groupIndex === 0}
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-ghost disabled:bg-transparent"
                              onClick={() => {
                                onMoveCollection(group.collection.id, "down");
                              }}
                              disabled={
                                groupIndex ===
                                processMMSourcePieceVersionsForDisplay(
                                  mMSourcePieceVersions,
                                  feedFormState,
                                ).length -
                                  1
                              }
                            >
                              ↓
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Collection Pieces */}
                      <div className="py-1">
                        {group.items.map((item) => (
                          <div
                            key={`${groupIndex}-${item.mMSourcePieceVersion.pieceVersionId}-${item.mMSourcePieceVersion.rank}`}
                            className="px-6 py-2"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex-grow">
                                <h4 className="text-base font-medium text-secondary">
                                  {`${item.mMSourcePieceVersion.rank} - ${item.piece.title}`}
                                </h4>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </li>
                );
              } else {
                // Single piece (not part of a collection)
                const item = group.items[0];
                return (
                  <li
                    key={`single-${item.mMSourcePieceVersion.pieceVersionId}-${item.mMSourcePieceVersion.rank}`}
                  >
                    <div className="px-4 py-3 border border-base-300 rounded-lg hover:border-base-400 hover:shadow-sm hover:bg-primary/5 transition-all duration-150">
                      <div className="flex gap-4 items-center justify-between">
                        <div className="flex-grow">
                          <h4 className="text-base font-bold text-secondary">
                            {`${item.mMSourcePieceVersion.rank} - ${item.piece.title}`}
                            <span className="text-base font-normal">
                              {!!item.composer &&
                                ` - ${getPersonName(item.composer)}`}
                            </span>
                          </h4>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost hover:bg-accent hover:text-neutral"
                            onClick={() =>
                              onEditMMSourcePieceVersion(
                                item.mMSourcePieceVersion,
                              )
                            }
                          >
                            <EditIcon className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost hover:bg-error hover:text-neutral"
                            onClick={() =>
                              onDeletePieceVersionInit(
                                item.mMSourcePieceVersion.pieceVersionId,
                              )
                            }
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost disabled:bg-transparent"
                            onClick={() =>
                              onMovePiece(
                                item.mMSourcePieceVersion.pieceVersionId,
                                "up",
                              )
                            }
                            disabled={item.mMSourcePieceVersion.rank === 1}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost disabled:bg-transparent"
                            onClick={() =>
                              onMovePiece(
                                item.mMSourcePieceVersion.pieceVersionId,
                                "down",
                              )
                            }
                            disabled={
                              item.mMSourcePieceVersion.rank ===
                              mMSourcePieceVersions.length
                            }
                          >
                            ↓
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              }
            })}
          </ul>

          <div className="flex gap-4 items-center mt-6">
            <button
              className="btn btn-accent"
              type="button"
              onClick={() => onFormOpen("single")}
            >
              <PlusIcon className="w-5 h-5" />
              Add a single piece
            </button>
            <button
              className="btn btn-accent"
              type="button"
              onClick={() => onFormOpen("collection")}
            >
              <PlusIcon className="w-5 h-5" />
              Add a complete collection
            </button>
          </div>
          <MMSourceFormStepNavigation
            onSave={() => onSubmit({ goToNextStep: false })}
            onSaveAndGoToNextStep={() => onSubmit({ goToNextStep: true })}
            isNextDisabled={!(mMSourcePieceVersions.length > 0 && !isFormOpen)}
            submitTitle={submitTitle}
            onGoToPrevStep={onFormClose}
          />
          <NeedConfirmationModal
            modalId={needConfirmationModalId}
            onConfirm={() =>
              collectionToDiscardId
                ? onDeleteCollection(collectionToDiscardId)
                : onDeletePieceVersion(pieceVersionToDiscardId)
            }
            onCancel={() =>
              collectionToDiscardId
                ? setCollectionToDiscardId(null)
                : setPieceVersionToDiscardId(null)
            }
            description={`Delete ${collectionToDiscardId ? `an entire collection` : `a piece version`} from the source`}
            isOpened={isConfirmationModalOpened}
          />
        </>
      )}
    </>
  );
};

export default SourceOnPieceVersionFormContainer;

// First, let's create a utility function to process the data
function processMMSourcePieceVersionsForDisplay(
  mMSourcePieceVersions: MMSourcePieceVersionsState[],
  feedFormState: any,
) {
  const processedGroups: Array<{
    type: "collection" | "single";
    collection?: any;
    items: Array<{
      mMSourcePieceVersion: MMSourcePieceVersionsState;
      pieceVersion: any;
      piece: any;
      composer: any;
      collection?: any;
    }>;
  }> = [];

  let currentGroup: (typeof processedGroups)[0] | null = null;

  mMSourcePieceVersions.forEach((mMSourcePieceVersion) => {
    const pieceVersion = getEntityByIdOrKey(
      feedFormState,
      "pieceVersions",
      mMSourcePieceVersion.pieceVersionId,
    );
    const piece = getEntityByIdOrKey(
      feedFormState,
      "pieces",
      pieceVersion.pieceId,
    );
    const collection = getEntityByIdOrKey(
      feedFormState,
      "collections",
      piece.collectionId,
    );
    const composer = getEntityByIdOrKey(
      feedFormState,
      "persons",
      piece.composerId,
    );

    const item = {
      mMSourcePieceVersion,
      pieceVersion,
      piece,
      composer,
      collection,
    };

    // If this piece has a collection
    if (collection) {
      // If we don't have a current group or the current group is for a different collection
      if (
        !currentGroup ||
        currentGroup.type !== "collection" ||
        currentGroup.collection?.id !== collection.id
      ) {
        // Start a new collection group
        currentGroup = {
          type: "collection",
          collection,
          items: [item],
        };
        processedGroups.push(currentGroup);
      } else {
        // Add to the existing collection group
        currentGroup.items.push(item);
      }
    } else {
      // This is a single piece (no collection)
      currentGroup = {
        type: "single",
        items: [item],
      };
      processedGroups.push(currentGroup);
      currentGroup = null; // Reset since single pieces don't continue grouping
    }
  });

  return processedGroups;
}
