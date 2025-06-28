import React, { useCallback, useEffect, useState } from "react";
import {
  MMSourcePieceVersionsState,
  PiecePieceVersion,
  PieceState,
  PieceVersionState,
} from "@/types/formTypes";
import CollectionPieceVersionsSelectFormContainer from "@/components/entities/piece-version/CollectionPieceVersionsSelectFormContainer";
import { URL_API_GETALL_COLLECTION_PIECES } from "@/utils/routes";
import {
  getNewEntities,
  getEntityByIdOrKey,
} from "@/components/context/feedFormContext";
import CollectionPieceVersionsEditForm from "@/components/entities/piece-version/CollectionPieceVersionsEditForm";
import Loader from "@/components/Loader";
import { FeedFormState } from "@/types/feedFormTypes";
import { CollectionPieceVersionsFormState } from "@/types/collectionPieceVersionFormTypes";

type CollectionPieceVersionSelectOrCreateProps = {
  feedFormState: FeedFormState;
  selectedCollectionId: string;
  onAddPieces: (pieces: PieceState[]) => void;
  onAllPieceVersionsSelected: (pieceVersions: PieceState[]) => void;
  onAddPieceVersion: (pieceVersion: PieceVersionState) => void;
  onSubmitPiecePieceVersions: (piecePieceVersions: PiecePieceVersion[]) => void;
  onSubmitSourceOnPieceVersions: (
    piecePieceVersions: MMSourcePieceVersionsState[],
  ) => void;
  collectionPieceVersionFormState: CollectionPieceVersionsFormState;
  isUpdateMode: boolean;
};

export default function CollectionPieceVersionSelectOrCreate({
  feedFormState,
  onAddPieces,
  onAddPieceVersion,
  onSubmitPiecePieceVersions,
  onSubmitSourceOnPieceVersions,
  selectedCollectionId,
  collectionPieceVersionFormState,
  isUpdateMode,
}: CollectionPieceVersionSelectOrCreateProps) {
  const [pieces, setPieces] = useState<PieceState[]>();

  const isCollectionNew = (
    getNewEntities(feedFormState, "collections", {
      includeUnusedInFeedForm: true,
    }) || []
  ).some((c) => c.id === selectedCollectionId);

  const [isLoading, setIsLoading] = useState(!isCollectionNew);
  const [isEditMode, setIsEditMode] = useState(isCollectionNew);

  const settledCollectionPieceVersions =
    collectionPieceVersionFormState.mMSourcePieceVersions || [];

  const areAllPieceVersionsSet =
    !!pieces &&
    pieces.every((p) =>
      settledCollectionPieceVersions.some((cpv) => {
        const pieceVersion = feedFormState.pieceVersions?.find(
          (pv) => pv.id === cpv.pieceVersionId,
        );
        return pieceVersion?.pieceId === p.id;
      }),
    );

  if (isUpdateMode && pieces && !areAllPieceVersionsSet) {
    console.warn(`[isUpdateMode && !areAllPieceVersionsSet]`);
  }

  const storePieces = useCallback(
    (pieces: PieceState[]) => {
      onAddPieces(pieces);
      setPieces(pieces);
    },
    [onAddPieces],
  );

  useEffect(() => {
    if (selectedCollectionId && !isCollectionNew) {
      fetch(
        `${URL_API_GETALL_COLLECTION_PIECES}?collectionId=${selectedCollectionId}`,
      )
        .then((res) => res.json())
        .then((data) => {
          storePieces(data.pieces);
        })
        .catch((err) => {
          console.error(
            `[fetch(/api/getAll/collectionPieces?collectionId=${selectedCollectionId})] err :`,
            err,
          );
        })
        .finally(() => setIsLoading(false));
    }
  }, [isCollectionNew, selectedCollectionId, storePieces]);

  if (isLoading) return <Loader />;

  if (isEditMode || isUpdateMode) {
    // We have a new Collection, so All of its Pieces must be created
    return (
      <CollectionPieceVersionsEditForm
        onSubmitSourceOnPieceVersions={onSubmitSourceOnPieceVersions}
        isUpdateMode={isUpdateMode}
        isPreexistingCollectionUpdate={isUpdateMode && !isCollectionNew}
      />
    );
  }

  if (!isEditMode) {
    if (!pieces) {
      return <div>No pieces found for this collection.</div>;
    }

    // The collection exists, so we have to go through its pieces and select or created the pieceVersions of the edited MMSource
    const collection = getEntityByIdOrKey(
      feedFormState,
      "collections",
      selectedCollectionId,
    );

    return (
      <>
        <h2 className="text-3xl font-bold mb-5">{`Collection: ${collection.title} (${pieces.length} pieces)`}</h2>
        <CollectionPieceVersionsSelectFormContainer
          pieces={pieces}
          feedFormState={feedFormState}
          onAddPieceVersion={onAddPieceVersion}
          onSubmitPiecePieceVersions={onSubmitPiecePieceVersions}
        />
      </>
    );
  }
}
