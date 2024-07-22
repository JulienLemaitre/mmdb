import { useEffect, useState } from "react";
// import { Piece } from "@prisma/client";
// import { useFeedForm } from "@/components/context/feedFormContext";
// import { getNewEntities } from "@/components/context/CollectionPieceVersionsFormContext";
import { PieceState } from "@/types/formTypes";
// import {
//   getNewEntities,
//   useCollectionPieceVersionsForm,
// } from "@/components/context/CollectionPieceVersionsFormContext";
import CollectionPieceVersionsSelectFormContainer from "@/components/entities/piece-version/CollectionPieceVersionsSelectFormContainer";
import { URL_API_GETALL_COLLECTION_PIECES } from "@/utils/routes";
import {
  getNewEntities,
  FeedFormState,
  getEntityByIdOrKey,
} from "@/components/context/feedFormContext";

type CollectionPieceVersionSelectOrCreateProps = {
  feedFormState: FeedFormState;
  selectedCollectionId: string;
  onAllPieceVersionsSelected: (pieceVersions: PieceState[]) => void;
};

export default function CollectionPieceVersionSelectOrCreate({
  feedFormState,
  onAllPieceVersionsSelected,
  selectedCollectionId,
}: CollectionPieceVersionSelectOrCreateProps) {
  const [pieces, setPieces] = useState<PieceState[]>();
  const [isLoading, setIsLoading] = useState(true);
  const [isCreation, setIsCreation] = useState(false);
  // const { state: feedFormState } = useFeedForm();
  const isNewCollection = (
    getNewEntities(feedFormState, "collections") || []
  ).some((c) => c.id === selectedCollectionId && c.isNew);

  useEffect(() => {
    if (isNewCollection) {
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
          setPieces(data.pieces);
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
    // We have a new Collection, so Every Pieces have to be created
    return <div>No pieces found for this collection.</div>;
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
        />
      </>
    );
  }
}
