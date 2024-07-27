import { useEffect, useState } from "react";
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
  FeedFormState,
  getEntityByIdOrKey,
} from "@/components/context/feedFormContext";
import CollectionPieceVersionsEditForm from "@/components/entities/piece-version/CollectionPieceVersionsEditForm";

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
};

export default function CollectionPieceVersionSelectOrCreate({
  feedFormState,
  onAddPieces,
  onAddPieceVersion,
  onSubmitPiecePieceVersions,
  onSubmitSourceOnPieceVersions,
  selectedCollectionId,
}: CollectionPieceVersionSelectOrCreateProps) {
  const [pieces, setPieces] = useState<PieceState[]>();
  const [isLoading, setIsLoading] = useState(true);
  const [isCreation, setIsCreation] = useState(false);
  const isNewCollection = (
    getNewEntities(feedFormState, "collections") || []
  ).some((c) => c.id === selectedCollectionId && c.isNew);

  const storePieces = (pieces: PieceState[]) => {
    onAddPieces(pieces);
    setPieces(pieces);
  };

  useEffect(() => {
    if (isNewCollection) {
      setIsLoading(false);
      setIsCreation(true);
    }
  }, [isNewCollection]);

  useEffect(() => {
    if (selectedCollectionId && !isNewCollection) {
      fetch(
        `${URL_API_GETALL_COLLECTION_PIECES}?collectionId=${selectedCollectionId}`,
      )
        .then((res) => res.json())
        .then((data) => {
          storePieces(data.pieces);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error(
            `[fetch(/api/getAll/collectionPieces?collectionId=${selectedCollectionId})] err :`,
            err,
          );
          setIsLoading(false);
        });
    }
  }, []);

  if (isLoading) return <div>Loading...</div>;

  if (isCreation) {
    // We have a new Collection, so All of its Pieces must be created
    return (
      <CollectionPieceVersionsEditForm
        onSubmitSourceOnPieceVersions={onSubmitSourceOnPieceVersions}
      />
    );
  }

  if (!isCreation) {
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
